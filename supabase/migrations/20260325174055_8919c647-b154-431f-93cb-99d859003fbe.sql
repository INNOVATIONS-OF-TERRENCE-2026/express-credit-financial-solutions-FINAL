
-- ================================================
-- AUTOMATION LAYER: 7 new tables
-- ================================================

-- 1. automation_events — Central event queue
CREATE TABLE public.automation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id uuid,
  event_type text NOT NULL,
  event_source text DEFAULT 'system',
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error_message text
);

ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all automation events" ON public.automation_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages automation events" ON public.automation_events FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');

CREATE INDEX idx_automation_events_status ON public.automation_events(status);
CREATE INDEX idx_automation_events_type ON public.automation_events(event_type);
CREATE INDEX idx_automation_events_created ON public.automation_events(created_at DESC);

-- 2. client_activity_timeline — Operational history feed
CREATE TABLE public.client_activity_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id uuid,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  visible_to_client boolean DEFAULT true,
  visible_to_admin boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_source text DEFAULT 'system'
);

ALTER TABLE public.client_activity_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all timeline" ON public.client_activity_timeline FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages timeline" ON public.client_activity_timeline FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Users read own visible timeline" ON public.client_activity_timeline FOR SELECT TO authenticated USING (visible_to_client = true AND user_id = auth.uid());

CREATE INDEX idx_timeline_user ON public.client_activity_timeline(user_id, created_at DESC);
CREATE INDEX idx_timeline_client ON public.client_activity_timeline(client_id, created_at DESC);

-- 3. client_notifications — Multi-channel notification queue
CREATE TABLE public.client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id uuid,
  channel text NOT NULL DEFAULT 'in_app',
  notification_type text NOT NULL,
  subject text,
  message text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  provider text DEFAULT 'internal',
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  error_message text
);

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all notifications" ON public.client_notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages notifications" ON public.client_notifications FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Users read own in_app notifications" ON public.client_notifications FOR SELECT TO authenticated USING (user_id = auth.uid() AND channel = 'in_app');
CREATE POLICY "Users update own notifications" ON public.client_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid() AND channel = 'in_app');

CREATE INDEX idx_notifications_user ON public.client_notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_status ON public.client_notifications(status);

-- 4. notification_preferences — Per-client opt-in/out
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id uuid UNIQUE,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT true,
  in_app_enabled boolean DEFAULT true,
  marketing_enabled boolean DEFAULT false,
  transactional_enabled boolean DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all preferences" ON public.notification_preferences FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages preferences" ON public.notification_preferences FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Users manage own preferences" ON public.notification_preferences FOR ALL TO authenticated USING (user_id = auth.uid());

-- 5. score_history — Bureau score over time
CREATE TABLE public.score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id uuid,
  bureau text NOT NULL,
  score_value integer NOT NULL,
  source text DEFAULT 'manual',
  report_id uuid,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all score history" ON public.score_history FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages score history" ON public.score_history FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Users read own score history" ON public.score_history FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_score_history_client ON public.score_history(client_id, recorded_at DESC);

-- 6. score_predictions — AI-estimated score ranges
CREATE TABLE public.score_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id uuid,
  current_experian integer,
  current_equifax integer,
  current_transunion integer,
  predicted_experian_min integer,
  predicted_experian_max integer,
  predicted_equifax_min integer,
  predicted_equifax_max integer,
  predicted_transunion_min integer,
  predicted_transunion_max integer,
  factors jsonb DEFAULT '{}'::jsonb,
  confidence_level numeric DEFAULT 0,
  based_on_report_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.score_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all predictions" ON public.score_predictions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages predictions" ON public.score_predictions FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Users read own predictions" ON public.score_predictions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_predictions_client ON public.score_predictions(client_id, created_at DESC);

-- 7. notification_templates — Admin-editable message templates
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text UNIQUE NOT NULL,
  channel text DEFAULT 'in_app',
  subject_template text,
  message_template text NOT NULL,
  is_active boolean DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all templates" ON public.notification_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages templates" ON public.notification_templates FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'service_role');

-- Seed default notification templates
INSERT INTO public.notification_templates (event_type, subject_template, message_template) VALUES
  ('document_uploaded', 'Document Received', 'We received your documents and they are being processed.'),
  ('document_classified', 'Document Processed', 'Your document has been classified and filed to your account.'),
  ('document_matched', 'Document Matched', 'Your uploaded document has been matched to your profile.'),
  ('credit_report_uploaded', 'Credit Report Uploaded', 'Your credit report has been uploaded successfully.'),
  ('credit_report_analyzed', 'Analysis Complete', 'Your credit report has been analyzed. Check your portal for results.'),
  ('violations_detected', 'Violations Found', 'Potential violations were detected in your credit report.'),
  ('dispute_case_created', 'Dispute Case Created', 'A new dispute case has been created for your account.'),
  ('dispute_letter_generated', 'Dispute Letter Ready', 'Your dispute letter has been generated and is under review.'),
  ('dispute_sent_to_review', 'Dispute Under Review', 'Your dispute package is now under review.'),
  ('dispute_approved', 'Dispute Approved', 'Your dispute has been approved and is being prepared for submission.'),
  ('dispute_rejected', 'Dispute Needs Attention', 'Your dispute requires additional attention. We will follow up.'),
  ('dispute_marked_sent', 'Dispute Submitted', 'Your dispute has been submitted to the credit bureau.'),
  ('score_updated', 'Score Updated', 'Your portal has been updated with new score information.'),
  ('score_predicted', 'Score Projection Ready', 'Your projected score range is now available in your portal.'),
  ('admin_note_added', 'Update from Your Team', 'Your credit repair team has posted a new update on your file.'),
  ('followup_due', 'Follow-Up Needed', 'A follow-up action is needed on your file. Please check your portal.'),
  ('client_profile_updated', 'Profile Updated', 'Your profile information has been updated.');
