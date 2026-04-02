-- Add operational columns to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS workflow_status text DEFAULT 'monitor';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS round_number integer DEFAULT 1;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS priority_level text DEFAULT 'normal';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS next_action text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes_summary text;

-- Create client_action_tracker table
CREATE TABLE IF NOT EXISTS public.client_action_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  identity_docs_received boolean DEFAULT false,
  credit_report_uploaded boolean DEFAULT false,
  lexisnexis_frozen boolean DEFAULT false,
  innovis_frozen boolean DEFAULT false,
  work_number_frozen boolean DEFAULT false,
  report_parsed boolean DEFAULT false,
  scores_updated boolean DEFAULT false,
  has_605b boolean DEFAULT false,
  has_ftc boolean DEFAULT false,
  pushed_to_experian boolean DEFAULT false,
  completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_action_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on client_action_tracker"
  ON public.client_action_tracker FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own action tracker"
  ON public.client_action_tracker FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

-- Create client_notes table
CREATE TABLE IF NOT EXISTS public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  note_body text NOT NULL,
  note_type text DEFAULT 'general',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on client_notes"
  ON public.client_notes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create client_timeline table
CREATE TABLE IF NOT EXISTS public.client_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_label text NOT NULL,
  event_meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on client_timeline"
  ON public.client_timeline FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own timeline"
  ON public.client_timeline FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );