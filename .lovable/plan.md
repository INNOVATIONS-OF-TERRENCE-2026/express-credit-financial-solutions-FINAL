

# 🔥 GOD MODE: Express Credit Command Center — Total System Lockdown

## ROOT CAUSE OF "Failed to upload credit report"

Hard-confirmed via DB inspection — there are **TWO killer bugs** stacking:

1. **`credit-reports` storage bucket has ZERO RLS policies.** Same for `identity-docs`, `utility-bills`, `ssn-docs`, `dispute-letters`, `admin-docs`. Every upload to these buckets gets silently rejected by RLS → "new row violates row-level security policy" → generic "Failed to upload credit report" toast.
2. **`AdminCreditReportUploader` writes to path `{client_id}/...`** but `clients.id` ≠ `auth.uid()`. Even if a client-folder policy existed, the path wouldn't match. Admin uploads must go through an admin-gated policy, not a folder-owner policy.
3. **`analyze-credit-report` edge function never extracts bureau scores** — its prompt only flags disputes. The uploader expects `analysisResult.scores.experian/equifax/transunion` which is always undefined → admin always falls back to "AI analysis did not return scores."

## THE PLAN — 5 Surgical Phases

### Phase 1 — Storage & Schema Hardening (migration)
- Add full RLS policies to `credit-reports`, `identity-docs`, `utility-bills`, `ssn-docs`, `dispute-letters`, `admin-docs`:
  - Admins: full ALL on bucket
  - Clients: SELECT/INSERT/UPDATE/DELETE only on `{auth.uid()}/...` paths
- Set `file_size_limit = 20MB` and `allowed_mime_types` (PDF + images) on all upload buckets.
- Add `client_credit_scores` columns if missing (already has experian/equifax/transunion).
- Add `notifications` table for admin alerts (stalled clients, missing reports, failed uploads, new signups awaiting link).

### Phase 2 — Fix the Upload Pipeline (production-grade)
- **`AdminCreditReportUploader`**: change storage path to `admin/{client_id}/{ts}-{file}` so the new admin policy authorizes it; add drag/drop, real progress (XHR upload), file-type guard via `validateUploadFile`, retry button, and surface real Supabase error message instead of generic toast.
- **`CreditReportUploadPage`** (client side): unify on `documentUtils` validation; use `{auth.uid()}/credit-reports/{ts}-{file}` path; surface real error.
- **`EnhancedCreditReportUpload`**: same path normalization + real errors.
- All other broken uploaders (`SecureVerificationUpload`, `sba/Uploader`, `DocumentUpload`, `DocumentUploadCenter`) — switch to `client-documents` bucket with `{auth.uid()}/...` path (already has working policies) and pipe the actual error message.

### Phase 3 — AI Score Extraction (the real audit engine)
Rewrite `analyze-credit-report` edge function to:
- Extract Experian / Equifax / TransUnion FICO 8 scores from PDF
- Detect score deltas vs. last upload
- Detect new accounts, removed accounts, score changes, derogatory items
- Return structured JSON: `{ scores: {experian, equifax, transunion}, deltas, flaggedAccounts, newAccounts, removedAccounts, summary }`
- Auto-write to `client_credit_scores` (current) AND `credit_scores` (history)
- Auto-create `client_timeline` events for every score change
- Auto-flip `client_action_tracker.report_parsed` and `scores_updated` to true
- Smart client matching: when admin doesn't pre-select, attempt match by (a) explicit selection (preferred), (b) client email, (c) full name from PDF — confidence-scored, never overwrites without ≥0.95 confidence.

### Phase 4 — Mobile-First Luxury UI Overhaul
Touch-target rule: **all buttons ≥ 44px tall, min text size 14px, generous tap padding**. The user is on 320px wide phone — so:
- **AdminDashboard**: replace overcrowded sidebar with a sticky bottom-nav on mobile (`< md`) holding 5 power buttons: War Board · Upload · Tasks · Documents · More. Sidebar stays for tablet/desktop. Sticky top bar with global search and notifications bell.
- **AdminWarBoard**: mobile becomes vertical accordion of status columns; large tap-friendly client cards with score deltas, next action, last update, quick "Open" button. Desktop keeps horizontal pipeline.
- **ClientPortal**: hero with name + ACTIVE membership ring + 3 huge bureau score cards with delta badges (+68 green / -22 red), score history chart, Next Action card, document list with PDF download (forced PDF-only download), checklist progress.
- **ClientProfileDetail**: mobile-friendly tabs as horizontal scroll; Action Tracker toggles enlarged; Documents tab embeds the unified file manager.
- Black + navy + gold (#D4AF37) glassmorphism throughout; reuse existing `glass-card` class — no design regression of what already looks great.

### Phase 5 — PDF-Only Download Lock + Notification Engine
- New util `downloadAsPdf(bucket, path, filename)` in `documentUtils`: if file already PDF → direct blob download; if image → silently convert via `jsPDF` to a single-page PDF before download. All "Download" buttons across admin & client routes call this util only.
- New `<NotificationCenter />` (bell in topbar): live counts for: failed uploads, unlinked auth accounts, clients missing credit reports, overdue tasks, stalled (>14d no activity), new signups. Click → navigates to relevant section.

## Files to create
- `src/components/AdminMobileNav.tsx` — bottom-nav for phones
- `src/components/NotificationCenter.tsx` — bell + dropdown
- `src/components/UnifiedUploader.tsx` — single drag/drop component used everywhere
- `supabase/migrations/[ts]_storage_lockdown_and_notifications.sql`

## Files to edit
- `supabase/functions/analyze-credit-report/index.ts` — full rewrite for score extraction + delta detection
- `src/components/AdminCreditReportUploader.tsx` — drag/drop, real errors, correct path
- `src/components/EnhancedCreditReportUpload.tsx` — path + error fixes
- `src/components/SecureVerificationUpload.tsx`, `src/components/sba/Uploader.tsx` — bucket/path normalization
- `src/pages/CreditReportUploadPage.tsx`, `src/pages/DocumentUpload.tsx`, `src/pages/DocumentUploadCenter.tsx` — same
- `src/pages/AdminDashboard.tsx` — mount mobile nav + notification center; widen mobile tap targets
- `src/components/ClientPortal.tsx` — premium scores + deltas + PDF download
- `src/components/ClientProfileDetail.tsx` — mobile tabs + force PDF download
- `src/lib/documentUtils.ts` — `downloadAsPdf()` utility
- `src/components/AdminWarBoard.tsx` — mobile accordion view

## Dependencies
- Add `jspdf` (image → PDF conversion for forced-PDF downloads)

## Safety guardrails
- Zero changes to auth, routes, themes, autonomous AI engines, dispute pipeline, CIP, or existing edge functions other than `analyze-credit-report`.
- Storage policies are **additive** — no DROP of existing client-documents policies.
- Master client seed list and existing data untouched.
- AI matching never auto-links unless explicit ≥0.95 confidence; admin selection always wins.

