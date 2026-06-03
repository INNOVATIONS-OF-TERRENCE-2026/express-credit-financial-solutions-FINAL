import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock auth + supabase before importing the component
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
    storage: { from: () => ({ upload: async () => ({ error: null }), createSignedUrl: async () => ({ error: null, data: { signedUrl: '' } }) }) },
    rpc: async () => ({ data: null, error: null }),
  },
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: () => {} }) }));

import { ClientAgreementModal } from '@/components/ClientAgreementModal';

const BREAKPOINTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14 Pro', width: 393, height: 852 },
  { name: 'Android (Pixel 7)', width: 412, height: 915 },
];

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

describe('ClientAgreementModal responsive layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  for (const bp of BREAKPOINTS) {
    it(`renders name field, signature canvas, and Sign button reachable at ${bp.name} (${bp.width}x${bp.height})`, async () => {
      setViewport(bp.width, bp.height);
      render(
        <ClientAgreementModal isOpen={true} onClose={() => {}} onAgreementSigned={() => {}} />
      );

      // Dialog mounts in a Radix portal — query whole document
      const nameInput = await screen.findByLabelText(/full legal name/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).not.toBeDisabled();

      // Signature canvas exists and is visible (not display:none)
      const dialog = nameInput.closest('[role="dialog"]') as HTMLElement;
      expect(dialog).toBeTruthy();
      const canvas = dialog.querySelector('canvas');
      expect(canvas).toBeTruthy();
      expect(canvas).toBeVisible();

      // Sign button is rendered, has the correct accessible label, and is in the DOM
      const signButton = within(dialog).getByRole('button', { name: /sign agreement/i });
      expect(signButton).toBeInTheDocument();

      // Typed fallback signature input is also reachable
      const typedSig = within(dialog).getByLabelText(/type signature/i);
      expect(typedSig).toBeInTheDocument();
    });
  }

  it('focuses the full name input when the dialog opens (keyboard-first UX)', async () => {
    setViewport(390, 844);
    render(<ClientAgreementModal isOpen={true} onClose={() => {}} onAgreementSigned={() => {}} />);
    const nameInput = await screen.findByLabelText(/full legal name/i);
    // Radix onOpenAutoFocus redirects focus to #fullName
    await vi.waitFor(() => expect(document.activeElement).toBe(nameInput));
  });

  it('keyboard navigation reaches the signature fallback input via Tab', async () => {
    setViewport(390, 844);
    const user = userEvent.setup();
    render(<ClientAgreementModal isOpen={true} onClose={() => {}} onAgreementSigned={() => {}} />);
    const nameInput = await screen.findByLabelText(/full legal name/i);
    nameInput.focus();
    // Tab through: name -> (canvas / clear button) -> typed signature input
    // We assert that the typed signature input is reachable via keyboard at all
    const typedSig = screen.getByLabelText(/type signature/i);
    for (let i = 0; i < 8; i++) {
      if (document.activeElement === typedSig) break;
      await user.tab();
    }
    expect(document.activeElement).toBe(typedSig);
  });
});