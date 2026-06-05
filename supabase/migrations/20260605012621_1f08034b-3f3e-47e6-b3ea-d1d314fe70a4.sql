CREATE OR REPLACE FUNCTION public.reconcile_client_links(dry_run boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_result jsonb := '{}'::jsonb;
  v_profiles_linked int := 0;
  v_profiles_skipped_ambiguous int := 0;
  v_payments_linked int := 0;
  v_uploads_linked int := 0;
  v_agreements_linked int := 0;
  v_disputes_linked int := 0;
  v_documents_linked int := 0;
  v_archive_linked int := 0;
BEGIN
  IF v_caller IS NULL OR NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'reconcile_client_links: admin role required';
  END IF;

  WITH profile_email AS (
    SELECT lower(email) AS email_lc, user_id, COUNT(*) OVER (PARTITION BY lower(email)) AS pcnt
    FROM public.profiles
    WHERE email IS NOT NULL AND user_id IS NOT NULL
  ),
  client_email AS (
    SELECT id, lower(email) AS email_lc, user_id, COUNT(*) OVER (PARTITION BY lower(email)) AS ccnt
    FROM public.clients
    WHERE email IS NOT NULL AND NOT COALESCE(not_a_client, false)
  ),
  candidates AS (
    SELECT c.id AS client_id, p.user_id AS new_user_id
    FROM client_email c
    JOIN profile_email p ON p.email_lc = c.email_lc
    WHERE c.user_id IS NULL
      AND c.ccnt = 1
      AND p.pcnt = 1
      AND NOT EXISTS (SELECT 1 FROM public.clients c2 WHERE c2.user_id = p.user_id)
  ),
  ambiguous AS (
    SELECT DISTINCT c.id
    FROM client_email c
    JOIN profile_email p ON p.email_lc = c.email_lc
    WHERE c.user_id IS NULL AND (c.ccnt > 1 OR p.pcnt > 1)
  ),
  upd AS (
    UPDATE public.clients cl
    SET user_id = cand.new_user_id, updated_at = now()
    FROM candidates cand
    WHERE cl.id = cand.client_id AND NOT dry_run
    RETURNING cl.id
  )
  SELECT
    (SELECT COUNT(*) FROM candidates),
    (SELECT COUNT(*) FROM ambiguous)
  INTO v_profiles_linked, v_profiles_skipped_ambiguous;

  WITH map AS (
    SELECT user_id, (array_agg(id ORDER BY created_at NULLS LAST, id::text))[1] AS client_id, COUNT(*) AS n
    FROM public.clients
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) = 1
  ),
  pmt AS (
    UPDATE public.payment_records p
    SET client_id = m.client_id
    FROM map m
    WHERE p.client_id IS NULL AND p.user_id = m.user_id AND NOT dry_run
    RETURNING p.id
  ),
  pmt_count AS (
    SELECT COUNT(*) AS n FROM public.payment_records p
    JOIN map m ON m.user_id = p.user_id
    WHERE p.client_id IS NULL
  ),
  rpt AS (
    UPDATE public.credit_report_uploads u
    SET client_id = m.client_id
    FROM map m
    WHERE u.client_id IS NULL AND u.user_id = m.user_id AND NOT dry_run
    RETURNING u.id
  ),
  rpt_count AS (
    SELECT COUNT(*) AS n FROM public.credit_report_uploads u
    JOIN map m ON m.user_id = u.user_id
    WHERE u.client_id IS NULL
  ),
  agr AS (
    UPDATE public.client_agreements a
    SET client_id = m.client_id
    FROM map m
    WHERE a.client_id IS NULL AND a.user_id = m.user_id AND NOT dry_run
    RETURNING a.id
  ),
  agr_count AS (
    SELECT COUNT(*) AS n FROM public.client_agreements a
    JOIN map m ON m.user_id = a.user_id
    WHERE a.client_id IS NULL
  ),
  dl AS (
    UPDATE public.dispute_letters d
    SET client_id = m.client_id
    FROM map m
    WHERE d.client_id IS NULL AND d.user_id ~* '^[0-9a-f-]{36}$' AND d.user_id::uuid = m.user_id AND NOT dry_run
    RETURNING d.id
  ),
  dl_count AS (
    SELECT COUNT(*) AS n FROM public.dispute_letters d
    JOIN map m ON d.user_id ~* '^[0-9a-f-]{36}$' AND m.user_id = d.user_id::uuid
    WHERE d.client_id IS NULL
  ),
  doc AS (
    UPDATE public.documents dc
    SET client_id = m.client_id
    FROM map m
    WHERE dc.client_id IS NULL AND dc.user_id ~* '^[0-9a-f-]{36}$' AND dc.user_id::uuid = m.user_id AND NOT dry_run
    RETURNING dc.id
  ),
  doc_count AS (
    SELECT COUNT(*) AS n FROM public.documents dc
    JOIN map m ON dc.user_id ~* '^[0-9a-f-]{36}$' AND m.user_id = dc.user_id::uuid
    WHERE dc.client_id IS NULL
  ),
  arc AS (
    UPDATE public.document_archive da
    SET client_id = m.client_id
    FROM map m
    WHERE da.client_id IS NULL AND da.user_id = m.user_id AND NOT dry_run
    RETURNING da.id
  ),
  arc_count AS (
    SELECT COUNT(*) AS n FROM public.document_archive da
    JOIN map m ON m.user_id = da.user_id
    WHERE da.client_id IS NULL
  )
  SELECT
    (SELECT n FROM pmt_count),
    (SELECT n FROM rpt_count),
    (SELECT n FROM agr_count),
    (SELECT n FROM dl_count),
    (SELECT n FROM doc_count),
    (SELECT n FROM arc_count)
  INTO v_payments_linked, v_uploads_linked, v_agreements_linked, v_disputes_linked, v_documents_linked, v_archive_linked;

  v_result := jsonb_build_object(
    'dry_run', dry_run,
    'profiles_linked_to_clients', v_profiles_linked,
    'profiles_skipped_ambiguous', v_profiles_skipped_ambiguous,
    'payments_relinked', v_payments_linked,
    'reports_relinked', v_uploads_linked,
    'agreements_relinked', v_agreements_linked,
    'disputes_relinked', v_disputes_linked,
    'documents_relinked', v_documents_linked,
    'document_archive_relinked', v_archive_linked,
    'ran_at', now()
  );

  PERFORM public.log_security_event(
    'REGISTRY_RECONCILE_RUN',
    'clients',
    NULL,
    v_result,
    'info',
    2
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reconcile_client_links(boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reconcile_client_links(boolean) FROM anon;