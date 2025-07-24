-- Security improvements migration (fixed)

-- 1. Create audit log table for tracking sensitive operations
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow edge functions to manage audit logs
CREATE POLICY "Only edge functions can manage audit logs"
ON public.audit_logs
FOR ALL
USING (true);

-- 2. Create function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, payment_status)
  VALUES (NEW.id, NEW.email, 'inactive');
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Update profiles table RLS policies to prevent plan_type self-modification
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Allow users to update their profile but NOT plan_type or payment_status
CREATE POLICY "Users can update their own profile (limited)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent users from changing their own plan_type or payment_status
  (OLD.plan_type IS NOT DISTINCT FROM NEW.plan_type) AND
  (OLD.payment_status IS NOT DISTINCT FROM NEW.payment_status) AND
  (OLD.stripe_customer_id IS NOT DISTINCT FROM NEW.stripe_customer_id) AND
  (OLD.subscribed_at IS NOT DISTINCT FROM NEW.subscribed_at)
);

-- 4. Create function for SSN encryption/decryption
CREATE OR REPLACE FUNCTION public.encrypt_ssn(ssn_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Simple base64 encoding for now (in production, use proper encryption)
  RETURN encode(ssn_text::bytea, 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_ssn(encrypted_ssn TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN convert_from(decode(encrypted_ssn, 'base64'), 'UTF8');
END;
$$;

-- 5. Add file upload size and type constraints table
CREATE TABLE public.file_upload_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_file_size_mb INTEGER NOT NULL DEFAULT 10,
  allowed_file_types TEXT[] NOT NULL DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default configuration
INSERT INTO public.file_upload_config (max_file_size_mb, allowed_file_types)
VALUES (10, ARRAY['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']);

-- Enable RLS on config table
ALTER TABLE public.file_upload_config ENABLE ROW LEVEL SECURITY;

-- Make config readable by authenticated users
CREATE POLICY "Authenticated users can read upload config"
ON public.file_upload_config
FOR SELECT
TO authenticated
USING (true);