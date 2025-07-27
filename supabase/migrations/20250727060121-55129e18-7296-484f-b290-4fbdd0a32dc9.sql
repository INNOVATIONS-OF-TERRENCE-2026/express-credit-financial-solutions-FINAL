-- Fix RLS security warnings for tables we can control

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