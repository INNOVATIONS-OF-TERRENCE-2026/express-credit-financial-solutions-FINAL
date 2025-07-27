-- Create demo user entry in demo_users table first
INSERT INTO public.demo_users (
  user_id,
  is_demo,
  demo_data,
  last_reset
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'demo@expresscredit.ai' LIMIT 1),
  true,
  '{"test_mode": true, "created_by": "system"}'::jsonb,
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  last_reset = now();

-- Sample receipt for demo user
INSERT INTO public.payment_receipts (
  user_id,
  receipt_id,
  client_name,
  membership_level,
  amount_paid,
  payment_date,
  card_last_four
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'demo@expresscredit.ai' LIMIT 1),
  'DEMO_' || substr(gen_random_uuid()::text, 1, 8),
  'Demo User',
  'Pro',
  179.99,
  now() - interval '1 day',
  '4242'
);