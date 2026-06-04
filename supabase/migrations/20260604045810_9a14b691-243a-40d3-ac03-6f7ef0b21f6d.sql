INSERT INTO public.payment_records (
  user_id, client_id, payment_method, payment_amount,
  payment_status, payment_note, submitted_at, reviewed_at, reviewed_by, admin_notes
)
SELECT
  c.user_id,
  c.id,
  'cash_app',
  600,
  'approved',
  'Paid in full ($600) — bulk reconciliation',
  now(),
  now(),
  c.user_id,
  'Bulk reconciliation: all clients marked paid in full.'
FROM public.clients c
WHERE c.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.payment_records pr
    WHERE pr.client_id = c.id AND pr.payment_status = 'approved'
  );

UPDATE public.profiles p
SET payment_status = 'paid'
WHERE p.user_id IN (SELECT user_id FROM public.clients WHERE user_id IS NOT NULL);