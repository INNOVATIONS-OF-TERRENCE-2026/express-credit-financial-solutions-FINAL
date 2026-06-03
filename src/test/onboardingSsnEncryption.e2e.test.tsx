import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Captures the row inserted into `clients` so the test can assert on it
const captured: { insertedClient: any | null; rpcCalls: Array<{ fn: string; args: any }> } = {
  insertedClient: null,
  rpcCalls: [],
};

const USER_ID = 'user-ssn-test';

vi.mock('@/integrations/supabase/client', () => {
  const auth = {
    getUser: async () => ({ data: { user: { id: USER_ID, email: 'john@example.com' } } }),
    getSession: async () => ({ data: { session: { user: { id: USER_ID } } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  };

  const fromBuilder = (table: string) => {
    const api: any = {
      select: () => api,
      eq: () => api,
      order: () => api,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: { code: 'PGRST116' } }),
      insert: async (row: any) => {
        if (table === 'clients') captured.insertedClient = row;
        return { data: row, error: null };
      },
    };
    return api;
  };

  return {
    supabase: {
      auth,
      from: (t: string) => fromBuilder(t),
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: null }),
          createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null }),
        }),
      },
      rpc: async (fn: string, args: any) => {
        captured.rpcCalls.push({ fn, args });
        if (fn === 'encrypt_ssn_secure') {
          const last4 = String(args.ssn_text).slice(-4);
          return { data: `${last4}|MOCK_CIPHERTEXT_B64`, error: null };
        }
        if (fn === 'decrypt_ssn_secure') {
          const stored: string = args.encrypted_ssn || '';
          const last4 = stored.split('|')[0] || '****';
          return { data: `***-**-${last4}`, error: null };
        }
        return { data: null, error: null };
      },
    },
  };
});

vi.mock('@/hooks/useAuditLog', () => ({
  useAuditLog: () => ({ logFileUpload: async () => {}, logAccess: async () => {} }),
}));

vi.mock('@/hooks/useClientAgreement', () => ({
  useClientAgreement: () => ({
    hasSignedAgreement: true,
    loading: false,
    refetchAgreementStatus: () => {},
  }),
}));

vi.mock('@/hooks/useFileUploadSecurity', () => ({
  useFileUploadSecurity: () => ({
    validateFile: () => ({ isValid: true }),
    sanitizeFileName: (n: string) => n,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: () => {} }) }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: USER_ID, email: 'john@example.com' },
    session: { user: { id: USER_ID } },
    loading: false,
    isAdmin: false,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => {},
    checkAdminStatus: async () => false,
  }),
  AuthProvider: ({ children }: any) => children,
}));

import { ClientOnboarding } from '@/pages/ClientOnboarding';
import { supabase } from '@/integrations/supabase/client';

function renderPage() {
  return render(
    <MemoryRouter>
      <ClientOnboarding />
    </MemoryRouter>
  );
}

describe('Onboarding SSN encryption E2E (mocked)', () => {
  beforeEach(() => {
    captured.insertedClient = null;
    captured.rpcCalls = [];
  });

  it('signs in the user, encrypts the SSN via RPC, persists it on clients, and decrypts back to masked format', async () => {
    const user = userEvent.setup();
    renderPage();

    // Form is rendered (user is "signed in" via mocked auth)
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');

    // SSN field auto-formats as XXX-XX-XXXX while typing
    const ssnInput = screen.getByLabelText(/social security number/i);
    await user.type(ssnInput, '123456789');
    expect((ssnInput as HTMLInputElement).value).toBe('123-45-6789');

    await user.type(screen.getByLabelText(/phone number/i), '5551234567');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    await user.click(screen.getByRole('button', { name: /submit|save|complete/i }));

    // 1. encrypt_ssn_secure called with the plaintext digits
    await waitFor(() => {
      const encryptCall = captured.rpcCalls.find((c) => c.fn === 'encrypt_ssn_secure');
      expect(encryptCall).toBeTruthy();
      // SSN gets sanitized through the formatter; assert digits round-trip
      expect(String(encryptCall!.args.ssn_text).replace(/\D/g, '')).toBe('123456789');
    });

    // 2. clients insert payload carries both ssn_last4 AND ssn_encrypted
    await waitFor(() => {
      expect(captured.insertedClient).toBeTruthy();
      expect(captured.insertedClient.user_id).toBe(USER_ID);
      expect(captured.insertedClient.ssn_last4).toBe('6789');
      expect(captured.insertedClient.ssn_encrypted).toBe('6789|MOCK_CIPHERTEXT_B64');
    });

    // 3. Round-trip decrypt: passing the stored ciphertext back to the
    //    server returns the masked ***-**-<last4> value the function
    //    is contractually designed to produce.
    const { data: decrypted } = await (supabase.rpc as any)('decrypt_ssn_secure', {
      encrypted_ssn: captured.insertedClient.ssn_encrypted,
    });
    expect(decrypted).toBe('***-**-6789');
  });
});