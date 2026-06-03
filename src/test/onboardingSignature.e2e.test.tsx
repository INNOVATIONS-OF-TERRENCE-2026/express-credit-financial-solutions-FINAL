import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// In-memory fixture for the "client_agreements" row that flips on sign.
const fixture: { agreement: any | null; uploads: string[] } = { agreement: null, uploads: [] };

vi.mock('@/integrations/supabase/client', () => {
  const userId = 'user-123';
  const auth = {
    getUser: async () => ({ data: { user: { id: userId, email: 't@e.com' } } }),
    getSession: async () => ({ data: { session: { user: { id: userId } } } }),
    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  };

  const fromBuilder = (table: string) => {
    const state: any = { table, _filters: {} as Record<string, any> };
    const api: any = {
      select: () => api,
      eq: (col: string, val: any) => { state._filters[col] = val; return api; },
      order: () => api,
      maybeSingle: async () => {
        if (table === 'client_agreements' && state._filters.user_id === userId) {
          return { data: fixture.agreement, error: null };
        }
        if (table === 'clients' && state._filters.user_id === userId) {
          return { data: { id: 'client-abc' }, error: null };
        }
        return { data: null, error: null };
      },
      single: async () => {
        if (table === 'client_agreements' && state._lastInsert) {
          return { data: state._lastInsert, error: null };
        }
        return { data: null, error: { code: 'PGRST116' } };
      },
      insert: (row: any) => {
        if (table === 'client_agreements') {
          fixture.agreement = { id: 'agr-1', ...row };
          state._lastInsert = { id: 'agr-1', signed_pdf_path: row.signed_pdf_path, user_id: row.user_id };
        }
        return api;
      },
    };
    return api;
  };

  const storageBucket = {
    upload: async (path: string) => {
      if (path.split('/')[0] !== userId) return { error: { message: 'RLS reject' } };
      fixture.uploads.push(path);
      return { error: null };
    },
    createSignedUrl: async (path: string) => {
      if (!fixture.uploads.includes(path)) return { data: null, error: { message: 'not found' } };
      return { data: { signedUrl: `https://x/${path}` }, error: null };
    },
  };

  return {
    supabase: {
      auth,
      from: (t: string) => fromBuilder(t),
      storage: { from: () => storageBucket },
      rpc: async () => ({ data: null, error: null }),
      functions: { invoke: async () => ({ data: null, error: null }) },
    },
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123', email: 't@e.com' }, loading: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { useClientAgreement } from '@/hooks/useClientAgreement';
import { ClientAgreementModal } from '@/components/ClientAgreementModal';

function Harness() {
  const { hasSignedAgreement, refetchAgreementStatus } = useClientAgreement();
  const [open, setOpen] = (require('react') as typeof import('react')).useState(false);
  return (
    <div>
      <div data-testid="status">{hasSignedAgreement ? 'GREEN' : 'PENDING'}</div>
      <button onClick={() => setOpen(true)}>Open</button>
      <ClientAgreementModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onAgreementSigned={() => { setOpen(false); refetchAgreementStatus(); }}
      />
    </div>
  );
}

beforeEach(() => { fixture.agreement = null; fixture.uploads = []; });

describe('Onboarding signature e2e', () => {
  it('signs the agreement and flips dashboard status to GREEN', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('PENDING'));

    await user.click(screen.getByText('Open'));
    const nameInput = await screen.findByLabelText(/Full Legal Name/i);
    await user.type(nameInput, 'Jane Q Client');
    const typed = screen.getByLabelText(/Or type signature/i);
    await user.type(typed, 'Jane Q Client');

    await user.click(screen.getByRole('button', { name: /I Agree & Sign Agreement/i }));

    // Upload path must have been written under the user's folder (storage RLS contract)
    await waitFor(() => expect(fixture.uploads.length).toBe(1));
    expect(fixture.uploads[0].startsWith('user-123/')).toBe(true);
    expect(fixture.agreement?.signed_pdf_path).toBe(fixture.uploads[0]);
    expect(fixture.agreement?.user_id).toBe('user-123');

    // Dashboard status flips to GREEN after refetch
    await act(async () => {});
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('GREEN'));
  });
});