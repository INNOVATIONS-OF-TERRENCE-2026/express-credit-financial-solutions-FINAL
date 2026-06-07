-- =====================================================================
-- Back-link historical orphaned feature rows to their client record.
--
-- Many rows were created with a user_id but NULL client_id (e.g. client
-- self-uploads). This fills client_id ONLY where it is unambiguous.
--
-- SAFETY CONTRACT (live database):
--   - Only UPDATEs rows where client_id IS CURRENTLY NULL.
--   - Only fills when EXACTLY ONE client matches that user_id
--     (ambiguous/duplicate-user rows are left untouched for manual review).
--   - Never overwrites an existing client_id. No DELETE. No DROP.
--   - Idempotent: re-running is a no-op once rows are linked.
--
-- NOTE: migration history on the linked project is divergent (Lovable
-- timestamp offsets), so apply this via the Supabase SQL editor or a
-- direct psql connection, NOT `supabase db push`. It is wrapped in a
-- single transaction so it is all-or-nothing.
-- =====================================================================

BEGIN;

-- Helper predicate inlined per table: link only on a unique user_id match.
UPDATE public.documents d
SET client_id = c.id
FROM public.clients c
WHERE d.client_id IS NULL
  AND d.user_id IS NOT NULL
  AND c.user_id = d.user_id
  AND (SELECT count(*) FROM public.clients c2 WHERE c2.user_id = d.user_id) = 1;

UPDATE public.credit_report_uploads u
SET client_id = c.id
FROM public.clients c
WHERE u.client_id IS NULL
  AND u.user_id IS NOT NULL
  AND c.user_id = u.user_id
  AND (SELECT count(*) FROM public.clients c2 WHERE c2.user_id = u.user_id) = 1;

UPDATE public.credit_reports r
SET client_id = c.id
FROM public.clients c
WHERE r.client_id IS NULL
  AND r.user_id IS NOT NULL
  AND c.user_id = r.user_id
  AND (SELECT count(*) FROM public.clients c2 WHERE c2.user_id = r.user_id) = 1;

UPDATE public.document_archive a
SET client_id = c.id
FROM public.clients c
WHERE a.client_id IS NULL
  AND a.user_id IS NOT NULL
  AND c.user_id = a.user_id
  AND (SELECT count(*) FROM public.clients c2 WHERE c2.user_id = a.user_id) = 1;

UPDATE public.dispute_letters l
SET client_id = c.id
FROM public.clients c
WHERE l.client_id IS NULL
  AND l.user_id IS NOT NULL
  AND c.user_id = l.user_id
  AND (SELECT count(*) FROM public.clients c2 WHERE c2.user_id = l.user_id) = 1;

UPDATE public.client_agreements g
SET client_id = c.id
FROM public.clients c
WHERE g.client_id IS NULL
  AND g.user_id IS NOT NULL
  AND c.user_id = g.user_id
  AND (SELECT count(*) FROM public.clients c2 WHERE c2.user_id = g.user_id) = 1;

UPDATE public.payment_records p
SET client_id = c.id
FROM public.clients c
WHERE p.client_id IS NULL
  AND p.user_id IS NOT NULL
  AND c.user_id = p.user_id
  AND (SELECT count(*) FROM public.clients c2 WHERE c2.user_id = p.user_id) = 1;

COMMIT;
