import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const USER_ID = 'user-credit-test';
const captured: {
  storageUploads: Array<{ bucket: string; path: string; file: File; opts?: any }>;
  inserts: Array<{ table: string; row: any }>;
  rows: any[];
  fnInvocations: Array<{ name: string; body: any }>;
} = { storageUploads: [], inserts: [], rows: [], fnInvocations: [] };

vi.mock('@/integrations/supabase/client', () => {
  const auth = {
    getUser: async () => ({ data: { user: { id: USER_ID, email: 'client@example.com' } } }),
    getSession: async () => ({ data: { session: { user: { id: USER_ID } } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  };

  const fromBuilder = (table: string) => {
    const api: any = {
      select: () => api,
      eq: () => api,
      order: async () => ({ data: table === 'credit_report_uploads' ? captured.rows : [], error: null }),
      single: async () => ({ data: captured.rows[captured.rows.length - 1], error: null }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
      delete: () => ({ eq: async () => ({ data: null, error: null }) }),
      insert: (row: any) => {
        captured.inserts.push({ table, row });
        const stored = {
          id: `row-${captured.rows.length + 1}`,
          uploaded_at: new Date().toISOString(),
          analysis_status: 'pending',
          analysis_url: null,
          flagged_accounts_count: 0,
          ai_analysis_summary: null,
          ...row,
        };
        captured.rows.push(stored);
        return {
          select: () => ({ single: async () => ({ data: stored, error: null }) }),
        };
      },
    };
    return api;
  };

  return {
    supabase: {
      auth,
      from: (t: string) => fromBuilder(t),
      storage: {
        from: (bucket: string) => ({
          upload: async (path: string, file: File, opts?: any) => {
            captured.storageUploads.push({ bucket, path, file, opts });
            return { data: { path }, error: null };
          },
          remove: async () => ({ data: null, error: null }),
          createSignedUrl: async () => ({ data: { signedUrl: 'https://example.test/x' }, error: null }),
        }),
      },
      functions: {
        invoke: async (name: string, body: any) => {
          captured.fnInvocations.push({ name, body });
          return { data: { flaggedAccountsCount: 0 }, error: null };
        },
      },
    },
  };
});

vi.mock('@/hooks/useFileUploadSecurity', () => ({
  useFileUploadSecurity: () => ({
    validateFile: () => ({ isValid: true }),
    sanitizeFileName: (n: string) => n.replace(/[^a-zA-Z0-9.-]/g, '_'),
  }),
}));

vi.mock('@/hooks/use-toast', () => {
  const fn = vi.fn();
  return {
    useToast: () => ({ toast: fn }),
    toast: fn,
    __toastSpy: fn,
  };
});

import * as useToastModule from '@/hooks/use-toast';
const toastSpy = (useToastModule as any).__toastSpy as ReturnType<typeof vi.fn>;

import { EnhancedCreditReportUpload } from '@/components/EnhancedCreditReportUpload';

describe('Credit Report Upload Center — E2E', () => {
  beforeEach(() => {
    captured.storageUploads.length = 0;
    captured.inserts.length = 0;
    captured.rows.length = 0;
    captured.fnInvocations.length = 0;
    toastSpy.mockClear();
  });

  it('uploads a PDF and shows it in the uploaded files table (client dashboard)', async () => {
    const user = userEvent.setup();
    render(<EnhancedCreditReportUpload />);

    const input = await screen.findByTestId<HTMLInputElement>('credit-upload-input');
    const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'experian.pdf', {
      type: 'application/pdf',
    });
    await user.upload(input, pdf);

    // File reached storage in the credit-reports bucket, scoped to user folder
    await waitFor(() => expect(captured.storageUploads.length).toBe(1));
    expect(captured.storageUploads[0].bucket).toBe('credit-reports');
    expect(captured.storageUploads[0].path.startsWith(`${USER_ID}/`)).toBe(true);
    expect(captured.storageUploads[0].opts?.contentType).toBe('application/pdf');

    // DB row was inserted into credit_report_uploads
    const dbInsert = captured.inserts.find((i) => i.table === 'credit_report_uploads');
    expect(dbInsert).toBeTruthy();
    expect(dbInsert!.row.file_name).toBe('experian.pdf');
    expect(dbInsert!.row.user_id).toBe(USER_ID);

    // Analysis was triggered
    expect(captured.fnInvocations.some((f) => f.name === 'analyze-credit-report')).toBe(true);

    // File appears in the client-facing list
    await waitFor(() => {
      expect(screen.getByText('experian.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText(/Uploaded Files \(1\)/i)).toBeInTheDocument();

    // Success toast fired
    expect(
      toastSpy.mock.calls.some(([arg]) => arg?.title === 'Upload successful'),
    ).toBe(true);
  });

  it('rejects a non-PDF file with a destructive toast and uploads nothing', async () => {
    const user = userEvent.setup();
    render(<EnhancedCreditReportUpload />);

    const input = await screen.findByTestId<HTMLInputElement>('credit-upload-input');
    const png = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' });
    await user.upload(input, png);

    await waitFor(() => {
      expect(
        toastSpy.mock.calls.some(
          ([arg]) => arg?.title === 'Invalid file' && arg?.variant === 'destructive',
        ),
      ).toBe(true);
    });
    expect(captured.storageUploads.length).toBe(0);
    expect(captured.inserts.length).toBe(0);
  });

  it('rejects an oversized PDF (>10MB) with a clear error toast', async () => {
    const user = userEvent.setup();
    render(<EnhancedCreditReportUpload />);

    const input = await screen.findByTestId<HTMLInputElement>('credit-upload-input');
    const big = new File([new Uint8Array(11 * 1024 * 1024)], 'huge.pdf', {
      type: 'application/pdf',
    });
    await user.upload(input, big);

    await waitFor(() => {
      const call = toastSpy.mock.calls.find(([arg]) => arg?.title === 'Invalid file');
      expect(call).toBeTruthy();
      expect(String(call![0].description)).toMatch(/too large/i);
    });
    expect(captured.storageUploads.length).toBe(0);
  });

  it('uploader is reachable and clickable at iPhone (390px) and Android (360px) widths', async () => {
    for (const width of [390, 360]) {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
      window.dispatchEvent(new Event('resize'));

      const { unmount } = render(<EnhancedCreditReportUpload />);
      const btn = await screen.findByRole('button', { name: /browse files/i });
      expect(btn).toBeEnabled();
      // The dropzone itself is a button too (touch / keyboard reachable)
      expect(screen.getByRole('button', { name: /upload credit report/i })).toBeInTheDocument();
      unmount();
    }
  });
});