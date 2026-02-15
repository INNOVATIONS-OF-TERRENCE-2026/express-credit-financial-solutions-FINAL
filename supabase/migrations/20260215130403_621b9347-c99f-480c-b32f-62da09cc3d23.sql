
-- Create cashapp_orders table
CREATE TABLE public.cashapp_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  plan text NOT NULL,
  amount numeric NOT NULL,
  screenshot_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cashapp_orders ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own orders
CREATE POLICY "Users can insert their own cashapp orders"
ON public.cashapp_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Anon users can also insert (for non-logged-in checkout)
CREATE POLICY "Anon users can insert cashapp orders"
ON public.cashapp_orders
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Users can view their own orders
CREATE POLICY "Users can view their own cashapp orders"
ON public.cashapp_orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all cashapp orders"
ON public.cashapp_orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all orders
CREATE POLICY "Admins can update all cashapp orders"
ON public.cashapp_orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_cashapp_orders_updated_at
BEFORE UPDATE ON public.cashapp_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create cashapp-proofs storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cashapp-proofs', 'cashapp-proofs', false);

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload cashapp proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cashapp-proofs');

-- Anon users can upload cashapp proofs
CREATE POLICY "Anon users can upload cashapp proofs"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'cashapp-proofs');

-- Admins can view cashapp proofs
CREATE POLICY "Admins can view cashapp proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'cashapp-proofs' AND public.has_role(auth.uid(), 'admin'));
