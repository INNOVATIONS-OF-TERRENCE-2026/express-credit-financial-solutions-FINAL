## Emergency Production Stabilization Plan

### Root cause
Frontend is deployed ahead of production DB. Code reads/writes columns, views, and tables that don't exist in prod, so:
- Admin upload fails (`uploaded_by` missing on `credit_report_uploads`)
- Client portal crashes inside hooks that read `portal_credit_reports`, `client_inquiries_public`, `client_personal_info_public` without try/catch fallbacks

Fix is additive: ship one idempotent SQL patch + add defensive guards in the hooks/pages. No destructive SQL, no rebuilds.

---

### Phase A — Audit (read-only, no edits)

Inspect to confirm exact column/bucket/view usage before writing SQL:

- `src/components/CreditReportUpload.tsx`, `src/components/AdminFileUploader.tsx`, `src/components/admin/AdminCommittedReportsPanel.tsx`, `src/pages/AdminUploadReports.tsx`, `src/pages/admin/BatchReportIngestion.tsx` → confirm every column inserted into `credit_report_uploads` and which `storage.from(...)` buckets are used.
- `src/hooks/useClientPortalData.ts`, `src/hooks/useClientCaseFile.ts`, `src/hooks/useAdminMetrics.ts` → confirm which views/tables are read.
- `src/pages/client/Dashboard.tsx`, `Reports.tsx`, `CaseFile.tsx`, `Documents.tsx`, `AdminClientPortalEditor.tsx`, `components/admin/AdminCaseItemsManager.tsx` → identify crash points (unguarded `.map`, destructure of `null`).
- Grep repo for: `uploaded_by`, `portal_credit_reports`, `client_inquiries_public`, `client_personal_info_public`, `ftc_readiness_status`, `report_stage`, `report_type`.
- Cross-reference against latest `supabase/migrations/*` + `src/integrations/supabase/types.ts` to list what's missing in prod.

Output an inline audit summary before writing code.

---

### Phase B — Emergency SQL patch (single migration)

Create **`supabase/migrations/20260606170000_emergency_full_schema_compatibility_patch.sql`** — fully idempotent, safe to paste into SQL Editor, independent of migration history.

1. `ALTER TABLE public.credit_report_uploads ADD COLUMN IF NOT EXISTS` for: `uploaded_by uuid references auth.users(id) on delete set null`, `bureau text`, `report_type text`, `report_stage text`, `file_name text`, `storage_path text` (only those actually referenced by frontend).
2. `CREATE INDEX IF NOT EXISTS` on `client_id`, `user_id`, `uploaded_by`, `bureau`, `report_type`, `created_at`.
3. `INSERT ... ON CONFLICT DO NOTHING` into `storage.buckets` for every bucket referenced by `storage.from(...)` that may be missing (`credit-reports`, `documents`, plus any others found in audit). Private by default.
4. `CREATE OR REPLACE VIEW public.portal_credit_reports` with `security_invoker=on`, unioning `credit_report_uploads` + `credit_reports`, normalized columns (`id, client_id, user_id, bureau, report_type, report_stage, file_name, storage_path, uploaded_file_url, created_at, updated_at, source_table, display_name`). Null-safe on missing source columns.
5. `CREATE TABLE IF NOT EXISTS public.client_inquiries` with the listed columns + `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated; GRANT ALL ... TO service_role;` then `ALTER ... ENABLE ROW LEVEL SECURITY` and policies (admin all, service_role all, client select own visible via `user_id = auth.uid()` or `clients.user_id` link). Guarded with `DO $$ ... IF NOT EXISTS` blocks for policy creation.
6. Same pattern for `public.client_personal_info_variations`.
7. `CREATE OR REPLACE VIEW public.client_inquiries_public` and `public.client_personal_info_public` with `security_invoker=on`, excluding `internal_note`, filtered to `client_visible = true` and current-user ownership. `GRANT SELECT ... TO authenticated`.
8. Deterministic backfill of `client_id` where NULL and exactly one `clients` row matches `user_id` — for `credit_report_uploads`, `documents`, `document_archive`, and the two new tables.
9. End with `NOTIFY pgrst, 'reload schema';`.

No `DROP`, `TRUNCATE`, `DELETE FROM`, no renames, no auth schema changes.

---

### Phase C — Frontend defensive crash repair

Wrap every Supabase call in the at-risk hooks/pages with try/catch returning safe defaults, and guard rendering:

- `src/hooks/useClientPortalData.ts` — wrap each `from(...).select` in try/catch; default arrays/0; fallback chain for reports: `portal_credit_reports` → `credit_report_uploads` → `credit_reports`.
- `src/hooks/useClientCaseFile.ts` — already mostly null-safe; add fallback to `[]` when `client_inquiries_public` / `client_personal_info_public` 404 from PostgREST (catch and return empty).
- `src/hooks/useAdminMetrics.ts` — per-metric try/catch, log + return 0 on failure (no silent swallow).
- `src/pages/client/Dashboard.tsx`, `Reports.tsx`, `CaseFile.tsx`, `Documents.tsx` — guard `.map`, show empty states when `clientId`/`userId` missing instead of throwing.
- `src/components/CreditReportUpload.tsx` and admin upload components — only insert columns guaranteed by the patch; show toast on failure; never throw to boundary.
- Replace any `ftc_readiness_status` reference with `ftc_605b_readiness_status` (frontend only; do not rename DB columns).

---

### Phase D — Upload + visibility repair

- Admin upload: `client_id = selected.client.id`, `user_id = selected.client.user_id ?? null`, `uploaded_by = auth.user.id`, bucket = `credit-reports`, insert only the patched columns.
- Client upload: resolve client by `clients.user_id = auth.uid()`, attach `client_id` + `user_id`, bucket = `credit-reports`.
- Client portal Reports page reads `portal_credit_reports` first, falls back to the two source tables — so admin-uploaded rows become visible immediately after SQL is applied.

---

### Phase E — Validation + handoff

- Build runs via harness; fix any TS errors.
- Grep verification: no leftover `ftc_readiness_status`; every `uploaded_by` / `portal_credit_reports` / `client_inquiries_public` / `client_personal_info_public` reference is either guarded or backed by the migration.
- Dangerous-SQL scan on the new migration: confirm zero `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM` against protected tables.
- Final handoff message includes: audit summary, root cause, files changed, migration filename, full SQL body, manual deploy order (paste SQL → verify → frontend deploy auto), verification SQL (the three `information_schema` / `storage.buckets` / `to_regclass` queries).

---

### Technical notes
- Migration is written so it can run via the Lovable migration tool **or** be pasted directly into Supabase SQL Editor — same file, idempotent.
- All new public tables get explicit `GRANT` statements before `ENABLE ROW LEVEL SECURITY` per project rules.
- Views use `security_invoker=on` so RLS on base tables governs access.
- No edits to `src/integrations/supabase/types.ts` (regenerated by Supabase).
- No changes to auth, routing, or unrelated marketing pages.

Approve to switch to build mode and execute Phases A–E.