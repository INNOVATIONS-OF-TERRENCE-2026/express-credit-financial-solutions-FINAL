-- Add membership fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_plan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update profiles table to ensure all required fields exist
UPDATE public.profiles SET 
  subscription_status = COALESCE(subscription_status, 'inactive'),
  membership_plan = CASE 
    WHEN plan_type IS NOT NULL THEN plan_type 
    ELSE NULL 
  END
WHERE subscription_status IS NULL OR membership_plan IS NULL;