-- Create demo user for testing
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'demo@expresscredit.ai',
  now(),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create demo client record
WITH demo_user AS (
  SELECT id FROM auth.users WHERE email = 'demo@expresscredit.ai'
)
INSERT INTO public.clients (
  user_id,
  full_name,
  email_address,
  phone_number,
  date_of_birth,
  ssn,
  membership_plan,
  progress_status,
  documents_uploaded,
  agreement_signed
)
SELECT 
  demo_user.id,
  'Demo User',
  'demo@expresscredit.ai',
  '555-TEST-DEMO',
  '1990-01-01',
  'demo_encrypted_ssn',
  'Pro',
  25,
  1,
  false
FROM demo_user
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  membership_plan = EXCLUDED.membership_plan,
  progress_status = EXCLUDED.progress_status;

-- Create demo user entry
WITH demo_user AS (
  SELECT id FROM auth.users WHERE email = 'demo@expresscredit.ai'
)
INSERT INTO public.demo_users (
  user_id,
  is_demo,
  demo_data,
  last_reset
)
SELECT 
  demo_user.id,
  true,
  '{"test_mode": true, "created_by": "system"}'::jsonb,
  now()
FROM demo_user
ON CONFLICT (user_id) DO UPDATE SET
  last_reset = now();

-- Sample receipt for demo user
WITH demo_user AS (
  SELECT id FROM auth.users WHERE email = 'demo@expresscredit.ai'
)
INSERT INTO public.payment_receipts (
  user_id,
  receipt_id,
  client_name,
  membership_level,
  amount_paid,
  payment_date,
  card_last_four
)
SELECT 
  demo_user.id,
  'DEMO_' || substr(gen_random_uuid()::text, 1, 8),
  'Demo User',
  'Pro',
  179.99,
  now() - interval '1 day',
  '4242'
FROM demo_user
ON CONFLICT DO NOTHING;