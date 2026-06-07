-- =====================================================================
-- Emergency backend wiring fix
--   * report visibility (admin uploads must show in the client portal)
--   * missing storage buckets referenced by application code
--   * one normalized report source shared by admin dashboard + portal
--
-- SAFETY CONTRACT (live database):
--   - Additive only. NO DROP TABLE. NO DELETE. NO UPDATE of client rows.
--   - Every statement is idempotent and safe to re-run:
--       IF NOT EXISTS / ON CONFLICT DO NOTHING / CREATE OR REPLACE /
--       DROP POLICY IF EXISTS (only for policies this migration owns).
--   - No existing table, column, row, policy, or bucket is removed.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Guarantee the columns the admin upload path already writes really
--    exist. types.ts was stale and these were added out-of-band; adding
--    them IF NOT EXISTS is a no-op when present and stabilises the
--    upload insert + the view below. Nullable => no data mutation.
-- ---------------------------------------------------------------------
ALTER TABLE public.credit_report_uploads
  ADD COLUMN IF NOT EXISTS bureau text,
  ADD COLUMN IF NOT EXISTS report_type text;

-- ---------------------------------------------------------------------
-- 2. Create the storage buckets that application code references but no
--    migration ever created. Private buckets. Idempotent.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('credit-reports', 'credit-reports', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. RLS for the 'documents' bucket. (The 'credit-reports' bucket already
--    has policies from migration 20260417180326.) Owner-folder access +
--    admin override, mirroring the existing bucket policy pattern.
--    Files are stored under "<auth.uid()>/..." by CreditReportUpload.
--    Policy names are unique to this migration, so DROP IF EXISTS only
--    ever removes a prior copy of THESE policies (safe re-run).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "documents_owner_select" ON storage.objects;
CREATE POLICY "documents_owner_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "documents_owner_insert" ON storage.objects;
CREATE POLICY "documents_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "documents_owner_update" ON storage.objects;
CREATE POLICY "documents_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "documents_owner_delete" ON storage.objects;
CREATE POLICY "documents_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "documents_admin_all" ON storage.objects;
CREATE POLICY "documents_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 4. Normalized, READ-ONLY report source shared by the admin dashboard
--    and the client portal. A UNION of:
--      * credit_reports        (admin-committed, portal's legacy source)
--      * credit_report_uploads (where admin "Upload Reports" actually lands)
--    projected onto one shape. No rows are copied or moved; both base
--    tables remain the system of record and are untouched.
--
--    security_invoker = true  => the QUERYING user's RLS on the base
--    tables is enforced through the view. A client therefore sees only
--    their own rows (credit_reports client policy + credit_report_uploads
--    "Users can view their own uploads"), and admins see all rows
--    (admin SELECT policies). This avoids the classic view RLS-bypass leak.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.portal_credit_reports
WITH (security_invoker = true) AS
  SELECT
    cr.id,
    cr.client_id,
    cr.user_id,
    cr.file_name,
    cr.bureau,
    cr.fico_score,
    cr.uploaded_at,
    cr.is_current,
    cr.negative_items,
    COALESCE(cr.storage_path, cr.uploaded_file_url) AS storage_path,
    cr.uploaded_file_url,
    cr.notes,
    'committed'::text AS source,
    NULL::text        AS match_status,
    NULL::numeric     AS match_score
  FROM public.credit_reports cr
  UNION ALL
  SELECT
    u.id,
    u.client_id,
    u.user_id,
    u.file_name,
    u.bureau,
    NULL::integer  AS fico_score,
    u.uploaded_at,
    false          AS is_current,
    NULL::text[]   AS negative_items,
    u.file_path    AS storage_path,
    NULL::text     AS uploaded_file_url,
    NULL::text     AS notes,
    'upload'::text AS source,
    u.match_status,
    u.match_score
  FROM public.credit_report_uploads u;

GRANT SELECT ON public.portal_credit_reports TO authenticated, service_role;
