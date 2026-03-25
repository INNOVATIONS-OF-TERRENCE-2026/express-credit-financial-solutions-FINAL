
-- Table: dispute_cases
CREATE TABLE public.dispute_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id text,
  bureau text,
  account_name text,
  account_number_last4 text,
  violation_type text,
  dispute_reason text,
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'manual',
  flagged_dispute_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dispute_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all dispute cases" ON public.dispute_cases FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages dispute cases" ON public.dispute_cases FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Users read own dispute cases" ON public.dispute_cases FOR SELECT TO authenticated USING ((auth.uid())::text = user_id);

-- Table: ai_dispute_letters
CREATE TABLE public.ai_dispute_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id text,
  dispute_case_id uuid REFERENCES public.dispute_cases(id) ON DELETE CASCADE,
  letter_content text NOT NULL,
  letter_type text,
  bureau text,
  confidence_score numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_dispute_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all ai dispute letters" ON public.ai_dispute_letters FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages ai dispute letters" ON public.ai_dispute_letters FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Users read own ai dispute letters" ON public.ai_dispute_letters FOR SELECT TO authenticated USING ((auth.uid())::text = user_id);

-- Table: client_credit_scores
CREATE TABLE public.client_credit_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id uuid,
  experian_score integer,
  equifax_score integer,
  transunion_score integer,
  source text NOT NULL DEFAULT 'manual',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.client_credit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all client credit scores" ON public.client_credit_scores FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages client credit scores" ON public.client_credit_scores FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Users read own client credit scores" ON public.client_credit_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own client credit scores" ON public.client_credit_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add auto_generate_disputes to autonomous_settings
ALTER TABLE public.autonomous_settings ADD COLUMN IF NOT EXISTS auto_generate_disputes boolean DEFAULT false;
