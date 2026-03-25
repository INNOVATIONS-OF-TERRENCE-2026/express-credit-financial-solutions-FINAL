
-- Migration 1: Fix critical RLS policies + Case workflow system + AI columns + AI analysis results
-- Combined into one migration for efficiency

-- =============================================
-- PART 1: Fix RLS on dispute_letters (add admin access)
-- =============================================
CREATE POLICY "Admins can view all dispute letters"
ON public.dispute_letters FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all dispute letters"
ON public.dispute_letters FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages dispute letters"
ON public.dispute_letters FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role') = 'service_role');

-- =============================================
-- PART 2: Case workflow system
-- =============================================
CREATE TYPE public.case_status AS ENUM (
  'intake_received',
  'documents_missing',
  'extracted',
  'validation_failed',
  'validation_passed',
  'draft_generated',
  'needs_admin_review',
  'approved',
  'exported',
  'followup_due'
);

ALTER TABLE public.dispute_letters
  ADD COLUMN IF NOT EXISTS case_status text DEFAULT 'intake_received',
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS assigned_admin uuid,
  ADD COLUMN IF NOT EXISTS admin_review_notes text,
  ADD COLUMN IF NOT EXISTS auto_send boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.case_workflow_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_letter_id uuid REFERENCES public.dispute_letters(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_workflow_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own workflow logs"
ON public.case_workflow_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.dispute_letters dl
    WHERE dl.id = case_workflow_log.dispute_letter_id
    AND dl.user_id = auth.uid()::text
  )
);

CREATE POLICY "Admins see all workflow logs"
ON public.case_workflow_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages workflow logs"
ON public.case_workflow_log FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Admins can insert workflow logs"
ON public.case_workflow_log FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert workflow logs"
ON public.case_workflow_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Validate case transitions function
CREATE OR REPLACE FUNCTION public.validate_case_transition(from_status text, to_status text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (from_status, to_status) IN (
    ('intake_received', 'documents_missing'),
    ('intake_received', 'extracted'),
    ('documents_missing', 'extracted'),
    ('extracted', 'validation_failed'),
    ('extracted', 'validation_passed'),
    ('validation_failed', 'extracted'),
    ('validation_passed', 'draft_generated'),
    ('draft_generated', 'needs_admin_review'),
    ('needs_admin_review', 'approved'),
    ('needs_admin_review', 'draft_generated'),
    ('approved', 'exported'),
    ('exported', 'followup_due'),
    ('followup_due', 'intake_received')
  );
END;
$$;

-- =============================================
-- PART 3: AI workflow columns
-- =============================================
ALTER TABLE public.flagged_disputes
  ADD COLUMN IF NOT EXISTS extraction_version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS validated_data jsonb,
  ADD COLUMN IF NOT EXISTS violation_type text,
  ADD COLUMN IF NOT EXISTS recommended_dispute_type text;

ALTER TABLE public.dispute_letters
  ADD COLUMN IF NOT EXISTS draft_version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS previous_drafts jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS letter_type text;

CREATE INDEX IF NOT EXISTS idx_flagged_disputes_admin_review
ON public.flagged_disputes (admin_reviewed, admin_approved);

CREATE INDEX IF NOT EXISTS idx_flagged_disputes_user_status
ON public.flagged_disputes (user_id, status);

CREATE INDEX IF NOT EXISTS idx_dispute_letters_case_status
ON public.dispute_letters (case_status);

-- =============================================
-- PART 4: AI analysis results table
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credit_report_id uuid REFERENCES public.credit_report_uploads(id) ON DELETE CASCADE,
  analysis_type text NOT NULL DEFAULT 'full',
  flagged_count integer DEFAULT 0,
  fcra_violation_count integer DEFAULT 0,
  overall_utilization numeric,
  summary jsonb DEFAULT '{}'::jsonb,
  raw_result jsonb DEFAULT '{}'::jsonb,
  model_used text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own analysis results"
ON public.ai_analysis_results FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all analysis results"
ON public.ai_analysis_results FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages analysis results"
ON public.ai_analysis_results FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role') = 'service_role');
