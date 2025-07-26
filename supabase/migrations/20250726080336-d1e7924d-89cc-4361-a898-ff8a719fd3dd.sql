-- Create document_uploads table for sensitive ID documents
CREATE TABLE public.document_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'drivers_license', 'social_security_card', 'utility_bill', 'lease_agreement', 'pay_stub', 'other'
  tag TEXT, -- 'id_verification', 'proof_of_address', 'income_verification', 'other'
  ai_analysis_result TEXT, -- AI-generated description of document
  admin_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'needs_review'
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_uploads
CREATE POLICY "Users can view their own documents" 
ON public.document_uploads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON public.document_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.document_uploads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" 
ON public.document_uploads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all documents" 
ON public.document_uploads 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage documents" 
ON public.document_uploads 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_document_uploads_updated_at
BEFORE UPDATE ON public.document_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('document-uploads', 'document-uploads', false);

-- Create storage policies for document uploads
CREATE POLICY "Users can view their own uploaded documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'document-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'document-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'document-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'document-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all uploaded documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'document-uploads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage uploaded documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'document-uploads' AND ((auth.jwt() ->> 'role'::text) = 'service_role'::text));