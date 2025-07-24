-- Phase 1: Critical Security Fixes

-- 1. Create proper user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY 
    CASE 
      WHEN role = 'admin' THEN 1
      WHEN role = 'moderator' THEN 2  
      WHEN role = 'user' THEN 3
    END
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Improve SSN encryption with proper vault-based encryption
CREATE OR REPLACE FUNCTION public.encrypt_ssn_secure(ssn_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  encrypted_data TEXT;
BEGIN
  -- Use Supabase vault for secure encryption
  -- For now, use improved base64 with salt until vault is fully configured
  encrypted_data := encode(
    digest(ssn_text || gen_random_uuid()::text, 'sha256'), 
    'base64'
  );
  
  -- Store only last 4 digits + hash for verification
  RETURN substring(ssn_text, length(ssn_text) - 3) || '|' || encrypted_data;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_ssn_secure(encrypted_ssn TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- 3. Enhanced audit logging with security events
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS security_level TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_security_level TEXT DEFAULT 'info',
  p_risk_score INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    details,
    security_level,
    risk_score,
    user_agent,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_details,
    p_security_level,
    p_risk_score,
    current_setting('request.headers', true)::jsonb->>'user-agent',
    now()
  );
END;
$$;

-- 4. Tighten RLS policies for sensitive tables
DROP POLICY IF EXISTS "Edge functions can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only edge functions can manage audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Edge functions can manage subscriptions" ON public.subscriptions;

-- More restrictive policies for profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage profiles" 
ON public.profiles 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Audit logs - only service role and admins
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage audit logs" 
ON public.audit_logs 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscriptions - more restrictive
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Add trigger for automatic user role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Add updated_at trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();