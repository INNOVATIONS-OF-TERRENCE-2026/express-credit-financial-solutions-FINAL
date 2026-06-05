
-- Drop the unscoped INSERT policy on cashapp-proofs (path-scoped one remains)
DROP POLICY IF EXISTS "Authenticated users can upload cashapp proofs" ON storage.objects;

-- Allow clients to read their own AI letter previews
CREATE POLICY "Clients view own ai letter previews"
ON public.ai_letter_previews
FOR SELECT
TO authenticated
USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);

-- Allow admins to read document-archive bucket via portal
CREATE POLICY "Admins can read document archive"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-archive' AND public.has_role(auth.uid(), 'admin')
);
