
-- Task Templates (reusable checklist templates)
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on task_templates"
  ON public.task_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin Tasks (per-client tasks with checklist functionality)
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on admin_tasks"
  ON public.admin_tasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view own tasks"
  ON public.admin_tasks FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Admin Reminders
CREATE TABLE IF NOT EXISTS public.admin_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  reminder_type text NOT NULL DEFAULT 'general',
  due_at timestamptz NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on admin_reminders"
  ON public.admin_reminders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_tasks_client ON public.admin_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON public.admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_due_date ON public.admin_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_category ON public.admin_tasks(category);
CREATE INDEX IF NOT EXISTS idx_admin_reminders_due ON public.admin_reminders(due_at);
CREATE INDEX IF NOT EXISTS idx_admin_reminders_client ON public.admin_reminders(client_id);

-- Seed default task templates
INSERT INTO public.task_templates (name, category, items) VALUES
  ('Client Onboarding', 'onboarding', '["Collect government ID","Collect SSN card/document","Collect proof of address","Verify client identity","Create client profile","Send welcome email","Schedule initial consultation"]'::jsonb),
  ('FTC Preparation', 'ftc_prep', '["Pull credit reports (all 3 bureaus)","Identify negative items","Flag FCRA violations","Prepare identity theft affidavit","Draft 605B letter","Collect supporting documentation","Review with client"]'::jsonb),
  ('Bureau Follow-Up', 'bureau_followup', '["Check Experian response status","Check Equifax response status","Check TransUnion response status","Document results","Update client scores","Notify client of changes","Schedule next round if needed"]'::jsonb),
  ('Push Through Ready', 'push_through', '["Verify all disputes responded","Confirm score improvements","Update credit report on file","Generate final summary","Notify client of completion","Archive case documents","Schedule follow-up check"]'::jsonb),
  ('Document Collection', 'identity_docs', '["Government-issued photo ID","Social Security card","Proof of address (utility bill)","Credit monitoring login","Experian credentials","Bank statement (optional)"]'::jsonb)
ON CONFLICT DO NOTHING;
