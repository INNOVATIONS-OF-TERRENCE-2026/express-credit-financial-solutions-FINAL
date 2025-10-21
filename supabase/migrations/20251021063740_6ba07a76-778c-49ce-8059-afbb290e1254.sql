-- Drop the existing bank_links_safe view
DROP VIEW IF EXISTS public.bank_links_safe;

-- Recreate the view with proper security restrictions
-- This view only shows safe fields (excludes access_token) and enforces security
CREATE OR REPLACE VIEW public.bank_links_safe
WITH (security_barrier = true, security_invoker = true)
AS
SELECT 
  bl.id,
  bl.created_at,
  bl.user_id,
  bl.account_id
FROM public.bank_links bl
WHERE 
  -- Users can only see their own records
  bl.user_id = auth.uid()
  -- OR user is an admin
  OR public.has_role(auth.uid(), 'admin'::app_role)
  -- OR request is from service role
  OR (auth.jwt() ->> 'role') = 'service_role';

-- Grant appropriate permissions
GRANT SELECT ON public.bank_links_safe TO authenticated;
GRANT ALL ON public.bank_links_safe TO service_role;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.bank_links_safe IS 'Secure view of bank_links table that excludes sensitive access_token field and enforces user-level access control';
