
-- ===== client_registry_exclusions =====
CREATE TABLE IF NOT EXISTS public.client_registry_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('profile','orphan_identity','client')),
  source_id text NOT NULL,
  email text,
  name text,
  reason text,
  status text NOT NULL DEFAULT 'ignored' CHECK (status IN ('prospect','not_client','test_account','ignored','archived')),
  excluded_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_registry_exclusions TO authenticated;
GRANT ALL ON public.client_registry_exclusions TO service_role;

ALTER TABLE public.client_registry_exclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage registry exclusions"
  ON public.client_registry_exclusions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_cre_updated_at
  BEFORE UPDATE ON public.client_registry_exclusions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== client_payment_summary =====
CREATE TABLE IF NOT EXISTS public.client_payment_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid,
  expected_amount numeric NOT NULL DEFAULT 600,
  paid_amount numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','pending','partial','paid','refunded','waived','disputed','manual_review')),
  payment_method text,
  payment_date timestamptz,
  service_type text DEFAULT 'Credit Repair',
  receipt_reference text,
  verified_by_admin boolean NOT NULL DEFAULT false,
  visible_to_client boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_payment_summary TO authenticated;
GRANT ALL ON public.client_payment_summary TO service_role;

ALTER TABLE public.client_payment_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payment summaries"
  ON public.client_payment_summary
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own payment summary"
  ON public.client_payment_summary
  FOR SELECT
  TO authenticated
  USING (
    visible_to_client = true
    AND (
      user_id = auth.uid()
      OR client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    )
  );

CREATE TRIGGER trg_cps_updated_at
  BEFORE UPDATE ON public.client_payment_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create a summary row on new client
CREATE OR REPLACE FUNCTION public.tg_clients_create_payment_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.client_payment_summary (client_id, user_id)
  VALUES (NEW.id, NEW.user_id)
  ON CONFLICT (client_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clients_create_payment_summary ON public.clients;
CREATE TRIGGER trg_clients_create_payment_summary
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.tg_clients_create_payment_summary();

-- Helper RPC
CREATE OR REPLACE FUNCTION public.ensure_payment_summary(p_client_id uuid)
RETURNS public.client_payment_summary
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.client_payment_summary;
  v_user uuid;
BEGIN
  SELECT user_id INTO v_user FROM public.clients WHERE id = p_client_id;
  INSERT INTO public.client_payment_summary (client_id, user_id)
  VALUES (p_client_id, v_user)
  ON CONFLICT (client_id) DO UPDATE SET user_id = COALESCE(public.client_payment_summary.user_id, EXCLUDED.user_id)
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_payment_summary(uuid) TO authenticated, service_role;

-- Backfill one row per existing client
INSERT INTO public.client_payment_summary (client_id, user_id)
SELECT c.id, c.user_id
FROM public.clients c
LEFT JOIN public.client_payment_summary s ON s.client_id = c.id
WHERE s.id IS NULL;
