-- Create table for credit monitoring data
CREATE TABLE public.credit_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_score INTEGER,
  score_provider TEXT, -- 'experian', 'equifax', 'transunion'
  score_date DATE NOT NULL,
  previous_score INTEGER,
  score_change INTEGER,
  report_data JSONB, -- Full credit report data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for credit alerts
CREATE TABLE public.credit_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'new_inquiry', 'collection_added', 'score_change', 'new_account', 'payment_missed'
  alert_title TEXT NOT NULL,
  alert_description TEXT,
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  is_read BOOLEAN DEFAULT false,
  alert_data JSONB, -- Additional alert details
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for API credentials management
CREATE TABLE public.credit_api_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_provider TEXT NOT NULL, -- 'identityiq', 'credit_hero'
  api_key TEXT NOT NULL,
  api_secret TEXT,
  username TEXT,
  password TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_api_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_monitoring
CREATE POLICY "Users can view their own credit monitoring data" 
ON public.credit_monitoring 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit monitoring data" 
ON public.credit_monitoring 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit monitoring data" 
ON public.credit_monitoring 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for credit_alerts
CREATE POLICY "Users can view their own credit alerts" 
ON public.credit_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit alerts" 
ON public.credit_alerts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert credit alerts" 
ON public.credit_alerts 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for credit_api_credentials
CREATE POLICY "Users can manage their own API credentials" 
ON public.credit_api_credentials 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all API credentials" 
ON public.credit_api_credentials 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_credit_monitoring_updated_at
BEFORE UPDATE ON public.credit_monitoring
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_api_credentials_updated_at
BEFORE UPDATE ON public.credit_api_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_credit_monitoring_user_id ON public.credit_monitoring(user_id);
CREATE INDEX idx_credit_monitoring_score_date ON public.credit_monitoring(score_date DESC);
CREATE INDEX idx_credit_alerts_user_id ON public.credit_alerts(user_id);
CREATE INDEX idx_credit_alerts_created_at ON public.credit_alerts(created_at DESC);
CREATE INDEX idx_credit_api_credentials_user_id ON public.credit_api_credentials(user_id);