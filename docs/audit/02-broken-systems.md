# 02 — Broken Systems

Every finding has file:line or table.policy citation. Source: streams A/B/C/D.

## P0 — Security / data-loss / silent prod breakage

| ID | Finding | Evidence | Blast radius | Fix sketch |
|----|---------|----------|--------------|-----------|
| P0-1 | **`generate-dispute-letter` edge function is unauthenticated and uses `SUPABASE_SERVICE_ROLE_KEY`.** `supabase/config.toml` has no `verify_jwt` entry for it (default behavior + service-role usage = anyone with the URL can call it). | `supabase/config.toml`; `supabase/functions/generate-dispute-letter/index.ts` | Public can generate letters as any client; full DB write access via service role. | Delete the function. `generate-dispute-letter-secure` already exists with `verify_jwt = true`. |
| P0-2 | **SSN encryption uses a hard-coded static key** baked into a historical migration. Key is in git history. | `encrypt_ssn_secure()` / `decrypt_ssn_secure()` in `<db-functions>`; key string `'ssn_encryption_key_2024'` in migration history | Every encrypted SSN is recoverable by anyone with repo read access. Compliance breach (GLBA, state UDAP). | Move key to Supabase Vault; rotate; re-encrypt all rows under new key in a one-shot maintenance window. |
| P0-3 | **Plaid `access_token` stored in plaintext** in `bank_links.access_token`. `bank_links_safe` view masks it from clients but it is unencrypted at rest. | stream-b §10; `public.bank_links` column inspection | DB dump or backup exfil exposes live Plaid tokens. | Use existing `encrypt_plaid_token()` on insert, `decrypt_plaid_token_with_audit()` on read. Backfill existing rows. |
| P0-4 | **`<ProtectedRoute>` is imported but never applied.** Every admin/client route is public at the router layer; in-page `useAuth` checks are inconsistent. | `src/App.tsx:11` (import) and `App.tsx:86-156` (no usage) | Unauthenticated user can hit `/admin/clients`, `/client/payments`, etc. and trigger queries before in-page guard mounts. RLS blocks data but reveals topology and may leak via realtime channels. | Wrap admin routes in `<ProtectedRoute role="admin">`, client routes in `<ProtectedRoute>`. |
| P0-5 | **`/sba/admin` has zero guard.** | `App.tsx:95` | SBA admin UI public. | Wrap in admin-role guard or remove route until needed. |
| P0-6 | **18 tables have RLS enabled with zero policies.** Reads/writes silently fail; features that depend on them are dead. Includes `purchases`, `admin_tasks`, `execution_queue`, `pipeline_stages`, plus others enumerated in stream-b §2. | stream-b §2; `pg_policies` query | Onboarding pipeline (purchases → pipeline_stages → client_timers → client_documents triggers) cannot write. Admin task engine cannot read. | Add explicit policies per table or `GRANT` + bypass via service role from edge fns. |
| P0-7 | **`AdminClients` bulk action inserts `payment_records` with no proof file**, bypassing the proof-upload contract enforced by `tg_payment_after_insert` and the client-side flow. | stream-c WF-4; `src/pages/AdminClients.tsx` (bulk preview) | Approved $600 rows have no auditable proof. Reconciliation impossible. | Either require a synthetic proof reference (e.g. "admin_bulk_<timestamp>") or move bulk approvals to a separate `admin_payment_adjustments` table. |
| P0-8 | **`SecureVerificationUpload` writes to storage but creates no DB row.** Files become orphans; admins cannot review. | stream-c WF-5; `src/components/SecureVerificationUpload.tsx` | Identity docs uploaded by clients are invisible to the verification queue. | Insert row into `client_verification_secure` after upload. |

## P1 — Workflow degraded / user-visible

| ID | Finding | Evidence | Blast radius |
|----|---------|----------|--------------|
| P1-1 | **Duplicate match engine logic** — `src/lib/clientMatchEngine.ts` and `supabase/functions/match-report-to-client/index.ts` have **divergent scoring weights**. Frontend preview can show a different best-match than the edge function actually assigns. | stream-c WF-2 | Admin sees one client matched, system assigns another. |
| P1-2 | **Four competing letter-generation edge functions** with overlapping behavior (`generate-dispute-letter*`, `generate-dispute-ai`, `generate-dispute-preview`, `ai-letter-preview`). | stream-b §8; stream-c WF-3 | Hard to reason about which letter shipped. |
| P1-3 | **`/client/:clientSlug` redirect is lossy** — drops slug silently. Any deep link from old emails breaks the slug-based context. | `App.tsx:153` | Old marketing/onboarding links land on generic `/client/dashboard`. |
| P1-4 | **`BulkDisputeWizard` swallows 6 errors with `console.error` and no toast**. | stream-a §8 | Admin clicks "Send", nothing happens, no feedback. |
| P1-5 | **WF-2 (report upload/match) and WF-3 (dispute generation) emit no `audit_logs` entries.** | stream-c §cross-cutting | Two highest-impact workflows are invisible to compliance audit. |
| P1-6 | **Frontend uses `is_admin()` in some queries and `has_role(uid,'admin')` in others.** Inconsistent RBAC predicate; some policies use both. | stream-b §2 | If `is_admin()` is dropped or its definition diverges, half of admin features break. |
| P1-7 | **`orchestrate-ai-workflow` and `process-automation-event` overlap** in event handling. | stream-b §8 | Race conditions on automation triggers. |
| P1-8 | **`payments` table is parallel to `payment_records`** and unused by current UI but still receiving writes from at least one legacy code path. | stream-b §6; stream-c WF-4 | Reconciliation requires two queries. |
| P1-9 | **`document_archive` vs `document_uploads` vs `documents`** — three doc tables; trigger `tg_document_archive_alias` papers over a column-name disagreement between the first two. | stream-b §6 | Doc lookups must union three sources. |
| P1-10 | **`client_activity_timeline` and `client_timeline`** — two activity log tables. UI reads one, some triggers write the other. | stream-b §6 | Client portal activity feed is incomplete. |

## P2 — Code health / duplication / dead weight

| ID | Finding | Evidence |
|----|---------|----------|
| P2-1 | 25+ orphan components (zero imports). Listed in stream-a §3-4. Includes `AdminPanel`, `AdminDashboardComponents`, `ClientDashboard`, `ClientPortal`, `CreditReportUpload`, `FileUploader`, `DigitalSignature`, `ClientLogin`, `ApplePayCard`, `CashAppCard`, and 15 more. | stream-a §3-4, §7 |
| P2-2 | 2 dead pages: `ComingSoon.tsx`, `PaymentsPage.tsx` (no routes). | stream-a §2 |
| P2-3 | 2 orphan hooks: `useDebounce`, `useLocalStorage`. | stream-a §6 |
| P2-4 | 16 legacy redirect routes in `App.tsx:121-141`. Working but cruft. | `App.tsx` |
| P2-5 | 5 of 15 storage buckets overlap (`documents`, `document-archive`, `document-uploads`, `identity-docs` vs `verification-docs`, `dispute-letters` vs `dispute-uploads`). | stream-b §9 |
| P2-6 | Hard-coded colors in 40+ component files (`text-white`, `bg-black`, raw hex). Breaks the design-token discipline required for the premium rebuild. | stream-d §5 |
| P2-7 | Two AI chat tables: `chat_history` + UI flow goes through `chat-history-manager` edge function — but `gpt-assistant` writes directly in places. | stream-b §6 |
| P2-8 | `notification_templates` table is empty (0 rows) — template system is wired but never seeded. | stream-b §1 |
| P2-9 | `demo_users` table — purpose unclear, low row count, no UI surface. | stream-b §1 |
| P2-10 | `agreements` (4 columns) co-exists with `client_agreements` (10 columns). Former appears to be legacy stub. | stream-b §1 |

## Cross-cutting issues

1. **No global error boundary on routes** beyond `src/components/ErrorBoundary.tsx` (used at app root only). A crash in any client/admin page renders blank.
2. **No central toast on RLS denial.** Failed queries silently return `[]`, leaving users staring at empty tables.
3. **No request-level audit for read access to sensitive tables** (`clients`, `payment_records`, `bank_links`). `log_client_data_access()` trigger fires on INSERT/UPDATE only, not SELECT.
4. **No e2e tests for the 7 critical workflows.** Tests directory has 6 files, mostly component-level (`signatureModalResponsive`, `ssnEncryption`, smoke).

## What is NOT broken (load-bearing, leave alone)

- `useAuth` context + `handle_new_user` trigger chain — clean.
- `has_role()` security-definer pattern + `user_roles` table — textbook correct.
- `prevent_user_id_change()` admin-aware variant (June 4 patch) — correct.
- Payment notification triggers `tg_payment_after_insert/update` — correct, well-scoped.
- shadcn UI primitives — untouched, OK.
- Cash App proof upload contract (when initiated from `ClientPaymentWidget`) — correct.
