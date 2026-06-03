import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Live round-trip test against the real Supabase project.
 *
 * Skipped by default. To run it, export these env vars before invoking
 * vitest:
 *
 *   E2E_SUPABASE_EMAIL=...      # email of an existing test user
 *   E2E_SUPABASE_PASSWORD=...   # password for that user
 *
 * The test:
 *   1. Signs the user in with email+password.
 *   2. Calls encrypt_ssn_secure RPC -> asserts ciphertext starts with `6789|`.
 *   3. Inserts a clients row carrying `ssn_encrypted`, reads it back.
 *   4. Calls decrypt_ssn_secure -> asserts it returns `***-**-6789`.
 *   5. Cleans the test row up.
 */

const URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const ANON = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const EMAIL = process.env.E2E_SUPABASE_EMAIL;
const PASSWORD = process.env.E2E_SUPABASE_PASSWORD;

const enabled = Boolean(URL && ANON && EMAIL && PASSWORD);
const describeMaybe = enabled ? describe : describe.skip;

describeMaybe('SSN encryption — live Supabase round trip', () => {
  it('encrypts a plaintext SSN, persists it on the clients row, and decrypts back to the masked format', async () => {
    const supabase = createClient(URL!, ANON!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
      email: EMAIL!,
      password: PASSWORD!,
    });
    expect(signInErr).toBeNull();
    expect(signIn?.user?.id).toBeTruthy();
    const userId = signIn!.user!.id;

    // 1. Encrypt
    const plaintext = '123456789';
    const { data: ciphertext, error: encErr } = await supabase.rpc('encrypt_ssn_secure', {
      ssn_text: plaintext,
    });
    expect(encErr).toBeNull();
    expect(typeof ciphertext).toBe('string');
    expect(String(ciphertext).startsWith('6789|')).toBe(true);

    // 2. Persist on clients (uses an isolated row we delete at the end)
    const stamp = `e2e-${Date.now()}`;
    const { data: inserted, error: insErr } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        full_name: `E2E Test ${stamp}`,
        dob: '1990-01-01',
        ssn_last4: '6789',
        ssn_encrypted: ciphertext,
        phone: '5551234567',
        email: EMAIL!,
        address: 'E2E test row — safe to delete',
        membership_plan: 'Basic',
      } as any)
      .select('id, ssn_encrypted, ssn_last4')
      .single();
    expect(insErr).toBeNull();
    expect(inserted?.ssn_encrypted).toBe(ciphertext);
    expect(inserted?.ssn_last4).toBe('6789');

    // 3. Decrypt back through the server function
    const { data: masked, error: decErr } = await supabase.rpc('decrypt_ssn_secure', {
      encrypted_ssn: inserted!.ssn_encrypted,
    });
    expect(decErr).toBeNull();
    expect(masked).toBe('***-**-6789');

    // 4. Cleanup
    if (inserted?.id) {
      await supabase.from('clients').delete().eq('id', inserted.id);
    }
    await supabase.auth.signOut();
  }, 30_000);
});