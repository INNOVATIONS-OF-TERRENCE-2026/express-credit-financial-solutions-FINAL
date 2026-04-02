-- Ensure unique constraint exists on full_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'clients' AND indexname = 'idx_clients_full_name_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_clients_full_name_unique ON public.clients(full_name);
  END IF;
END $$;

-- Update existing clients first
UPDATE public.clients SET workflow_status = 'completed', membership_plan = 'active' WHERE full_name IN ('Jadlyn Starkey', 'Jonetta Renfroe', 'Phoebe Thomas', 'Melvin Milliner', 'Tiara Smith');
UPDATE public.clients SET email = 'contact@tiarahasthekey.com' WHERE full_name = 'Tiara Smith';

-- Remove Terrence Milliner if not in master list (keep existing data safe)

-- Insert new clients
INSERT INTO public.clients (full_name, email, membership_plan, workflow_status, round_number, priority_level, phone, address, dob, ssn_last4)
VALUES
  ('Brodrick Colbert', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Davon Jones', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Jonathan Bookman', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Lea Rosborough', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Mason Hayes', 'masonhayes22@gmail.com', 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Michael Campos', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Shalyn Colbert', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Titus Williams Jr', 'tmanw2000@gmail.com', 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Jaszmine Adams', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Curtis Watkins', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Jessica Salazar', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Feleasha Nelson', NULL, 'active', 'completed', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Angela Moore', 'imangela4034@yahoo.com', 'active', 'ready_to_push', 1, 'high', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Brittany Jones', 'bgvarner42@gmail.com', 'active', 'ready_to_push', 1, 'high', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Brandon Williams', NULL, 'active', 'ready_to_push', 1, 'high', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Sharunda Dews', NULL, 'active', 'ready_to_push', 1, 'high', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Shambrisha Milliner', 'shammymilliner@gmail.com', 'active', 'ready_for_605b', 1, 'high', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Barry Townsend', NULL, 'active', 'needs_credit_report', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Melba Townsend', NULL, 'active', 'needs_credit_report', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Princess Henry', NULL, 'active', 'needs_credit_report', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('James O''Neal Ivy', 'jamesivy83@yahoo.com', 'active', 'needs_credit_report', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Charles Goosby', 'charles@goosbyconstruction.com', 'active', 'round_2', 2, 'high', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Kendra Ford', NULL, 'active', 'round_2', 2, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Gregory Jackson', NULL, 'active', 'round_2', 2, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Danein Buckley', NULL, 'active', 'cfpb_escalation', 1, 'urgent', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Cameche Anderson', 'cameche.anderson33@yahoo.com', 'active', 'monitor', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000'),
  ('Antron Robinson', 'arobin88son@yahoo.com', 'active', 'monitor', 1, 'normal', 'N/A', 'N/A', '1990-01-01', '0000')
ON CONFLICT (full_name) DO UPDATE SET
  email = CASE WHEN EXCLUDED.email IS NOT NULL THEN EXCLUDED.email ELSE clients.email END,
  membership_plan = EXCLUDED.membership_plan,
  workflow_status = EXCLUDED.workflow_status,
  round_number = EXCLUDED.round_number,
  priority_level = EXCLUDED.priority_level;

-- Create action tracker entries for all clients
INSERT INTO public.client_action_tracker (client_id)
SELECT id FROM public.clients
WHERE id NOT IN (SELECT client_id FROM public.client_action_tracker)
ON CONFLICT (client_id) DO NOTHING;

-- Set specific operational notes
UPDATE public.clients SET next_action = '605B needs updating, then push' WHERE full_name = 'Sharunda Dews';
UPDATE public.clients SET next_action = 'Ready for 605B letter generation' WHERE full_name = 'Shambrisha Milliner';
UPDATE public.clients SET next_action = 'Need full credit report' WHERE full_name IN ('Barry Townsend', 'Melba Townsend', 'Princess Henry');
UPDATE public.clients SET next_action = 'Need full credit report', email = 'jamesivy83@yahoo.com' WHERE full_name = 'James O''Neal Ivy';
UPDATE public.clients SET next_action = 'Account returned after prior block, score dropped', notes_summary = 'Round 2 - account returned' WHERE full_name = 'Charles Goosby';
UPDATE public.clients SET next_action = 'Round 2 processing' WHERE full_name IN ('Kendra Ford', 'Gregory Jackson');
UPDATE public.clients SET next_action = 'CFPB escalation needed' WHERE full_name = 'Danein Buckley';
UPDATE public.clients SET next_action = 'Status check needed' WHERE full_name IN ('Cameche Anderson', 'Antron Robinson');

-- Update Sharunda Dews action tracker
UPDATE public.client_action_tracker SET has_ftc = true, has_605b = true
WHERE client_id = (SELECT id FROM public.clients WHERE full_name = 'Sharunda Dews');