-- Add membership_type column to profiles for VIP trial tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'none';

-- Add expires_at column to track trial expiration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create index for efficient querying of expired trials
CREATE INDEX IF NOT EXISTS idx_profiles_membership_expires ON public.profiles(membership_type, expires_at);

-- Create function to automatically expire VIP trials
CREATE OR REPLACE FUNCTION public.expire_vip_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update expired VIP trials to expired_trial
  UPDATE public.profiles 
  SET membership_type = 'expired_trial'
  WHERE membership_type = 'vip_trial' 
    AND expires_at IS NOT NULL 
    AND expires_at <= now();
    
  -- Log the expiration action
  PERFORM public.log_security_event(
    'VIP_TRIAL_EXPIRED',
    'profiles',
    null,
    jsonb_build_object('expired_count', (
      SELECT COUNT(*) FROM public.profiles 
      WHERE membership_type = 'expired_trial'
    )),
    'info',
    0
  );
END;
$$;