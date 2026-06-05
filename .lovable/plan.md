## Production Repair Plan — Registry, Portal Linking, Orphans, Documents, Payments

Scope: surgical fixes to existing tables and components. No UI redesign, no auth changes, no silent deletes.

---

### Phase 1 — Portal Linking Truth (read accuracy)

Update `src/hooks/useClientRegistry.ts` and `src/pages/AdminClientRegistry.tsx`:

- Replace the current "linked = clients.user_id IS NOT NULL" count with a derived `portalStatus` per client computed via this priority:
  1. `clients.user_id = profiles.user_id` → **Linked**
  2. `lower(clients.email) = lower(profiles.email)` (unique on both sides) and `clients.user_id IS NULL` → **Email Match Found / Needs Link Approval**
  3. Phone/name normalized match → **Review Suggestion** (never auto-link)
  4. None → **No Portal Account Found**
  5. Exclusion row present → **Prospect / Not Client / Test / Ignored**
  6. Duplicate cluster member → **Duplicate Risk**
- Add per-row **Link Portal Account** action (admin-approved) that sets `clients.user_id` to the matched `profiles.user_id` via existing RPC pattern; never bulk auto-link.
- Recompute KPIs from this derived status, not from raw nulls.

### Phase 2 — Profile Exclusions (prospects aren't clients)

New table `public.client_registry_exclusions` (migration):
- `id, source_type ('profile'|'orphan_email'|'orphan_phone'), source_id (text), email, name, reason text, status ('prospect'|'not_client'|'test_account'|'ignored'|'archived'), excluded_by uuid, notes, created_at, updated_at`
- GRANTs to `authenticated` + `service_role`, RLS admin-only via `has_role`.

Update registry hook to LEFT JOIN this table and:
- Exclude marked profiles from "Profiles Missing Client Row".
- Surface new KPIs: Prospects, Not Clients, Test Accounts, Ignored, Duplicate Risks.
- Add row actions: Mark Prospect / Not Client / Test / Ignore / Restore.

### Phase 3 — Dry Run Preview Repair

In `AdminClientRegistry.tsx`:
- Fix the existing `reconcile_client_links(dry_run=true)` flow: render the returned JSON in a structured preview (selected, to-create, to-link, skipped, duplicate risks, prospects excluded, downstream payment/document/report/agreement counts, before/after totals).
- Three buttons: **Run Dry Preview**, **Confirm & Execute** (disabled until preview returns success), **Cancel**.
- Guarantee no mutation occurs on preview (already enforced in the RPC; verify call site passes `dry_run: true`).

### Phase 4 — Orphan Identity Controls

In the Orphan Identity panel:
- Per orphan: View Source, Attach to Existing Client, Create Client, Mark Prospect/Not Client, Archive, Hard Delete.
- Hard Delete guard: pre-check counts in `payment_records`, `client_agreements`, `credit_report_uploads`, `documents`, `dispute_letters`, `audit_logs`. If any > 0, block with the spec'd message.
- All actions write to `audit_logs` via `log_security_event`.
- Archive = insert into `client_registry_exclusions` with status `archived`.

### Phase 5 — Uploaded Client Documents Fix

Root cause: code queries `public.document_uploads` which does not exist. Real tables present: `documents`, `document_archive`, `credit_report_uploads`, `client_verification_secure`.

- Grep entire codebase for `document_uploads` and replace with the correct unified source. `src/hooks/useAdminClientDocuments.ts` currently references it — repoint to `documents` (the actual general-upload table) plus the other three already-merged sources.
- No new table needed; `documents` already has `client_id, user_id, file_name, file_path, doc_type, created_at`. Verify columns via `supabase--read_query` before editing.
- Confirm Documents Pending KPI uses the corrected source.

### Phase 6 — Payment Center Repair

New table `public.client_payment_summary` (migration):
- `id, client_id uuid UNIQUE REFERENCES clients(id), user_id, expected_amount numeric DEFAULT 600, paid_amount numeric DEFAULT 0, payment_status text DEFAULT 'unpaid', payment_method, payment_date, service_type DEFAULT 'Credit Repair', receipt_reference, verified_by_admin bool, visible_to_client bool DEFAULT true, notes, created_at, updated_at`
- `balance_due` computed in app (`expected - paid`) to avoid generated-column risk.
- GRANTs + RLS: admin full, client SELECT own row where `visible_to_client = true`.
- Backfill: insert one row per existing `clients.id` with defaults (`$600 / $0 / unpaid`).
- Trigger: on `INSERT INTO clients` create a default summary row.

New admin page section in existing Payment Center (`src/pages/AdminPaymentsPage.tsx` gets a new tab or sibling page `AdminPaymentSummaryPage.tsx`):
- Table of all 48 clients with editable cells: expected, paid, status, method, date, notes, visible_to_client, service_type, receipt_reference, verified_by_admin.
- KPI strip: Total Expected, Total Paid, Total Balance Due, Paid / Unpaid / Partial / Pending Review / Manual Edits counts.

Does NOT replace existing `payment_records` (Cash App / Apple Pay manual proofs). The summary is the source-of-truth ledger; `payment_records` continue feeding it on approval (optional follow-up, not in this phase).

### Phase 7 — Client Portal Payment Display

`src/pages/client/Payments.tsx`:
- Add a Service Balance card sourced from `client_payment_summary` for the resolved `clientId`.
- Auto-create the row if missing (RPC `ensure_payment_summary(client_id)`).
- Show notes only when `visible_to_client = true`.

### Phase 8 — Verification

After implementation: load registry (48 clients, correct linked count), run Dry Preview, link one email match, mark one profile as Prospect, open Uploaded Client Documents (no relation error), open Payment Center (48 rows, $600 default), edit one row, view client portal payments page.

---

### Technical Details

**Migrations (two, additive only):**
1. `client_registry_exclusions` + RLS + GRANTs.
2. `client_payment_summary` + RLS + GRANTs + backfill insert + new-client trigger + `ensure_payment_summary(uuid)` RPC.

**Files to edit:**
- `src/hooks/useClientRegistry.ts` — derived portal status, exclusions join, new KPIs.
- `src/pages/AdminClientRegistry.tsx` — dry-run preview UI, link-approve action, exclusion actions, orphan delete guard.
- `src/hooks/useAdminClientDocuments.ts` — already correct; verify no `document_uploads` reference remains. Grep and fix any other component still calling it.
- `src/pages/AdminPaymentsPage.tsx` (+ new `AdminPaymentSummaryPage.tsx` or tab) — editable summary grid.
- `src/pages/client/Payments.tsx` — Service Balance card.
- `src/components/admin/AdminSidebar.tsx` — link to new payment summary view if added as separate page.

**Files investigated (read-only first):** `useClientRegistry.ts`, `AdminClientRegistry.tsx`, `useAdminClientDocuments.ts`, `AdminDocumentList.tsx`, `usePayments.ts`, `useAdminPayments.ts`, `AdminPaymentsPage.tsx`, `client/Payments.tsx`, plus `rg document_uploads` across `src/`.

**Safety:** no drops, no deletes of existing rows, no RLS removed, no auth changes. All admin mutations go through `has_role('admin')` checks and write to `audit_logs`.

**Out of scope:** UI redesign, Stripe/CashApp rewiring, admin module consolidation, AI changes.
