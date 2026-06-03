
-- =========================================
-- Payment system tables
-- =========================================

CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_app','apple_pay')),
  payment_amount NUMERIC(12,2) NOT NULL CHECK (payment_amount >= 1),
  payment_note TEXT,
  payment_proof_file_path TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','approved','rejected','needs_review')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  admin_notes TEXT,
  rejection_reason TEXT,
  client_visible_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_records_user ON public.payment_records(user_id);
CREATE INDEX idx_payment_records_status ON public.payment_records(payment_status);
CREATE INDEX idx_payment_records_submitted ON public.payment_records(submitted_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.payment_records TO authenticated;
GRANT ALL ON public.payment_records TO service_role;

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients insert own payment"
  ON public.payment_records FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clients view own payment"
  ON public.payment_records FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Clients update own payment"
  ON public.payment_records FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================
CREATE TABLE public.payment_activity_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_record_id UUID NOT NULL REFERENCES public.payment_records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  client_id UUID,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  visible_to_client BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_events_record ON public.payment_activity_events(payment_record_id);
CREATE INDEX idx_payment_events_user ON public.payment_activity_events(user_id);

GRANT SELECT ON public.payment_activity_events TO authenticated;
GRANT ALL ON public.payment_activity_events TO service_role;

ALTER TABLE public.payment_activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own payment events"
  ON public.payment_activity_events FOR SELECT TO authenticated
  USING ((user_id = auth.uid() AND visible_to_client = true) OR public.has_role(auth.uid(),'admin'));

-- =========================================
CREATE TABLE public.client_payment_summary (
  user_id UUID NOT NULL PRIMARY KEY,
  client_id UUID,
  total_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_pending NUMERIC(14,2) NOT NULL DEFAULT 0,
  last_payment_amount NUMERIC(12,2),
  last_payment_method TEXT,
  last_payment_status TEXT,
  last_payment_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.client_payment_summary TO authenticated;
GRANT ALL ON public.client_payment_summary TO service_role;

ALTER TABLE public.client_payment_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own summary"
  ON public.client_payment_summary FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================
CREATE TABLE public.payment_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_record_id UUID REFERENCES public.payment_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'payment',
  read_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_notifications_user ON public.payment_notifications(user_id, read_status);

GRANT SELECT, UPDATE ON public.payment_notifications TO authenticated;
GRANT ALL ON public.payment_notifications TO service_role;

ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own payment notifs"
  ON public.payment_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Clients mark own payment notifs read"
  ON public.payment_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================
-- Triggers
-- =========================================

CREATE TRIGGER trg_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.tg_payment_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.payment_activity_events
    (payment_record_id, user_id, client_id, event_type, title, description, visible_to_client, created_by)
  VALUES
    (NEW.id, NEW.user_id, NEW.client_id, 'payment_submitted',
     'Payment proof submitted',
     'Your payment proof was submitted and is pending review.',
     true, NEW.user_id);

  INSERT INTO public.payment_notifications (user_id, payment_record_id, title, message, type)
  VALUES (NEW.user_id, NEW.id,
    'Payment proof submitted',
    'We received your $' || to_char(NEW.payment_amount,'FM999999990.00') ||
      ' payment proof. It is pending admin review.',
    'payment');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_after_insert
  AFTER INSERT ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_after_insert();

CREATE OR REPLACE FUNCTION public.tg_payment_after_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title TEXT;
  v_desc  TEXT;
  v_event TEXT;
BEGIN
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    IF NEW.payment_status = 'approved' THEN
      v_event := 'payment_approved';
      v_title := 'Payment approved';
      v_desc  := 'Your payment of $' || to_char(NEW.payment_amount,'FM999999990.00') || ' was approved.';
    ELSIF NEW.payment_status = 'rejected' THEN
      v_event := 'payment_rejected';
      v_title := 'Payment proof rejected';
      v_desc  := COALESCE(NEW.rejection_reason,
        'Your payment proof could not be verified. Please upload clearer proof or contact support.');
    ELSIF NEW.payment_status = 'needs_review' THEN
      v_event := 'payment_needs_review';
      v_title := 'Payment needs review';
      v_desc  := COALESCE(NEW.client_visible_message,
        'Please upload a clearer screenshot of your payment.');
    ELSIF NEW.payment_status = 'pending' AND OLD.payment_status IN ('rejected','needs_review') THEN
      v_event := 'payment_note_added';
      v_title := 'Replacement proof uploaded';
      v_desc  := 'A new payment proof was submitted and is pending review.';
    END IF;

    IF v_event IS NOT NULL THEN
      INSERT INTO public.payment_activity_events
        (payment_record_id, user_id, client_id, event_type, title, description, visible_to_client, created_by)
      VALUES (NEW.id, NEW.user_id, NEW.client_id, v_event, v_title, v_desc, true, auth.uid());

      INSERT INTO public.payment_notifications (user_id, payment_record_id, title, message, type)
      VALUES (NEW.user_id, NEW.id, v_title, v_desc, 'payment');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_after_update
  AFTER UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_after_update();

CREATE OR REPLACE FUNCTION public.tg_payment_summary_sync()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := COALESCE(NEW.user_id, OLD.user_id);
  v_total NUMERIC(14,2);
  v_pending NUMERIC(14,2);
  v_last_amt NUMERIC(12,2);
  v_last_method TEXT;
  v_last_status TEXT;
  v_last_date TIMESTAMPTZ;
  v_client UUID;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN payment_status = 'approved' THEN payment_amount ELSE 0 END),0),
    COALESCE(SUM(CASE WHEN payment_status = 'pending'  THEN payment_amount ELSE 0 END),0)
  INTO v_total, v_pending
  FROM public.payment_records WHERE user_id = v_user;

  SELECT payment_amount, payment_method, payment_status, submitted_at, client_id
    INTO v_last_amt, v_last_method, v_last_status, v_last_date, v_client
  FROM public.payment_records
  WHERE user_id = v_user
  ORDER BY submitted_at DESC
  LIMIT 1;

  INSERT INTO public.client_payment_summary
    (user_id, client_id, total_paid, total_pending,
     last_payment_amount, last_payment_method, last_payment_status, last_payment_date, updated_at)
  VALUES (v_user, v_client, v_total, v_pending,
          v_last_amt, v_last_method, v_last_status, v_last_date, now())
  ON CONFLICT (user_id) DO UPDATE SET
    client_id = EXCLUDED.client_id,
    total_paid = EXCLUDED.total_paid,
    total_pending = EXCLUDED.total_pending,
    last_payment_amount = EXCLUDED.last_payment_amount,
    last_payment_method = EXCLUDED.last_payment_method,
    last_payment_status = EXCLUDED.last_payment_status,
    last_payment_date = EXCLUDED.last_payment_date,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_payment_summary_sync_ins
  AFTER INSERT ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_summary_sync();

CREATE TRIGGER trg_payment_summary_sync_upd
  AFTER UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.tg_payment_summary_sync();

-- =========================================
-- Storage policies on existing private bucket "cashapp-proofs"
-- Path convention: {auth.uid()}/{record_id}.{ext}
-- =========================================

CREATE POLICY "Clients upload own payment proof"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cashapp-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Clients read own payment proof"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cashapp-proofs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin'))
  );

CREATE POLICY "Clients replace own payment proof"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cashapp-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
