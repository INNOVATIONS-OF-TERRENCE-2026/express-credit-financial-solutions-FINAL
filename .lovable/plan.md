
# Express Credit CRM — Surgical Upgrade Plan

I analyzed the existing build before writing this. Production architecture (auth, routes, Supabase client, RLS, War Board, dispute pipeline) stays intact. Every change is additive or surgical to existing components.

## What's already in place (verified)
- `client_activity_timeline` table — already has `activity_type`, `visible_to_client`, `metadata`
- `audit_logs` table + `log_security_event` RPC — already records actions, table, user, timestamps
- `client_agreements` table — has `signature_data`, `signed_at`, `agreement_version`
- `client-agreements` storage bucket — exists
- `user_onboarding` table — exists with step tracking
- `DigitalSignature.tsx`, `ClientAgreementModal.tsx`, `ClientActivityTimeline.tsx` — present and wired
- `credit_reports` table — has `file_name`, `storage_path`, `uploaded_at` per client (already supports version history by row)

So most of this is wiring + UI, not new infra.

---

## 1. Timeline Filters (Client Dashboard)
File: `src/components/ClientActivityTimeline.tsx`
- Add a filter chip row: All / Documents / AI & Agent / Disputes / Notes
- Maps to `activity_type` values already used (`document_uploaded`, `ai_response`, `dispute_status`, `note`, etc.)
- Filters client-side from already-fetched rows; no schema change

## 2. PDF Version History
Files: `src/components/AdminCreditReportManager.tsx` (or new `CreditReportVersionHistory.tsx`)
- `credit_reports` already stores every upload as a row per `client_id`. Group by client and order by `uploaded_at` DESC
- New "Version History" drawer in admin editor showing all uploads, with:
  - Download (signed URL from `credit-reports` bucket)
  - "Restore as current" button — sets a new `is_current` flag (one column add) and duplicates the row to the top, never deleting prior versions
- Migration (additive only): `ALTER TABLE credit_reports ADD COLUMN is_current boolean DEFAULT true, ADD COLUMN version integer`
- Trigger: on insert, increment version per client_id

## 3. Admin Audit Log Panel
File: new `src/components/AdminAuditLogPanel.tsx`, plugged into `AdminDashboard.tsx`
- Reads from existing `audit_logs` table — no schema change
- Filters: action type (MEMBERSHIP_CHANGE / CLIENT_UPDATE / DISPUTE_STATUS / FILE_UPLOAD / etc.), date range, admin user
- Adds three new logging calls (in `AdminClientEditor.tsx` and dispute status update handlers) via existing `log_security_event` RPC so membership/field/dispute changes are captured going forward
- Shows: who, what changed (diff in details jsonb), when

## 4. Client Onboarding Checklist
File: new `src/components/OnboardingChecklist.tsx` on `ClientPortal.tsx`
Steps derived from existing data (no new tables needed):
- Profile complete (profiles.first_name/last_name/dob set)
- Identity uploaded (client_documents where document_type='government_id' status='verified')
- SSN on file (client_documents document_type='ssn')
- Credit report uploaded (credit_reports row exists)
- Service agreement signed (client_agreements row exists)
- First dispute submitted (dispute_letters row exists)
- Each row links to its action; progress bar at top

## 5. Signature Fix (CRITICAL)
Audit findings from current code:
- `DigitalSignature.tsx` captures signature but `ClientAgreementModal` may not be persisting `client_id` correctly (only `user_id`)
- Fix path:
  1. `ClientAgreementModal.tsx` — on submit, also resolve `client_id` from `clients` table by `user_id` and store on `client_agreements` (add column if missing)
  2. Upload rendered signed PDF to `client-agreements` bucket at `{client_id}/{timestamp}-agreement.pdf` using `jspdf` (already in deps)
  3. Insert `client_agreements` row with `signature_data` (base64 PNG), `signed_pdf_path`, `client_id`, `user_id`, `signed_at`, `agreement_version`, `ip_address`
  4. Log to `audit_logs` via `log_security_event`
  5. Surface signed agreement in admin: list on `AdminClientEditor.tsx` with download link
- Migration (additive): `ALTER TABLE client_agreements ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id), ADD COLUMN IF NOT EXISTS signed_pdf_path text`
- Storage RLS: ensure `client-agreements` bucket has policies for authenticated user to upload to their own folder and admins to read all (additive policies only — no DROP)

## 6. Dashboard / Portal / War Board Polish (cosmetic + UX)
NOT a rebuild. Targeted improvements only:
- `ClientPortal.tsx` — collapse cards into clean tabs: Overview / Documents / Disputes / Timeline / Agreement, mobile-first sizing (already large buttons, keep). Add the OnboardingChecklist at top.
- `AdminDashboard.tsx` — top-bar quick actions (Upload, Add Client, View Audit Log, Open War Board). Add the AuditLogPanel as a new tab.
- `AdminWarBoard.tsx` — bigger touch targets, sticky filter bar, status legend; no behavior changes
- `AdminClientEditor.tsx` — add quick-edit inline controls for membership tier (already exists; wire audit log) + "Version History" + "Agreements" sections
- All work uses existing semantic tokens — no new color values, no theme changes

---

## Files modified
- `src/components/ClientActivityTimeline.tsx`
- `src/components/AdminCreditReportManager.tsx` + new `CreditReportVersionHistory.tsx`
- new `src/components/AdminAuditLogPanel.tsx`
- new `src/components/OnboardingChecklist.tsx`
- `src/components/ClientAgreementModal.tsx`, `DigitalSignature.tsx`
- `src/components/AdminClientEditor.tsx`
- `src/components/ClientPortal.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/components/AdminWarBoard.tsx` (cosmetic)

## Migrations (additive only)
1. `credit_reports`: add `is_current bool`, `version int` + per-client version trigger
2. `client_agreements`: add `client_id uuid`, `signed_pdf_path text`
3. Storage policies for `client-agreements` (additive INSERT/SELECT for owner + admin)

## Safety guardrails
- No auth/router/RLS rewrites
- No DROP of existing policies, tables, or columns
- No service_role exposure
- TypeScript strict, semantic tokens only
- All existing flows preserved; new UI only adds entry points

Once approved I'll execute migrations first, then code in a single pass.
