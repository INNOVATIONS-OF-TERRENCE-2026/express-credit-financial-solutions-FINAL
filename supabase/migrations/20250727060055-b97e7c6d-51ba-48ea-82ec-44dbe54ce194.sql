-- Fix RLS security warnings by enabling RLS on remaining tables

-- Enable RLS on credit_analysis table
ALTER TABLE public.credit_analysis ENABLE ROW LEVEL SECURITY;

-- Create admin policy for credit_analysis
CREATE POLICY "Admins can manage all credit analysis" 
ON public.credit_analysis 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on payments table  
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create admin policy for payments
CREATE POLICY "Admins can manage all payments" 
ON public.payments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on wrappers_fdw_stats table
ALTER TABLE public.wrappers_fdw_stats ENABLE ROW LEVEL SECURITY;

-- Create admin policy for wrappers_fdw_stats
CREATE POLICY "Admins can manage fdw stats" 
ON public.wrappers_fdw_stats 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));