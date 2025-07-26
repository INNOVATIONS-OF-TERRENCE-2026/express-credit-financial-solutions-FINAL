-- Add membership and access_expires_at columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership TEXT,
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have membership based on plan_type
UPDATE public.profiles 
SET membership = CASE 
  WHEN plan_type = 'Basic Package' THEN 'basic'
  WHEN plan_type = 'Pro Package' THEN 'pro'
  WHEN plan_type = 'Elite Package' THEN 'elite'
  WHEN plan_type = 'All Exclusive Package' THEN 'exclusive'
  ELSE NULL
END
WHERE membership IS NULL;