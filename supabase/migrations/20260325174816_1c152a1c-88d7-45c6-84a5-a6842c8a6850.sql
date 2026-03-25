
-- ============================================
-- CIP + AI Workflow Tables
-- ============================================

-- Client Processing Cycles
CREATE TABLE public.client_processing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  cycle_type TEXT NOT NULL DEFAULT 'standard',
  source_document_batch_id UUID,
  source_credit_report_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_processing_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on client_processing_cycles"
  ON public.client_processing_cycles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Client Intelligence Packets
CREATE TABLE public.client_intelligence_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  cycle_id UUID REFERENCES public.client_processing_cycles(id) ON DELETE SET NULL,
  source_report_id UUID,
  full_name TEXT,
  dob TEXT,
  ssn_last4 TEXT,
  full_address TEXT,
  identity_summary JSONB DEFAULT '{}'::jsonb,
  bureau_summary JSONB DEFAULT '{}'::jsonb,
  negative_accounts JSONB DEFAULT '[]'::jsonb,
  inquiries JSONB DEFAULT '[]'::jsonb,
  outdated_personal_info JSONB DEFAULT '[]'::jsonb,
  violations_identified JSONB DEFAULT '[]'::jsonb,
  strategy_type TEXT DEFAULT 'pending',
  strategy_confidence NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_intelligence_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on client_intelligence_packets"
  ON public.client_intelligence_packets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own CIPs"
  ON public.client_intelligence_packets FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

-- AI Workflows
CREATE TABLE public.ai_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  cycle_id UUID REFERENCES public.client_processing_cycles(id) ON DELETE SET NULL,
  workflow_type TEXT NOT NULL DEFAULT 'full_analysis',
  current_step TEXT DEFAULT 'queued',
  status TEXT NOT NULL DEFAULT 'pending',
  confidence_score NUMERIC DEFAULT 0,
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on ai_workflows"
  ON public.ai_workflows FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- AI Agent Runs
CREATE TABLE public.ai_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.ai_workflows(id) ON DELETE CASCADE NOT NULL,
  agent_name TEXT NOT NULL,
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on ai_agent_runs"
  ON public.ai_agent_runs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Execution Queue
CREATE TABLE public.execution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  cycle_id UUID REFERENCES public.client_processing_cycles(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  queue_status TEXT NOT NULL DEFAULT 'queued',
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.execution_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on execution_queue"
  ON public.execution_queue FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add cycle_id to dispute_cases if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dispute_cases' AND column_name='cycle_id') THEN
    ALTER TABLE public.dispute_cases ADD COLUMN cycle_id UUID REFERENCES public.client_processing_cycles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add generated_from_cip_id to ai_dispute_letters if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_dispute_letters' AND column_name='generated_from_cip_id') THEN
    ALTER TABLE public.ai_dispute_letters ADD COLUMN generated_from_cip_id UUID REFERENCES public.client_intelligence_packets(id) ON DELETE SET NULL;
  END IF;
END $$;
