-- 1) Lock down Plaid access tokens in bank_links and create safe view
-- Drop overly permissive SELECT policy for bank_links if exists and recreate granular policies
DO $$ BEGIN
  -- Drop existing SELECT policy for bank_links (owner select) if we will move selection to view
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bank_links' AND policyname = 'Users can view their own bank links'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view their own bank links" ON public.bank_links';
  END IF;
  -- Ensure there is no policy unintentionally allowing wide SELECT
END $$;

-- Recreate granular policies for bank_links
DROP POLICY IF EXISTS "Users can insert their own bank links" ON public.bank_links;
CREATE POLICY "Users can insert their own bank links"
ON public.bank_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bank links" ON public.bank_links;
CREATE POLICY "Users can update their own bank links"
ON public.bank_links FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bank links" ON public.bank_links;
CREATE POLICY "Users can delete their own bank links"
ON public.bank_links FOR DELETE
USING (auth.uid() = user_id);

-- Block regular user SELECT on base table; allow admin and service_role only
DROP POLICY IF EXISTS "Admins can view all bank links" ON public.bank_links;
CREATE POLICY "Admins can view all bank links"
ON public.bank_links FOR SELECT
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role can manage bank links" ON public.bank_links;
CREATE POLICY "Service role can manage bank links"
ON public.bank_links FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

-- Create safe view excluding access_token
CREATE OR REPLACE VIEW public.bank_links_safe AS
SELECT id, user_id, account_id, created_at
FROM public.bank_links;

-- RLS for view: enable security barrier via policies on underlying table + grant select on view
GRANT SELECT ON public.bank_links_safe TO authenticated;

-- 2) Fix notification_logs exposure
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_logs' AND policyname = 'Admins can view all notification logs'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can view all notification logs" ON public.notification_logs';
  END IF;
END $$;

-- Strict admin-only select
CREATE POLICY IF NOT EXISTS "Admins can view notification logs"
ON public.notification_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Service role insert only
DROP POLICY IF EXISTS "System can insert notification logs" ON public.notification_logs;
CREATE POLICY "Service role can insert notification logs"
ON public.notification_logs FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 3) Protect credit_api_credentials: create safe view and tighten policies
-- Drop broad ALL policy for users
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'credit_api_credentials' AND policyname = 'Users can manage their own API credentials'
  ) THEN
    EXECUTE 'DROP POLICY "Users can manage their own API credentials" ON public.credit_api_credentials';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'credit_api_credentials' AND policyname = 'Admins can view all API credentials'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can view all API credentials" ON public.credit_api_credentials';
  END IF;
END $$;

-- Recreate granular policies
CREATE POLICY "Users can insert their own API credentials"
ON public.credit_api_credentials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API credentials"
ON public.credit_api_credentials FOR UPDATE
USING (auth.uid() = user_id);

-- No base-table SELECT for regular users; allow admins + service role
CREATE POLICY "Admins can select API credentials"
ON public.credit_api_credentials FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage API credentials"
ON public.credit_api_credentials FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role');

-- Safe view without sensitive columns
CREATE OR REPLACE VIEW public.credit_api_credentials_safe AS
SELECT id, user_id, api_provider, username, is_active, last_sync, created_at, updated_at
FROM public.credit_api_credentials;
GRANT SELECT ON public.credit_api_credentials_safe TO authenticated;

-- 4) Decommission insecure SSN functions
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'encrypt_ssn' AND pg_get_function_identity_arguments(p.oid) = 'ssn_text text'
  ) THEN
    EXECUTE 'DROP FUNCTION public.encrypt_ssn(text)';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'decrypt_ssn' AND pg_get_function_identity_arguments(p.oid) = 'encrypted_ssn text'
  ) THEN
    EXECUTE 'DROP FUNCTION public.decrypt_ssn(text)';
  END IF;
END $$;

-- Ensure only secure SSN functions are executable by authenticated
REVOKE ALL ON FUNCTION public.encrypt_ssn_secure(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrypt_ssn_secure(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.encrypt_ssn_secure(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_ssn_secure(text) TO authenticated;
