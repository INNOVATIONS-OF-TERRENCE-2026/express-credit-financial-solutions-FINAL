## Goal

Prove end-to-end that an SSN entered on `/onboarding`:
1. Gets encrypted via `encrypt_ssn_secure` (server-side, SECURITY DEFINER + pgcrypto).
2. Is saved on the client's row.
3. Can be round-tripped back through `decrypt_ssn_secure` and returns the masked `***-**-<last4>` value the function is designed to produce.

## Important context discovered

- `ClientOnboarding.tsx` already calls `encryptSSN(formData.ssn)` but **throws away the result** — only `ssn_last4` is saved. So today there is nothing on the row to "decrypt back". We need a column.
- `decrypt_ssn_secure` intentionally returns only `***-**-XXXX` (not plaintext). Tests assert that masked format, not the raw SSN.

## Plan

### 1. Schema: persist the encrypted SSN

Migration on `public.clients`:
- Add `ssn_encrypted text` (nullable).
- No grant/RLS change needed — existing client/admin policies on `clients` cover it.

### 2. Wire onboarding to save it

Edit `src/pages/ClientOnboarding.tsx`:
- Keep `const encryptedSSN = await encryptSSN(formData.ssn);`
- Add `ssn_encrypted: encryptedSSN` to the `clients` insert payload alongside `ssn_last4`.

### 3. Mocked E2E test (always runs)

New file `src/test/onboardingSsnEncryption.e2e.test.tsx`:
- Mocks `@/hooks/useAuth` to return a signed-in user.
- Mocks `@/integrations/supabase/client` with:
  - `auth.getUser` → returns the test user.
  - `rpc('encrypt_ssn_secure', ...)` → returns `'1234|ciphertextB64'`.
  - `rpc('decrypt_ssn_secure', ...)` → returns `'***-**-1234'`.
  - `from('clients').insert(...)` → captures the payload in a spy.
  - `storage.from(...).upload` → no-op success.
- Renders `<ClientOnboarding />`, fills name/DOB/SSN/phone/email via `@testing-library/user-event`, attaches dummy `File` blobs to the three file inputs, clicks Submit.
- Asserts:
  1. `rpc` was called with `{ ssn_text: '123456789' }`.
  2. The `insert` payload contains `ssn_encrypted: '1234|ciphertextB64'` and `ssn_last4: '6789'`.
  3. A follow-up call to the mocked `decrypt_ssn_secure` returns `***-**-1234`.

### 4. Live Supabase round-trip test (opt-in)

New file `src/test/ssnEncryption.live.test.ts`, skipped unless `E2E_SUPABASE_EMAIL` and `E2E_SUPABASE_PASSWORD` env vars are set:
- Creates a fresh Supabase client using `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `signInWithPassword` using the env-provided test user.
- Calls `rpc('encrypt_ssn_secure', { ssn_text: '123456789' })`, asserts the returned string ends with `|<base64>` and starts with `6789|`.
- Inserts a row in `clients` with `user_id=auth.uid()` and `ssn_encrypted=<ciphertext>`, then selects it back.
- Calls `rpc('decrypt_ssn_secure', { encrypted_ssn: <ciphertext> })` and asserts it equals `***-**-6789`.
- Cleans up the test row.

This guards the real DB function against future regressions (e.g. the `search_path`/pgcrypto bug we just fixed) without requiring secrets to run the default test suite.

### 5. Verify

- Run the mocked test via `bunx vitest run src/test/onboardingSsnEncryption.e2e.test.tsx`.
- The live test stays skipped in CI unless secrets are wired; document the two env vars in `README.md` test section.

## Files touched

```text
supabase migration                     (add clients.ssn_encrypted)
src/pages/ClientOnboarding.tsx         (persist ssn_encrypted in insert)
src/test/onboardingSsnEncryption.e2e.test.tsx   (new, mocked)
src/test/ssnEncryption.live.test.ts             (new, env-gated)
README.md                              (note the two opt-in env vars)
```

## Out of scope

- Changing `decrypt_ssn_secure` to return plaintext (intentionally masked for security).
- Playwright browser automation (heavier infra; mocked + live RPC tests cover the same regressions).
