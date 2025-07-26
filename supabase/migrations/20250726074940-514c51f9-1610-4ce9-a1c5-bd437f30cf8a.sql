-- Create tables for advanced AI and automation features

-- Document Archive table for signed PDFs and agreements
CREATE TABLE public.document_archive (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'agreement', 'dispute_letter', 'credit_report', etc.
  file_size BIGINT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dispute Timeline table
CREATE TABLE public.dispute_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dispute_letter_id UUID REFERENCES public.dispute_letters(id) ON DELETE CASCADE,
  creditor_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  date_generated TIMESTAMP WITH TIME ZONE,
  date_mailed TIMESTAMP WITH TIME ZONE,
  estimated_response_date TIMESTAMP WITH TIME ZONE,
  actual_response_date TIMESTAMP WITH TIME ZONE,
  outcome TEXT, -- 'pending', 'removed', 'updated', 'verified', 'rejected'
  status TEXT NOT NULL DEFAULT 'generated', -- 'generated', 'mailed', 'responded', 'completed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat History table for AI conversations
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  message_role TEXT NOT NULL, -- 'user' or 'assistant'
  message_content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Credit Scan Summary table for AI analysis of credit reports
CREATE TABLE public.credit_scan_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  ai_summary TEXT NOT NULL,
  flagged_accounts JSONB, -- Array of accounts flagged for disputes
  dispute_opportunities INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_scan_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_archive
CREATE POLICY "Users can view their own documents" 
ON public.document_archive 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON public.document_archive 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage documents" 
ON public.document_archive 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for dispute_timeline
CREATE POLICY "Users can view their own timeline" 
ON public.dispute_timeline 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timeline" 
ON public.dispute_timeline 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline" 
ON public.dispute_timeline 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage timeline" 
ON public.dispute_timeline 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for chat_history
CREATE POLICY "Users can view their own chat history" 
ON public.chat_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history" 
ON public.chat_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage chat history" 
ON public.chat_history 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for credit_scan_summaries
CREATE POLICY "Users can view their own scan summaries" 
ON public.credit_scan_summaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan summaries" 
ON public.credit_scan_summaries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage scan summaries" 
ON public.credit_scan_summaries 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_dispute_timeline_updated_at
BEFORE UPDATE ON public.dispute_timeline
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for document archive
INSERT INTO storage.buckets (id, name, public) VALUES ('document-archive', 'document-archive', false);

-- Create storage policies for document archive
CREATE POLICY "Users can view their own archived documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'document-archive' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own archived documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'document-archive' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can manage archived documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'document-archive' AND ((auth.jwt() ->> 'role'::text) = 'service_role'::text));