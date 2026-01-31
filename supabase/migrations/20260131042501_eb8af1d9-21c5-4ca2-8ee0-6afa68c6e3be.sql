-- Create secure client verification table
CREATE TABLE public.client_verification_secure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_document_url TEXT,
  ssn_document_url TEXT,
  address_document_url TEXT,
  ssn_encrypted TEXT,
  experian_username_encrypted TEXT,
  experian_password_encrypted TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.client_verification_secure ENABLE ROW LEVEL SECURITY;

-- Users can insert their own verification data
CREATE POLICY "Users can insert their own verification data"
ON public.client_verification_secure
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification data
CREATE POLICY "Users can update their own verification data"
ON public.client_verification_secure
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can view their own verification data (limited fields)
CREATE POLICY "Users can view their own verification data"
ON public.client_verification_secure
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all verification data
CREATE POLICY "Admins can view all verification data"
ON public.client_verification_secure
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage all verification data
CREATE POLICY "Service role can manage verification data"
ON public.client_verification_secure
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create trigger to update updated_at
CREATE TRIGGER update_client_verification_updated_at
BEFORE UPDATE ON public.client_verification_secure
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for secure verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification docs
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own verification docs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all verification docs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'verification-docs' AND has_role(auth.uid(), 'admin'::app_role));