
-- Additive override columns on clients for portal results + readiness flags
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT,
  ADD COLUMN IF NOT EXISTS starting_score_eq INTEGER,
  ADD COLUMN IF NOT EXISTS starting_score_tu INTEGER,
  ADD COLUMN IF NOT EXISTS starting_score_ex INTEGER,
  ADD COLUMN IF NOT EXISTS current_score_eq INTEGER,
  ADD COLUMN IF NOT EXISTS current_score_tu INTEGER,
  ADD COLUMN IF NOT EXISTS current_score_ex INTEGER,
  ADD COLUMN IF NOT EXISTS accounts_deleted_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS debt_removed_total NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hard_inquiries_removed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS personal_info_items_removed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_negatives INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_dispute_round INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_step_note TEXT,
  ADD COLUMN IF NOT EXISTS mortgage_readiness_status TEXT,
  ADD COLUMN IF NOT EXISTS ftc_605b_readiness_status TEXT;
