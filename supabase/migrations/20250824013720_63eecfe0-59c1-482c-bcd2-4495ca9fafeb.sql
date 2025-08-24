-- Add deadline_date to dispute_timeline for tracking 30-day deadlines
ALTER TABLE public.dispute_timeline 
ADD COLUMN deadline_date TIMESTAMP WITH TIME ZONE;

-- Update existing records to set deadline_date based on date_mailed (if exists) or estimated_response_date
UPDATE public.dispute_timeline 
SET deadline_date = CASE 
  WHEN estimated_response_date IS NOT NULL THEN estimated_response_date::timestamp with time zone
  WHEN date_mailed IS NOT NULL THEN date_mailed::timestamp with time zone + INTERVAL '30 days'
  ELSE date_generated::timestamp with time zone + INTERVAL '30 days'
END
WHERE deadline_date IS NULL;