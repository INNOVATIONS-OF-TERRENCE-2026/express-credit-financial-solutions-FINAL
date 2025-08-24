-- Fix RLS policies for clients table to allow users to access their own data securely
-- while maintaining admin access and protecting sensitive personal information

-- Add policies for users to access their own client data
CREATE POLICY "Users can view their own client data"
ON public.clients
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own client data"
ON public.clients  
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own client data"
ON public.clients
FOR INSERT  
WITH CHECK (auth.uid() = user_id);

-- Users should NOT be able to delete client records (only admins)
-- This preserves data integrity and audit trails

-- Add additional security: Ensure user_id cannot be modified after creation
-- This prevents users from accessing other users' data by changing user_id
CREATE OR REPLACE FUNCTION public.prevent_user_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing user_id after record creation
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'user_id cannot be modified after creation';
  END IF;
  
  -- Ensure user_id matches authenticated user for updates
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to enforce user_id security
DROP TRIGGER IF EXISTS enforce_user_id_security ON public.clients;
CREATE TRIGGER enforce_user_id_security
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_id_change();

-- Log sensitive data access for audit purposes
CREATE OR REPLACE FUNCTION public.log_client_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive client data
  PERFORM public.log_security_event(
    TG_OP || '_CLIENT_DATA',
    'clients', 
    NEW.id::text,
    jsonb_build_object(
      'client_id', NEW.id,
      'accessed_by', auth.uid(),
      'sensitive_fields_accessed', true
    ),
    'info',
    CASE 
      WHEN TG_OP = 'SELECT' THEN 1
      WHEN TG_OP = 'UPDATE' THEN 3  
      WHEN TG_OP = 'INSERT' THEN 2
      ELSE 5
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;