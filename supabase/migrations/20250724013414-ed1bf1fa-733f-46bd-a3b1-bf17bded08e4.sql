-- Create dispute_uploads storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dispute-uploads', 'dispute-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for dispute uploads
CREATE POLICY "Users can upload their own dispute documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'dispute-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own dispute documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'dispute-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own dispute documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'dispute-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own dispute documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'dispute-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create dispute_docs table
CREATE TABLE public.dispute_docs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  account_number text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dispute_docs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their own dispute docs" 
ON public.dispute_docs 
FOR ALL
USING (auth.uid()::text = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dispute_docs_updated_at
BEFORE UPDATE ON public.dispute_docs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add client_id foreign key to dispute_letters table
ALTER TABLE public.dispute_letters 
ADD COLUMN client_id uuid REFERENCES public.clients(id);