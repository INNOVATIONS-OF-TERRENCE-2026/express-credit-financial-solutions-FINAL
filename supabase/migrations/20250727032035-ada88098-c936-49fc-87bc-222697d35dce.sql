-- Drop the existing policy that depends on user_id column
DROP POLICY IF EXISTS "Users can manage their own client data" ON public.clients;

-- Update clients table to match requirements
ALTER TABLE public.clients 
DROP COLUMN IF EXISTS drivers_license_path,
DROP COLUMN IF EXISTS proof_of_address_path,
DROP COLUMN IF EXISTS credit_reports_path;

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS ssn_last4 text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS membership_plan text CHECK (membership_plan IN ('Basic', 'Pro', 'Elite'));

-- Update the user_id column to be UUID if it's not already
ALTER TABLE public.clients 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Recreate the RLS policy with correct user_id type
CREATE POLICY "Users can manage their own client data" 
ON public.clients 
FOR ALL 
USING (auth.uid() = user_id);

-- Create identity_docs table
CREATE TABLE IF NOT EXISTS public.identity_docs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('Driver''s License', 'SSN Card', 'Utility Bill', 'Lease', 'Pay Stub')),
  uploaded_file_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create agreements table
CREATE TABLE IF NOT EXISTS public.agreements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  signed_pdf_url text NOT NULL,
  signed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Update credit_reports table
ALTER TABLE public.credit_reports 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS bureau text CHECK (bureau IN ('Experian', 'Equifax', 'TransUnion')),
ADD COLUMN IF NOT EXISTS uploaded_file_url text,
ADD COLUMN IF NOT EXISTS notes text;

-- Update dispute_letters table
ALTER TABLE public.dispute_letters 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS bureau text,
ADD COLUMN IF NOT EXISTS letter_title text,
ADD COLUMN IF NOT EXISTS violation_notes text,
ADD COLUMN IF NOT EXISTS uploaded_file_url text;

-- Enable RLS on new tables
ALTER TABLE public.identity_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for identity_docs
CREATE POLICY "Clients can view their own identity docs" 
ON public.identity_docs 
FOR SELECT 
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert their own identity docs" 
ON public.identity_docs 
FOR INSERT 
WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all identity docs" 
ON public.identity_docs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for agreements
CREATE POLICY "Clients can view their own agreements" 
ON public.agreements 
FOR SELECT 
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert their own agreements" 
ON public.agreements 
FOR INSERT 
WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all agreements" 
ON public.agreements 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage buckets for client documents
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('client-agreements', 'client-agreements', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for client documents
CREATE POLICY "Clients can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clients can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can manage all client documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'client-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Create storage policies for client agreements
CREATE POLICY "Clients can upload their own agreements" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-agreements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clients can view their own agreements" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-agreements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can manage all client agreements" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'client-agreements' AND has_role(auth.uid(), 'admin'::app_role));