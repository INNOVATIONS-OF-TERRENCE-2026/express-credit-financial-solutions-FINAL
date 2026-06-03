
-- Default all new clients to Premium plan
ALTER TABLE public.profiles ALTER COLUMN plan_type SET DEFAULT 'premium';
ALTER TABLE public.profiles ALTER COLUMN payment_status SET DEFAULT 'active';
ALTER TABLE public.profiles ALTER COLUMN membership_plan SET DEFAULT 'Premium';
ALTER TABLE public.profiles ALTER COLUMN subscription_status SET DEFAULT 'active';
ALTER TABLE public.profiles ALTER COLUMN membership_type SET DEFAULT 'premium';
ALTER TABLE public.profiles ALTER COLUMN membership SET DEFAULT 'premium';

ALTER TABLE public.clients ALTER COLUMN membership_plan SET DEFAULT 'Premium';

-- Upgrade ALL existing clients and profiles to Premium / active
UPDATE public.profiles
SET plan_type = 'premium',
    payment_status = 'active',
    membership_plan = 'Premium',
    subscription_status = 'active',
    membership_type = 'premium',
    membership = 'premium',
    updated_at = now();

UPDATE public.clients
SET membership_plan = 'Premium',
    updated_at = now();
