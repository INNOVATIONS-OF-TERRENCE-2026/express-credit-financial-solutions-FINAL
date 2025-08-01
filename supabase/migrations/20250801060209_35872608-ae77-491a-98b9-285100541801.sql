-- Create table for credit report uploads with analysis tracking
CREATE TABLE IF NOT EXISTS public.credit_report_uploads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    analysis_status TEXT DEFAULT 'pending',
    analysis_url TEXT,
    flagged_accounts_count INTEGER DEFAULT 0,
    ai_analysis_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on credit_report_uploads
ALTER TABLE public.credit_report_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_report_uploads
CREATE POLICY "Users can insert their own uploads" ON public.credit_report_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own uploads" ON public.credit_report_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads" ON public.credit_report_uploads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all uploads" ON public.credit_report_uploads
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all uploads" ON public.credit_report_uploads
    FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage uploads" ON public.credit_report_uploads
    FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_report_uploads_user_id ON public.credit_report_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_report_uploads_client_id ON public.credit_report_uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_report_uploads_uploaded_at ON public.credit_report_uploads(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_credit_report_uploads_analysis_status ON public.credit_report_uploads(analysis_status);

-- Update file_upload_config to include more file types
UPDATE public.file_upload_config 
SET allowed_file_types = ARRAY['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'csv', 'txt']
WHERE id = (SELECT id FROM public.file_upload_config LIMIT 1);