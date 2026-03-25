-- Allow admins to read client_agreements (needed for backlog readiness checks)
CREATE POLICY "Admins can view all agreements"
ON public.client_agreements
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to read all flagged_disputes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all flagged disputes' AND tablename = 'flagged_disputes'
  ) THEN
    CREATE POLICY "Admins can view all flagged disputes"
    ON public.flagged_disputes
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Allow admins to update flagged_disputes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all flagged disputes' AND tablename = 'flagged_disputes'
  ) THEN
    CREATE POLICY "Admins can update all flagged disputes"
    ON public.flagged_disputes
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Allow admins to insert flagged_disputes  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert flagged disputes' AND tablename = 'flagged_disputes'
  ) THEN
    CREATE POLICY "Admins can insert flagged disputes"
    ON public.flagged_disputes
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;