-- Enable RLS on wrappers_fdw_stats table
ALTER TABLE public.wrappers_fdw_stats ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows access based on existing permissions (this table seems to be for system stats)
CREATE POLICY "Allow system access to fdw stats" 
ON public.wrappers_fdw_stats 
FOR ALL 
USING (true);