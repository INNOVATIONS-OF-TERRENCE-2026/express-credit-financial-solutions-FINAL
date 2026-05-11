
-- 1. credit_reports version history (additive)
ALTER TABLE public.credit_reports
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.bump_credit_report_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version integer;
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    SELECT COALESCE(MAX(version), 0) + 1 INTO next_version
      FROM public.credit_reports
      WHERE client_id = NEW.client_id;
    NEW.version := next_version;

    UPDATE public.credit_reports
      SET is_current = false
      WHERE client_id = NEW.client_id AND id <> NEW.id;
    NEW.is_current := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS credit_reports_versioning ON public.credit_reports;
CREATE TRIGGER credit_reports_versioning
BEFORE INSERT ON public.credit_reports
FOR EACH ROW
EXECUTE FUNCTION public.bump_credit_report_version();

-- 2. client_agreements: link to client and stored PDF
ALTER TABLE public.client_agreements
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS signed_pdf_path text;

CREATE INDEX IF NOT EXISTS client_agreements_client_id_idx
  ON public.client_agreements(client_id);

-- 3. Storage policies for client-agreements bucket (additive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='client_agreements_owner_insert'
  ) THEN
    CREATE POLICY "client_agreements_owner_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'client-agreements'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='client_agreements_owner_select'
  ) THEN
    CREATE POLICY "client_agreements_owner_select"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'client-agreements'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='client_agreements_admin_all'
  ) THEN
    CREATE POLICY "client_agreements_admin_all"
      ON storage.objects FOR ALL
      TO authenticated
      USING (
        bucket_id = 'client-agreements'
        AND public.has_role(auth.uid(), 'admin'::public.app_role)
      )
      WITH CHECK (
        bucket_id = 'client-agreements'
        AND public.has_role(auth.uid(), 'admin'::public.app_role)
      );
  END IF;
END $$;
