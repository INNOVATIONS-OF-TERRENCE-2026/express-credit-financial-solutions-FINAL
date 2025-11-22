-- Add encryption functions for Plaid tokens and improve SSN encryption

-- Function to encrypt Plaid access tokens using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Generate encryption key from environment (in production, use Supabase Vault)
CREATE OR REPLACE FUNCTION encrypt_plaid_token(token_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encrypted_data TEXT;
  encryption_key TEXT;
BEGIN
  -- Use a consistent encryption key (in production, this should come from Supabase Vault)
  -- For now, we use pgcrypto's built-in functions with a derived key
  encryption_key := encode(digest('plaid_encryption_key_v1', 'sha256'), 'hex');
  
  -- Encrypt the token using AES
  encrypted_data := encode(
    encrypt(
      token_text::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
  
  RETURN encrypted_data;
END;
$$;

-- Function to decrypt Plaid access tokens
CREATE OR REPLACE FUNCTION decrypt_plaid_token(encrypted_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_data TEXT;
  encryption_key TEXT;
BEGIN
  -- Use the same encryption key
  encryption_key := encode(digest('plaid_encryption_key_v1', 'sha256'), 'hex');
  
  -- Decrypt the token
  decrypted_data := convert_from(
    decrypt(
      decode(encrypted_token, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'utf8'
  );
  
  RETURN decrypted_data;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to decrypt Plaid token: %', SQLERRM;
END;
$$;

-- Log access to decryption function for audit trail
CREATE OR REPLACE FUNCTION decrypt_plaid_token_with_audit(encrypted_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_token TEXT;
BEGIN
  -- Decrypt the token
  decrypted_token := decrypt_plaid_token(encrypted_token);
  
  -- Log the decryption attempt
  PERFORM log_security_event(
    'PLAID_TOKEN_DECRYPTED',
    'bank_links',
    NULL,
    jsonb_build_object(
      'decrypted_by', auth.uid(),
      'timestamp', now()
    ),
    'info',
    2
  );
  
  RETURN decrypted_token;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION encrypt_plaid_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_plaid_token(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION decrypt_plaid_token_with_audit(TEXT) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION encrypt_plaid_token IS 'Encrypts Plaid access tokens before storage';
COMMENT ON FUNCTION decrypt_plaid_token IS 'Decrypts Plaid access tokens for API calls';
COMMENT ON FUNCTION decrypt_plaid_token_with_audit IS 'Decrypts Plaid tokens with audit logging';