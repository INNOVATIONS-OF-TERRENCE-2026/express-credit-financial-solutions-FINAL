CREATE TABLE public.marketing_cta_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  cta_id text NOT NULL,
  session_id text,
  user_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.marketing_cta_events TO anon;
GRANT INSERT, SELECT ON public.marketing_cta_events TO authenticated;
GRANT ALL ON public.marketing_cta_events TO service_role;

ALTER TABLE public.marketing_cta_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert cta events"
  ON public.marketing_cta_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admins can read cta events"
  ON public.marketing_cta_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX marketing_cta_events_created_at_idx ON public.marketing_cta_events (created_at DESC);
CREATE INDEX marketing_cta_events_cta_id_idx ON public.marketing_cta_events (cta_id);
CREATE INDEX marketing_cta_events_event_idx ON public.marketing_cta_events (event);
CREATE INDEX marketing_cta_events_session_id_idx ON public.marketing_cta_events (session_id);