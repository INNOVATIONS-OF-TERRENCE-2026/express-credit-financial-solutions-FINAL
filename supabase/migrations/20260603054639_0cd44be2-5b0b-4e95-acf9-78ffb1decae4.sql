ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS ssn_encrypted text;

COMMENT ON COLUMN public.clients.ssn_encrypted IS
  'Output of public.encrypt_ssn_secure(ssn). Stores last4|sha256-salted-hash. Never stores plaintext.';