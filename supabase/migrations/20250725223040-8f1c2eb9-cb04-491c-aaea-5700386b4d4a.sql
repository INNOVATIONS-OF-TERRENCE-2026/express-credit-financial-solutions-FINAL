-- Create table for tracking signed client agreements
CREATE TABLE public.client_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  agreement_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_agreements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own agreements" 
ON public.client_agreements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agreements" 
ON public.client_agreements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create table for AU requests
CREATE TABLE public.au_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  tradeline_id TEXT NOT NULL,
  credit_bureau TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.au_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for AU requests
CREATE POLICY "Users can view their own AU requests" 
ON public.au_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create AU requests" 
ON public.au_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_au_requests_updated_at
BEFORE UPDATE ON public.au_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification log table
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  email_error TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for notification logs
CREATE POLICY "Admins can view all notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert notification logs" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (true);