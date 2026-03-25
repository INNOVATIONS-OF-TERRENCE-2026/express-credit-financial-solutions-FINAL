
-- 1. Recreate bank_links_safe view with security_invoker=on
CREATE OR REPLACE VIEW public.bank_links_safe
WITH (security_invoker=on) AS
SELECT id, created_at, user_id, account_id
FROM bank_links bl
WHERE (user_id = auth.uid()) 
   OR has_role(auth.uid(), 'admin'::app_role) 
   OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- 2. Fix overly permissive RLS policy on case_workflow_log
DROP POLICY IF EXISTS "Authenticated users can insert workflow logs" ON public.case_workflow_log;
CREATE POLICY "Authenticated users can insert own workflow logs"
  ON public.case_workflow_log FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM dispute_letters dl
      WHERE dl.id = case_workflow_log.dispute_letter_id
        AND dl.user_id = (auth.uid())::text
    )
  );

-- 3. Fix validate_case_transition search_path
CREATE OR REPLACE FUNCTION public.validate_case_transition(from_status text, to_status text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
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
$function$;
