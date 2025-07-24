-- Create clients table for onboarding data
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  ssn text NOT NULL,
  phone_number text NOT NULL,
  email_address text NOT NULL,
  drivers_license_path text,
  proof_of_address_path text,
  credit_reports_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their own client data" 
ON public.clients 
FOR ALL
USING (auth.uid()::text = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for client documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for client documents
CREATE POLICY "Users can upload their own client documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own client documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own client documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own client documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'client-documents' AND auth.uid()::text = (storage.foldername(name))[1]);