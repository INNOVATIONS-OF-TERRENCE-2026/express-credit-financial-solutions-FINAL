-- Add foreign key constraints and improve CRM table relationships

-- Add foreign keys for proper referential integrity
ALTER TABLE public.admin_notes 
ADD CONSTRAINT fk_admin_notes_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.agreements 
ADD CONSTRAINT fk_agreements_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.credit_analysis 
ADD CONSTRAINT fk_credit_analysis_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.credit_reports 
ADD CONSTRAINT fk_credit_reports_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.ai_letter_previews 
ADD CONSTRAINT fk_ai_letter_previews_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.ai_letter_previews 
ADD CONSTRAINT fk_ai_letter_previews_letter_id 
FOREIGN KEY (letter_id) REFERENCES public.dispute_letters(id) ON DELETE CASCADE;

ALTER TABLE public.payments 
ADD CONSTRAINT fk_payments_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- Add client_id to documents table for admin CRM management
ALTER TABLE public.documents 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Create index on client_id for better performance
CREATE INDEX idx_documents_client_id ON public.documents(client_id);
CREATE INDEX idx_admin_notes_client_id ON public.admin_notes(client_id);
CREATE INDEX idx_credit_reports_client_id ON public.credit_reports(client_id);
CREATE INDEX idx_credit_analysis_client_id ON public.credit_analysis(client_id);
CREATE INDEX idx_dispute_letters_client_id ON public.dispute_letters(client_id);
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_agreements_client_id ON public.agreements(client_id);

-- Update RLS policies for admin CRM access
-- Documents table policies for admin management
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;

CREATE POLICY "Users can manage their own documents" 
ON public.documents 
FOR ALL 
USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all documents" 
ON public.documents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Identity docs table for client document management
CREATE TABLE IF NOT EXISTS public.identity_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('drivers_license', 'utility_bill', 'lease_agreement', 'pay_stub', 'passport', 'state_id', 'social_security_card')),
  uploaded_file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.identity_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all identity docs" 
ON public.identity_docs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_identity_docs_client_id ON public.identity_docs(client_id);

-- Mailing bundles for dispute letter management
CREATE TABLE IF NOT EXISTS public.mailing_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  bundle_name TEXT NOT NULL,
  zip_file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'mailed', 'delivered')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_at TIMESTAMPTZ
);

ALTER TABLE public.mailing_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all bundles" 
ON public.mailing_bundles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_mailing_bundles_client_id ON public.mailing_bundles(client_id);