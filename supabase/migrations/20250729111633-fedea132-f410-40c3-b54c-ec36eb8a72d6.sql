-- First, enable RLS on the violation_flags table that currently has it disabled
ALTER TABLE public.violation_flags ENABLE ROW LEVEL SECURITY;

-- Create policies for violation_flags
CREATE POLICY "Admins can manage all violation flags" ON public.violation_flags
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add missing columns to clients table to match component expectations
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS membership_plan TEXT DEFAULT 'Basic';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS progress_status INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS agreement_signed BOOLEAN DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS documents_uploaded INTEGER DEFAULT 0;

-- Update the existing email column name for clarity (but keep email as well for compatibility)
-- We'll use a migration to ensure email_address is populated
UPDATE public.clients SET email = COALESCE(email, 'unknown@example.com') WHERE email IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_membership_plan ON public.clients(membership_plan);

-- Add missing fields to credit_reports table if needed
ALTER TABLE public.credit_reports ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);