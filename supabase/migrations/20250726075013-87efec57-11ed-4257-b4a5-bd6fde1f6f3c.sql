-- Enable RLS on wrappers_fdw_stats table if it exists and is user-facing
-- This table appears to be a system table for wrappers, so we should enable RLS for security
ALTER TABLE public.wrappers_fdw_stats ENABLE ROW LEVEL SECURITY;

-- Add a restrictive policy to prevent unauthorized access
CREATE POLICY "No public access to wrappers stats" 
ON public.wrappers_fdw_stats 
FOR ALL 
USING (false);