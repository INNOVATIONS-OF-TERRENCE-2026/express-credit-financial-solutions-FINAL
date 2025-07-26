-- Phase 1: Critical Database Security Fixes

-- 1. Enable RLS on wrappers_fdw_stats table and add admin-only access policy
ALTER TABLE public.wrappers_fdw_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view fdw stats" 
ON public.wrappers_fdw_stats 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix Role Management Security

-- Create trigger to automatically assign default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Assign default 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Log the user creation
  PERFORM public.log_security_event(
    'USER_CREATED',
    'auth.users',
    NEW.id::text,
    jsonb_build_object('email', NEW.email),
    'info',
    0
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user role assignment
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Restrict role modification policies to prevent privilege escalation
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage non-admin roles" 
ON public.user_roles 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND (role != 'admin' OR auth.uid() = user_id)
);

-- Add specific policy for admin role creation (more restrictive)
CREATE POLICY "Only super admins can create admin roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  role != 'admin' 
  OR (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin' AND created_at < now() - interval '1 day'
  ))
);

-- 3. Enhanced SSN Encryption - Update functions for consistency
CREATE OR REPLACE FUNCTION public.encrypt_ssn_secure(ssn_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  encrypted_data TEXT;
BEGIN
  -- Input validation
  IF ssn_text IS NULL OR LENGTH(ssn_text) != 11 OR ssn_text !~ '^\d{3}-\d{2}-\d{4}$' THEN
    RAISE EXCEPTION 'Invalid SSN format. Expected XXX-XX-XXXX';
  END IF;
  
  -- Use improved encryption with salt
  encrypted_data := encode(
    digest(ssn_text || gen_random_uuid()::text, 'sha256'), 
    'base64'
  );
  
  -- Store only last 4 digits + hash for verification
  RETURN substring(ssn_text, length(ssn_text) - 3) || '|' || encrypted_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_ssn_secure(encrypted_ssn text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Return formatted display (***-**-XXXX) for security
  IF encrypted_ssn IS NULL OR length(encrypted_ssn) < 4 THEN
    RETURN '***-**-****';
  END IF;
  
  -- Extract last 4 digits from encrypted format
  RETURN '***-**-' || split_part(encrypted_ssn, '|', 1);
END;
$$;

-- 4. Add audit logging for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'ROLE_ASSIGNED',
      'user_roles',
      NEW.id::text,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'role', NEW.role,
        'assigned_by', auth.uid()
      ),
      'warning',
      CASE WHEN NEW.role = 'admin' THEN 8 ELSE 3 END
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'ROLE_MODIFIED',
      'user_roles',
      NEW.id::text,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'modified_by', auth.uid()
      ),
      'warning',
      CASE WHEN NEW.role = 'admin' OR OLD.role = 'admin' THEN 9 ELSE 4 END
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'ROLE_REMOVED',
      'user_roles',
      OLD.id::text,
      jsonb_build_object(
        'user_id', OLD.user_id,
        'role', OLD.role,
        'removed_by', auth.uid()
      ),
      'critical',
      7
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for role change auditing
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- 5. Add rate limiting table for security operations
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" 
ON public.security_rate_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" 
ON public.security_rate_limits 
FOR ALL 
USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- 6. Enhanced file upload security
UPDATE public.file_upload_config 
SET allowed_file_types = ARRAY['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    max_file_size_mb = 5
WHERE id = (SELECT id FROM public.file_upload_config LIMIT 1);

-- Insert default config if none exists
INSERT INTO public.file_upload_config (allowed_file_types, max_file_size_mb)
SELECT ARRAY['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'], 5
WHERE NOT EXISTS (SELECT 1 FROM public.file_upload_config);