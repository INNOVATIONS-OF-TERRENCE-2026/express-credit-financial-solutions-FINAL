-- =====================================================================
-- Client case-item tables: hard inquiries + personal-info variations
--
-- Backs the upgraded white-label client portal "Case File" sections.
-- These per-item entities had NO structured table in the schema before.
--
-- SAFETY CONTRACT (live database):
--   - Purely ADDITIVE. NO DROP TABLE / DROP COLUMN / DELETE / data mutation.
--   - Idempotent: CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS on the
--     new objects only / CREATE OR REPLACE VIEW.
--   - Internal admin notes are isolated from clients via column-limited,
--     auth.uid()-scoped "public" views (mirrors the existing *_safe views).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Hard inquiries targeted for the client.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_inquiries (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id       uuid,
  inquiry_name  text NOT NULL,
  bureau        text,
  inquiry_date  date,
  inquiry_type  text,
  status        text NOT NULL DEFAULT 'queued',
  action_state  text NOT NULL DEFAULT 'targeted',
  result        text,
  client_note   text,
  internal_note text,
  client_visible boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_inquiries_client ON public.client_inquiries(client_id);
CREATE INDEX IF NOT EXISTS idx_client_inquiries_user   ON public.client_inquiries(user_id);

ALTER TABLE public.client_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_inquiries admin all" ON public.client_inquiries;
CREATE POLICY "client_inquiries admin all" ON public.client_inquiries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "client_inquiries service role" ON public.client_inquiries;
CREATE POLICY "client_inquiries service role" ON public.client_inquiries
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'service_role');

-- ---------------------------------------------------------------------
-- 2. Personal-information variations targeted for correction/removal.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_personal_info_variations (
  id               uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id        uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id          uuid,
  variation_type   text NOT NULL,           -- name | address | phone | employer | other
  reported_value   text,
  bureau           text,
  status           text NOT NULL DEFAULT 'queued',
  correction_state text NOT NULL DEFAULT 'targeted',
  client_note      text,
  internal_note    text,
  client_visible   boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_pi_client ON public.client_personal_info_variations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_pi_user   ON public.client_personal_info_variations(user_id);

ALTER TABLE public.client_personal_info_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_pi admin all" ON public.client_personal_info_variations;
CREATE POLICY "client_pi admin all" ON public.client_personal_info_variations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "client_pi service role" ON public.client_personal_info_variations;
CREATE POLICY "client_pi service role" ON public.client_personal_info_variations
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'service_role');

-- ---------------------------------------------------------------------
-- 3. Client-facing views. Definer views (security_invoker = false) that
--    expose ONLY client-safe columns (NO internal_note) and ONLY rows
--    that (a) are marked client_visible and (b) belong to the calling
--    user's linked client record. The base tables stay admin/service-only,
--    so a client can never read internal notes from the base table.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.client_inquiries_public
WITH (security_invoker = false) AS
  SELECT
    i.id, i.client_id, i.inquiry_name, i.bureau, i.inquiry_date,
    i.inquiry_type, i.status, i.action_state, i.result, i.client_note,
    i.created_at, i.updated_at
  FROM public.client_inquiries i
  WHERE i.client_visible = true
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = i.client_id AND c.user_id = auth.uid()
    );

GRANT SELECT ON public.client_inquiries_public TO authenticated, service_role;

CREATE OR REPLACE VIEW public.client_personal_info_public
WITH (security_invoker = false) AS
  SELECT
    p.id, p.client_id, p.variation_type, p.reported_value, p.bureau,
    p.status, p.correction_state, p.client_note, p.created_at, p.updated_at
  FROM public.client_personal_info_variations p
  WHERE p.client_visible = true
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = p.client_id AND c.user_id = auth.uid()
    );

GRANT SELECT ON public.client_personal_info_public TO authenticated, service_role;
