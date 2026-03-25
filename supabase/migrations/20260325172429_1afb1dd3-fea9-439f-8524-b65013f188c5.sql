
-- Autonomous Jobs table
CREATE TABLE public.autonomous_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  document_upload_id uuid,
  status text NOT NULL DEFAULT 'pending',
  job_type text NOT NULL DEFAULT 'document_parse',
  confidence_score numeric DEFAULT 0,
  result_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.autonomous_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage autonomous jobs" ON public.autonomous_jobs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages autonomous jobs" ON public.autonomous_jobs
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'service_role');

-- Document AI Results table
CREATE TABLE public.document_ai_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid,
  extracted_name text,
  extracted_address text,
  extracted_ssn_last4 text,
  extracted_dob text,
  detected_doc_type text,
  confidence_score numeric DEFAULT 0,
  matched_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  match_reason text,
  is_verified boolean DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_ai_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage document ai results" ON public.document_ai_results
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages document ai results" ON public.document_ai_results
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'service_role');

-- Autonomous Settings table (single-row config)
CREATE TABLE public.autonomous_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autonomous_enabled boolean DEFAULT false,
  auto_attach_threshold integer DEFAULT 85,
  review_threshold integer DEFAULT 60,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.autonomous_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage autonomous settings" ON public.autonomous_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read autonomous settings" ON public.autonomous_settings
  FOR SELECT TO authenticated
  USING (true);

-- Seed default settings row
INSERT INTO public.autonomous_settings (autonomous_enabled, auto_attach_threshold, review_threshold)
VALUES (false, 85, 60);
