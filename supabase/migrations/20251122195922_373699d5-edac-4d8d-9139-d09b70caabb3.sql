-- Create products table for membership offerings
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  turnaround_days INTEGER DEFAULT 7,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create purchases table to track Stripe transactions
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create client_documents table for required uploads
CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_id UUID REFERENCES public.purchases(id),
  document_type TEXT NOT NULL, -- 'government_id', 'ssn', 'experian_login', 'credit_report', 'verification_code'
  file_path TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'uploaded', 'verified', 'rejected'
  notes TEXT,
  uploaded_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create client_timers table for 7-day turnaround tracking
CREATE TABLE IF NOT EXISTS public.client_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_id UUID REFERENCES public.purchases(id) UNIQUE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  current_day INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'cancelled'
  paused_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create pipeline_stages table for daily progress tracking
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_id UUID REFERENCES public.purchases(id),
  day_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  stage_description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create verification_codes table for Experian codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_id UUID REFERENCES public.purchases(id),
  code TEXT NOT NULL,
  code_type TEXT, -- 'sms', 'email'
  submitted_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'received',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create messaging_log table for automated communications
CREATE TABLE IF NOT EXISTS public.messaging_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_id UUID REFERENCES public.purchases(id),
  message_type TEXT NOT NULL, -- 'welcome', 'reminder', 'daily_update', 'verification_request', 'completion'
  channel TEXT NOT NULL, -- 'email', 'sms', 'portal'
  message_content TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create experian_credentials table (encrypted storage)
CREATE TABLE IF NOT EXISTS public.experian_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  purchase_id UUID REFERENCES public.purchases(id),
  username_encrypted TEXT,
  password_encrypted TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  last_verified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experian_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (public read)
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for purchases
CREATE POLICY "Users can view their own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchases"
  ON public.purchases FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can view all purchases"
  ON public.purchases FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for client_documents
CREATE POLICY "Users can manage their own documents"
  ON public.client_documents FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
  ON public.client_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for client_timers
CREATE POLICY "Users can view their own timer"
  ON public.client_timers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage timers"
  ON public.client_timers FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can manage all timers"
  ON public.client_timers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for pipeline_stages
CREATE POLICY "Users can view their own pipeline"
  ON public.pipeline_stages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage pipeline"
  ON public.pipeline_stages FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can manage all pipelines"
  ON public.pipeline_stages FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for verification_codes
CREATE POLICY "Users can manage their own codes"
  ON public.verification_codes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all codes"
  ON public.verification_codes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for messaging_log
CREATE POLICY "Users can view their own messages"
  ON public.messaging_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage messaging"
  ON public.messaging_log FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for experian_credentials
CREATE POLICY "Users can manage their own credentials"
  ON public.experian_credentials FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view credentials"
  ON public.experian_credentials FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Insert the two products
INSERT INTO public.products (stripe_product_id, name, description, price, turnaround_days, features) VALUES
(
  'prod_TTIxsMKwfsi1gH',
  'Fast-5 Deletion',
  '7-Day Credit Turnaround - Remove up to 5 negative items from your credit report',
  350.00,
  7,
  '["Remove up to 5 negative items", "7-day turnaround guarantee", "FCRA & Metro 2 compliance", "Experian audit included", "ChexSystems investigation", "Daily progress updates", "Dedicated support"]'::jsonb
),
(
  'prod_TTIz96EHwxsiJQ',
  'Unlimited Clean-Slate',
  '7-Day Credit Turnaround - Remove unlimited negative items for a complete credit overhaul',
  550.00,
  7,
  '["Remove UNLIMITED negative items", "7-day turnaround guarantee", "Full credit profile overhaul", "FCRA & Metro 2 compliance", "Experian audit included", "ChexSystems investigation", "Priority processing", "Daily progress updates", "VIP support"]'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_stripe_session ON public.purchases(stripe_session_id);
CREATE INDEX idx_client_documents_user_id ON public.client_documents(user_id);
CREATE INDEX idx_client_timers_user_id ON public.client_timers(user_id);
CREATE INDEX idx_pipeline_stages_user_id ON public.pipeline_stages(user_id);
CREATE INDEX idx_pipeline_stages_purchase ON public.pipeline_stages(purchase_id);

-- Create function to automatically create pipeline stages when purchase is made
CREATE OR REPLACE FUNCTION create_pipeline_stages()
RETURNS TRIGGER AS $$
DECLARE
  stage_names TEXT[] := ARRAY[
    'Day 1 – Review & Intake',
    'Day 2 – Identity Audit (FCRA + Metro 2)',
    'Day 3 – Bureau Package Creation',
    'Day 4 – Upload to Experian/TransUnion/Equifax',
    'Day 5 – ChexSystems Investigation',
    'Day 6 – Supervisor Review',
    'Day 7 – Finalization / Results Update'
  ];
  i INTEGER;
BEGIN
  -- Create 7 pipeline stages
  FOR i IN 1..7 LOOP
    INSERT INTO public.pipeline_stages (user_id, purchase_id, day_number, stage_name, status)
    VALUES (NEW.user_id, NEW.id, i, stage_names[i], 
      CASE WHEN i = 1 THEN 'in_progress' ELSE 'pending' END
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create pipeline stages
CREATE TRIGGER create_pipeline_on_purchase
  AFTER INSERT ON public.purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_pipeline_stages();

-- Create function to initialize timer
CREATE OR REPLACE FUNCTION create_client_timer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.client_timers (user_id, purchase_id, start_date, end_date, current_day, status)
  VALUES (
    NEW.user_id,
    NEW.id,
    now(),
    now() + INTERVAL '7 days',
    1,
    'active'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create timer
CREATE TRIGGER create_timer_on_purchase
  AFTER INSERT ON public.purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_client_timer();

-- Create function to create required document entries
CREATE OR REPLACE FUNCTION create_required_documents()
RETURNS TRIGGER AS $$
DECLARE
  doc_types TEXT[] := ARRAY[
    'government_id',
    'ssn',
    'experian_login',
    'credit_report',
    'verification_code'
  ];
  doc_type TEXT;
BEGIN
  FOREACH doc_type IN ARRAY doc_types LOOP
    INSERT INTO public.client_documents (user_id, purchase_id, document_type, status)
    VALUES (NEW.user_id, NEW.id, doc_type, 'pending');
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create required documents
CREATE TRIGGER create_documents_on_purchase
  AFTER INSERT ON public.purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_required_documents();