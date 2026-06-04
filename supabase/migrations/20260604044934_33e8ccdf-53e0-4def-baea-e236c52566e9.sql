ALTER TABLE public.credit_report_uploads
  ADD COLUMN IF NOT EXISTS match_status text,
  ADD COLUMN IF NOT EXISTS match_score numeric,
  ADD COLUMN IF NOT EXISTS match_reasons jsonb,
  ADD COLUMN IF NOT EXISTS match_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS match_error text;