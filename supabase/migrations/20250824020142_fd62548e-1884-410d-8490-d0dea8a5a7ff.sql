-- Fix search path security warnings for the functions we just created

-- Update prevent_user_id_change function to set search_path
CREATE OR REPLACE FUNCTION public.prevent_user_id_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Update log_client_data_access function to set search_path  
CREATE OR REPLACE FUNCTION public.log_client_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;