ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS portal_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS client_visible_update text;