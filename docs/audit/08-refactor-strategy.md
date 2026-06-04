# 08 — Refactor Strategy

Per-cluster consolidation plan. Every move respects the preservation contract: **no deletion without a replacement path** and **legacy reads keep working via views/aliases**.

Cross-reference: report 03 (duplicates), report 09 (migration mechanics).

## Preservation contract

1. **Data preservation > code purity.** A 0-row legacy table is removed; any table with ≥1 production row gets a view alias, never a drop.
2. **Read path before write path.** Switch new code to canonical reads while legacy writes continue to both tables for one dual-write window (one release).
3. **Reversible at every step.** Each migration ships with a documented rollback (revert view to table, restore alias, redeploy old edge fn).
4. **No RLS regressions.** Each consolidation adds explicit policies that match or exceed the most permissive of the consolidated set, never the most restrictive.
5. **Auth & PII untouched in the same migration as restructure.** Identity changes ship alone, never bundled.

## Frontend consolidations

### F-1 Admin shells

- **Action:** Delete `AdminPanel.tsx`, `AdminDashboardComponents.tsx` (orphans).
- **Action:** Merge `AdminMobileNav.tsx` into `AdminSidebar.tsx` responsive variant.
- **Preserve:** Nothing — both target files have zero imports (stream-a §3).
- **Risk:** None.
- **Verification:** `rg "AdminPanel|AdminDashboardComponents|AdminMobileNav" src/` returns zero results post-deletion.

### F-2 Client portal

- **Action:** Delete `ClientPortal.tsx`, `ClientDashboard.tsx`, `pages/ClientPortals.tsx`. Remove route `/client-portals-legacy/:slug`.
- **Preserve:** Add 301 redirect from `/client-portals-legacy/:slug` → `/client/dashboard` for one release.
- **Risk:** Old marketing/onboarding links lose slug context. Mitigation: log slug to `audit_logs` before redirect for analytics.

### F-3 Upload widgets

- **Action:** Delete `CreditReportUpload.tsx`, `FileUploader.tsx`.
- **Action:** Fix `SecureVerificationUpload` to insert into `client_verification_secure` (closes P0-8).
- **Preserve:** Nothing client-facing — admins continue uploading via `AdminUploadReports`.

### F-4 Auth surfaces

- **Action:** Delete `ClientLogin.tsx`.
- **Action:** Apply `<ProtectedRoute>` wrapper to admin + client routes (closes P0-4, P0-5).
- **Preserve:** No URL changes.

### F-5 Payment widgets

- **Action:** Delete `ApplePayCard.tsx`, `CashAppCard.tsx`, `pages/PaymentsPage.tsx`, `pages/ComingSoon.tsx`.

### F-6 Signatures

- **Action:** Delete `DigitalSignature.tsx` (orphan); inline signature stays in `ClientAgreementModal`.

### Hooks cleanup

- Delete `useDebounce.tsx`, `useLocalStorage.tsx` (zero imports).

## Backend consolidations

### D-1 Payments

- **Canonical:** `payment_records` + 3 sidecars.
- **Move:** `payments` → backfill any residual rows into `payment_records`; replace `payments` with a view.
- **Move:** `payment_notifications` → migrate to `client_notifications` with `type='payment'` over a dual-write window.
- **Verify:** rg `from('payments')` in src/ — 0 hits after migration.

### D-2 Documents

- **Canonical:** `document_archive` + 3 sidecars.
- **Move:** `documents` and `document_uploads` rows into `document_archive`; both become views.
- **Drop trigger `tg_document_archive_alias`** once `document_uploads` is gone.
- **Storage:** consolidate `documents`/`document-archive`/`document-uploads` buckets into `client-documents` via rename + access-policy update. Path migration via storage move.

### D-3 Credit data

- **Canonical:** `credit_report_uploads` (raw) + `credit_reports` (parsed) + `score_history` (timeseries).
- **Move:** `credit_scores` and `client_credit_scores` rows into `score_history`; both become views.
- **Sidecars stay:** `credit_scan_summaries`, `credit_analysis`, `score_predictions`.

### D-5 Notifications

- **Canonical:** `client_notifications`.
- **Move:** Migrate `payment_notifications` into `client_notifications` with `type='payment'`.
- **Triggers update:** `tg_payment_after_insert/update` write to `client_notifications` directly. `payment_notifications` becomes a view filtered on `type='payment'`.

### D-6 Activity / audit

- **Canonical:** `client_activity_timeline` (UX) + `audit_logs` (security).
- **Move:** `client_timeline` → view onto `client_activity_timeline`. Adapt any trigger that writes the old table.
- **Add coverage:** wire `log_security_event` calls for WF-2 (report upload/match) and WF-3 (dispute generation) to close P1-5.

### D-6.5 Onboarding pipeline (P0-6 fix)

- **Action:** Add RLS policies to `purchases`, `pipeline_stages`, `client_timers`, `client_documents`, `admin_tasks`, `execution_queue`, plus the 12 others enumerated in stream-b §2.
- **Action:** Re-test the `on_purchase_insert` trigger chain end-to-end after policies are in place.

### Edge functions

| Action | Detail |
|--------|--------|
| **Delete** `generate-dispute-letter` | Unauthenticated (P0-1). `generate-dispute-letter-secure` already replaces it. |
| **Deprecate** `generate-dispute-ai`, `generate-dispute-preview` | Migrate any callers to `generate-dispute-letter-secure` + `ai-letter-preview`. |
| **Pick one** of `analyze-credit-report` / `analyze-credit-scan` / `analyze-credit-violations` | Behavioral diff first. Likely `analyze-credit-violations` (most recent + most-cited). |
| **Align** `src/lib/clientMatchEngine.ts` scoring with `match-report-to-client/index.ts` | Closes P1-1. Single source = the edge function; frontend re-implements the same weights via a shared `match-weights.json`. |
| **Fold** `process-document-autonomous` into `orchestrate-ai-workflow` | One automation entry point. |

### Encryption fixes (P0-2, P0-3)

- **SSN key rotation:** stored in Supabase Vault, accessed via `vault.secrets`. Re-encrypt all SSNs in a one-shot maintenance migration. Old function kept as `decrypt_ssn_secure_legacy` for one release to support audit replay.
- **Plaid token encryption:** call `encrypt_plaid_token()` on every insert/update path. Backfill existing rows in a single transaction.

## Sequencing rule

Every consolidation follows this order:

```text
1. Ship the canonical (no consumer changes).
2. Ship dual-write: new code writes to canonical AND legacy. Legacy reads unchanged.
3. Ship reader switch: all reads point to canonical or its view.
4. Verify zero legacy writes for 7 days (audit_logs query).
5. Replace legacy table with view onto canonical.
6. (Optional, after 30 days) Drop view.
```

## What stays untouched (anti-list)

- `auth.users` schema, `handle_new_user` trigger.
- `user_roles`, `has_role()`.
- `prevent_user_id_change()` (admin-aware variant from June 4).
- `tg_payment_after_insert/update` payload contract — modify INSERT target only, not the event semantics.
- `bump_credit_report_version()`.
- Signature storage path format (clients reference these in saved emails).

## Verification checklist per consolidation

1. `rg` for legacy symbol — 0 hits in `src/` and `supabase/functions/`.
2. `audit_logs` shows 0 legacy writes in trailing 7d.
3. RLS policies on canonical match-or-exceed legacy.
4. GRANT block present for every new view.
5. Rollback migration written and tested in a staging branch before prod.
