-- First, let's see the current view definition
SELECT definition FROM pg_views WHERE viewname = 'bank_links_safe';

-- Drop the existing insecure view
DROP VIEW IF EXISTS public.bank_links_safe;

-- Create a secure version that only shows user's own data
CREATE VIEW public.bank_links_safe AS
SELECT 
    account_id,
    id,
    user_id,
    created_at
FROM public.bank_links
WHERE user_id = auth.uid()
   OR has_role(auth.uid(), 'admin'::app_role)
   OR (auth.jwt() ->> 'role'::text) = 'service_role'::text;