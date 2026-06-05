-- Phase 1: additive status columns + normalization
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS service_status text,
  ADD COLUMN IF NOT EXISTS access_services_enabled boolean;

-- Backfill real clients (not_a_client = false) to active premium service-enabled defaults
UPDATE public.clients
SET
  status = COALESCE(NULLIF(status,''), 'active'),
  portal_status = COALESCE(NULLIF(portal_status,''), 'active'),
  membership_plan = COALESCE(NULLIF(membership_plan,''), 'premium'),
  payment_status = COALESCE(NULLIF(payment_status,''), 'active'),
  service_status = COALESCE(NULLIF(service_status,''), 'active'),
  access_services_enabled = COALESCE(access_services_enabled, true)
WHERE COALESCE(not_a_client, false) = false;

-- Phase 9: backfill $600 default expected_amount on client_payment_summary
UPDATE public.client_payment_summary
SET expected_amount = 600
WHERE expected_amount IS NULL OR expected_amount = 0;

-- Ensure every real client has a payment summary row defaulted to $600
INSERT INTO public.client_payment_summary (client_id, user_id, expected_amount)
SELECT c.id, c.user_id, 600
FROM public.clients c
LEFT JOIN public.client_payment_summary s ON s.client_id = c.id
WHERE s.client_id IS NULL
  AND COALESCE(c.not_a_client, false) = false
ON CONFLICT (client_id) DO NOTHING;

-- Verification view: portal link, document/archive counts, payment-summary consistency, scores
CREATE OR REPLACE VIEW public.v_client_verification_report AS
SELECT
  c.id                                AS client_id,
  c.full_name,
  c.email,
  c.user_id,
  c.status,
  c.portal_status,
  c.membership_plan,
  c.payment_status,
  c.service_status,
  c.access_services_enabled,
  c.not_a_client,
  (c.user_id IS NOT NULL)             AS portal_linked,
  p.user_id IS NOT NULL               AS profile_email_match,
  (SELECT COUNT(*) FROM public.documents d        WHERE d.client_id = c.id)         AS documents_count,
  (SELECT COUNT(*) FROM public.document_archive a WHERE a.client_id = c.id)         AS archive_count,
  (SELECT COUNT(*) FROM public.credit_report_uploads r WHERE r.client_id = c.id)    AS reports_count,
  (SELECT COUNT(*) FROM public.dispute_letters dl WHERE dl.client_id = c.id)        AS disputes_count,
  s.expected_amount,
  s.paid_amount,
  s.payment_status                    AS payment_summary_status,
  (s.client_id IS NOT NULL)           AS payment_summary_exists,
  (COALESCE(s.expected_amount,0) = 600) AS payment_amount_ok,
  (s.user_id IS NOT DISTINCT FROM c.user_id) AS payment_user_link_ok,
  cs.experian_score,
  cs.equifax_score,
  cs.transunion_score,
  cs.updated_at                       AS score_updated_at,
  (cs.client_id IS NOT NULL)          AS has_score
FROM public.clients c
LEFT JOIN public.profiles p ON lower(p.email) = lower(c.email)
LEFT JOIN public.client_payment_summary s ON s.client_id = c.id
LEFT JOIN LATERAL (
  SELECT * FROM public.client_credit_scores x
  WHERE x.client_id = c.id
  ORDER BY x.updated_at DESC NULLS LAST
  LIMIT 1
) cs ON true;

GRANT SELECT ON public.v_client_verification_report TO authenticated;
GRANT ALL    ON public.v_client_verification_report TO service_role;