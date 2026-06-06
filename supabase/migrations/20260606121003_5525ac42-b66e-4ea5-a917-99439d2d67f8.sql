
-- Drop all policies depending on the text user_id columns
DROP POLICY IF EXISTS "Users can manage their own reports" ON public.credit_reports;
DROP POLICY IF EXISTS "Users can manage their own letters" ON public.dispute_letters;
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users see own workflow logs" ON public.case_workflow_log;
DROP POLICY IF EXISTS "Authenticated users can insert own workflow logs" ON public.case_workflow_log;

-- Convert user_id to uuid
ALTER TABLE public.credit_reports ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE public.dispute_letters ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE public.documents ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Recreate user-scoped policies with native uuid comparison
CREATE POLICY "Users can manage their own reports" ON public.credit_reports
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own letters" ON public.dispute_letters
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own documents" ON public.documents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recreate workflow log policies (no more text cast on user_id)
CREATE POLICY "Users see own workflow logs" ON public.case_workflow_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dispute_letters dl WHERE dl.id = case_workflow_log.dispute_letter_id AND dl.user_id = auth.uid()));

CREATE POLICY "Authenticated users can insert own workflow logs" ON public.case_workflow_log
  FOR INSERT TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.dispute_letters dl WHERE dl.id = case_workflow_log.dispute_letter_id AND dl.user_id = auth.uid())
  );

-- Tighten admin "manage all" policies to authenticated role
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
CREATE POLICY "Admins can manage all documents" ON public.documents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage all agreements" ON public.agreements;
CREATE POLICY "Admins can manage all agreements" ON public.agreements
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage all violation flags" ON public.violation_flags;
CREATE POLICY "Admins can manage all violation flags" ON public.violation_flags
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage all credit analysis" ON public.credit_analysis;
CREATE POLICY "Admins can manage all credit analysis" ON public.credit_analysis
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin SELECT on au_requests
CREATE POLICY "Admins can view all AU requests" ON public.au_requests
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Client-scoped SELECT policies
CREATE POLICY "Clients can view their own violation flags" ON public.violation_flags
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can view their own credit analysis" ON public.credit_analysis
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can view their own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can view their own agreements" ON public.agreements
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- Explicit service role INSERT policy on payment_activity_events
CREATE POLICY "Service role can insert payment activity events" ON public.payment_activity_events
  FOR INSERT TO service_role
  WITH CHECK (true);
