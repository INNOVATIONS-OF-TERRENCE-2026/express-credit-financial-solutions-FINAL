
-- Add profile fields for name and DOB
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Add active_services column for admin service assignment
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_services text[] DEFAULT '{}';

-- Update handle_new_user to capture name metadata from signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, payment_status, first_name, last_name, middle_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    'inactive',
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'middle_name', ''),
    CASE WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
         THEN (NEW.raw_user_meta_data->>'date_of_birth')::date 
         ELSE NULL END
  );
  RETURN NEW;
END;
$function$;
