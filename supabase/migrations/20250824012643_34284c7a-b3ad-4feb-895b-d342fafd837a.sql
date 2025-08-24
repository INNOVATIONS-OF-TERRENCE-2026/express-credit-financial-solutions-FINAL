-- Create a more standard secure view to avoid security definer warnings
-- Since bank_links already has proper RLS policies, we can rely on those
DROP VIEW IF EXISTS public.bank_links_safe;

CREATE VIEW public.bank_links_safe 
WITH (security_barrier = true) AS
SELECT 
    account_id,
    id,
    user_id,
    created_at
FROM public.bank_links;