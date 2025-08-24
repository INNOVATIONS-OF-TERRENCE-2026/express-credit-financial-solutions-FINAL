-- Create signatures storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', false);

-- Create storage policies for signatures bucket
CREATE POLICY "Users can upload their own signatures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own signatures" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own signatures" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own signatures" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin policies for signatures
CREATE POLICY "Admins can view all signatures" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'signatures' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all signatures" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'signatures' AND has_role(auth.uid(), 'admin'::app_role));