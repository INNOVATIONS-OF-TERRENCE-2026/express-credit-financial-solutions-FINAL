
-- 1. bank_links: drop user SELECT (access_token must never leave the server)
DROP POLICY IF EXISTS "Users can view their own bank links" ON public.bank_links;

-- Safe view so clients can still list which banks they've connected (no token)
CREATE OR REPLACE VIEW public.bank_links_public
WITH (security_invoker = true)
AS
  SELECT id, user_id, account_id, created_at
  FROM public.bank_links
  WHERE auth.uid() = user_id;

GRANT SELECT ON public.bank_links_public TO authenticated;

-- 2. cashapp-proofs: remove anonymous upload policy
DROP POLICY IF EXISTS "Anon users can upload cashapp proofs" ON storage.objects;

-- 3. documents bucket: replace permissive authenticated policies with per-user folder scoping
DROP POLICY IF EXISTS "Allow authenticated reads from documents flreew_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to documents flreew_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to documents flreew_1" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from documents flreew_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from documents flreew_1" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to documents flreew_0" ON storage.objects;

CREATE POLICY "documents bucket: users read own folder"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "documents bucket: users upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "documents bucket: users update own folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "documents bucket: users delete own folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "documents bucket: admins manage all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 4. autonomous_settings: admin-only SELECT
DROP POLICY IF EXISTS "Authenticated can read autonomous settings" ON public.autonomous_settings;

-- 5. user_roles: restrictive policy blocking self-elevation to admin/moderator
CREATE POLICY "Block self-elevation to privileged roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR role = 'user'::app_role
  );

CREATE POLICY "Block updates to privileged roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
