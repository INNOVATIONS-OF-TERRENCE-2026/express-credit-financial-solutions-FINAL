-- Update credit_reports schema to support new upload flow
-- 1) Make fico_score optional to allow uploads without score
ALTER TABLE public.credit_reports
  ALTER COLUMN fico_score DROP NOT NULL;

-- 2) Add new metadata columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_reports' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE public.credit_reports ADD COLUMN file_name TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_reports' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE public.credit_reports ADD COLUMN storage_path TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_reports' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE public.credit_reports ADD COLUMN uploaded_by UUID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_reports' AND column_name = 'uploaded_at'
  ) THEN
    ALTER TABLE public.credit_reports ADD COLUMN uploaded_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Keep existing RLS; no changes needed