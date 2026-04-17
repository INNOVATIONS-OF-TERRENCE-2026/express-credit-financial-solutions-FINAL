-- Phase 1: Set bucket limits and allowed mime types
UPDATE storage.buckets 
SET file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp','image/jpg']
WHERE id IN ('credit-reports','identity-docs','utility-bills','ssn-docs','dispute-letters','admin-docs','client-documents','documents','document-uploads','verification-docs');

-- Helper: drop existing policies for these buckets so we can recreate cleanly
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'admin_full_%' OR policyname LIKE 'client_own_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Admin full access on all sensitive buckets
CREATE POLICY "admin_full_credit_reports" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'credit-reports' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'credit-reports' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_full_identity_docs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'identity-docs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'identity-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_full_utility_bills" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'utility-bills' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'utility-bills' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_full_ssn_docs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'ssn-docs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'ssn-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_full_dispute_letters" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'dispute-letters' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'dispute-letters' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_full_admin_docs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'admin-docs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'admin-docs' AND public.has_role(auth.uid(), 'admin'));

-- Client own-folder access (path must start with their auth.uid())
CREATE POLICY "client_own_credit_reports_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'credit-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client_own_credit_reports_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'credit-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client_own_credit_reports_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'credit-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client_own_credit_reports_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'credit-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "client_own_identity_docs_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client_own_identity_docs_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "client_own_utility_bills_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'utility-bills' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client_own_utility_bills_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'utility-bills' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "client_own_ssn_docs_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ssn-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "client_own_ssn_docs_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ssn-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "client_own_dispute_letters_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dispute-letters' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  related_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  related_user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert notifications" ON public.admin_notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete notifications" ON public.admin_notifications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread 
  ON public.admin_notifications (is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_client 
  ON public.admin_notifications (related_client_id);