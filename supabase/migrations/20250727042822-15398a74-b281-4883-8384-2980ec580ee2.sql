-- Check and enable RLS on any tables that might be missing it
-- This should fix the RLS disabled error

-- Enable RLS on wrappers_fdw_stats (this might be the table missing RLS)
ALTER TABLE public.wrappers_fdw_stats ENABLE ROW LEVEL SECURITY;

-- Create a restrictive policy for wrappers_fdw_stats to prevent unauthorized access
CREATE POLICY "Only admins can access wrapper stats" ON public.wrappers_fdw_stats
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));