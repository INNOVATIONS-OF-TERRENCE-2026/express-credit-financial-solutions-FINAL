-- Fix: encrypt_ssn_secure / decrypt_ssn_secure had search_path='' but called
-- digest() from pgcrypto (installed in the `extensions` schema), causing
-- "function digest(...) does not exist" -> surfaced as "Failed to encrypt SSN".
CREATE OR REPLACE FUNCTION public.encrypt_ssn_secure(ssn_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'extensions', 'public'
AS $function$
DECLARE
  encrypted_data TEXT;
BEGIN
  IF ssn_text IS NULL OR length(ssn_text) < 4 THEN
    RAISE EXCEPTION 'Invalid SSN input';
  END IF;

  encrypted_data := encode(
    extensions.digest(ssn_text || gen_random_uuid()::text, 'sha256'),
    'base64'
  );

  RETURN substring(ssn_text, length(ssn_text) - 3) || '|' || encrypted_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_ssn_secure(encrypted_ssn text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'extensions', 'public'
AS $function$
BEGIN
  IF encrypted_ssn IS NULL OR length(encrypted_ssn) < 4 THEN
    RETURN '***-**-****';
  END IF;
  RETURN '***-**-' || split_part(encrypted_ssn, '|', 1);
END;
$function$;

-- Ensure the client app (authenticated users) can actually invoke the RPCs.
-- Without EXECUTE, the call fails with "permission denied for function ..."
-- which is also surfaced to the UI as "Failed to encrypt SSN".
GRANT EXECUTE ON FUNCTION public.encrypt_ssn_secure(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_ssn_secure(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_ssn_secure(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.decrypt_ssn_secure(text) FROM anon, public;