-- Create admin_notes table for internal admin notes per client
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id),
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Policies for admin_notes
CREATE POLICY "Admins can manage all notes" ON public.admin_notes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create education_progress table for tracking learning modules
CREATE TABLE public.education_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  badges_earned JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.education_progress ENABLE ROW LEVEL SECURITY;

-- Policies for education_progress
CREATE POLICY "Users can manage their own education progress" ON public.education_progress
FOR ALL USING (auth.uid() = user_id);

-- Create payment_receipts table for auto-generated receipts
CREATE TABLE public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  receipt_id TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  membership_level TEXT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  card_last_four TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  receipt_pdf_url TEXT,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Policies for payment_receipts
CREATE POLICY "Users can view their own receipts" ON public.payment_receipts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage receipts" ON public.payment_receipts
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Add progress tracking columns to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS progress_status INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS documents_uploaded INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS agreement_signed BOOLEAN DEFAULT false;

-- Create client_search_filters table for advanced search
CREATE TABLE public.client_search_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  filter_name TEXT NOT NULL,
  filter_criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_search_filters ENABLE ROW LEVEL SECURITY;

-- Policies for client_search_filters
CREATE POLICY "Admins can manage their own filters" ON public.client_search_filters
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = admin_user_id);

-- Create mailing_bundles table for dispute letter packages
CREATE TABLE public.mailing_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  bundle_name TEXT NOT NULL,
  zip_file_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.mailing_bundles ENABLE ROW LEVEL SECURITY;

-- Policies for mailing_bundles
CREATE POLICY "Clients can view their own bundles" ON public.mailing_bundles
FOR SELECT USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all bundles" ON public.mailing_bundles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create demo_user table for test mode
CREATE TABLE public.demo_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_demo BOOLEAN DEFAULT true,
  demo_data JSONB DEFAULT '{}'::jsonb,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_users ENABLE ROW LEVEL SECURITY;

-- Policies for demo_users
CREATE POLICY "Admins can manage demo users" ON public.demo_users
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update existing tables with missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email_address);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone_number);
CREATE INDEX IF NOT EXISTS idx_clients_ssn_last4 ON public.clients(ssn_last4);
CREATE INDEX IF NOT EXISTS idx_dispute_letters_user_id ON public.dispute_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_docs_client_id ON public.identity_docs(client_id);

-- Add trigger for updated_at columns
CREATE TRIGGER update_admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_education_progress_updated_at
  BEFORE UPDATE ON public.education_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();