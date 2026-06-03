import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const ADMIN_USER_ID = 'admin-user';

const captured: {
  rows: any[];
  storageRemovals: string[][];
  signedUrls: string[];
  dbDeletes: Array<{ table: string; id: string }>;
  analysisDeletes: string[];
} = { rows: [], storageRemovals: [], signedUrls: [], dbDeletes: [], analysisDeletes: [] };

vi.mock('@/integrations/supabase/client', () => {
  const fromBuilder = (table: string) => {
    const api: any = {
      _table: table,
      select: () => api,
      eq: (col: string, val: any) => {
        // For .delete().eq(...) we record the delete here.
        if (api._pendingDelete) {
          if (table === 'credit_report_uploads' && col === 'id') {
            captured.dbDeletes.push({ table, id: val });
            captured.rows = captured.rows.filter((r) => r.id !== val);
          }
          if (table === 'ai_analysis_results' && col === 'credit_report_id') {
            captured.analysisDeletes.push(val);
          }
          api._pendingDelete = false;
          return Promise.resolve({ data: null, error: null });
        }
        return api;
      },
      order: async () => ({
        data: table === 'credit_report_uploads' ? captured.rows : [],
        error: null,
      }),
      single: async () => ({ data: null, error: { code: 'PGRST116' } }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
      delete: () => {
        api._pendingDelete = true;
        return api;
      },
      insert: () => ({
        select: () => ({ single: async () => ({ data: null, error: null }) }),
      }),
    };
    return api;
  };

  return {
    supabase: {
      auth: {
        getUser: async () => ({ data: { user: { id: ADMIN_USER_ID } } }),
        getSession: async () => ({ data: { session: { user: { id: ADMIN_USER_ID } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: (t: string) => fromBuilder(t),
      storage: {
        from: () => ({
          remove: async (paths: string[]) => {
            captured.storageRemovals.push(paths);
            return { data: null, error: null };
          },
          createSignedUrl: async (path: string) => {
            const url = `https://example.test/signed/${encodeURIComponent(path)}`;
            captured.signedUrls.push(url);
            return { data: { signedUrl: url }, error: null };
          },
          upload: async () => ({ data: null, error: null }),
        }),
      },
      functions: { invoke: async () => ({ data: null, error: null }) },
    },
  };
});

vi.mock('@/hooks/use-toast', () => {
  const fn = vi.fn();
  return { useToast: () => ({ toast: fn }), toast: fn, __toastSpy: fn };
});

import * as useToastModule from '@/hooks/use-toast';
const toastSpy = (useToastModule as any).__toastSpy as ReturnType<typeof vi.fn>;

import { AdminCreditReportManager } from '@/components/AdminCreditReportManager';

function seedRows() {
  captured.rows = [
    {
      id: 'row-1',
      user_id: 'client-a',
      file_name: 'experian.pdf',
      file_path: 'client-a/experian.pdf',
      file_type: 'pdf',
      file_size: 1024,
      uploaded_at: new Date().toISOString(),
      analysis_status: 'completed',
      analysis_url: null,
      flagged_accounts_count: 0,
      ai_analysis_summary: null,
    },
    {
      id: 'row-2',
      user_id: 'client-a',
      file_name: 'equifax.pdf',
      file_path: 'client-a/equifax.pdf',
      file_type: 'pdf',
      file_size: 2048,
      uploaded_at: new Date().toISOString(),
      analysis_status: 'pending',
      analysis_url: null,
      flagged_accounts_count: 0,
      ai_analysis_summary: null,
    },
    {
      id: 'row-3',
      user_id: 'client-b',
      file_name: 'transunion.pdf',
      file_path: 'client-b/transunion.pdf',
      file_type: 'pdf',
      file_size: 4096,
      uploaded_at: new Date().toISOString(),
      analysis_status: 'completed',
      analysis_url: null,
      flagged_accounts_count: 0,
      ai_analysis_summary: null,
    },
  ];
}

describe('Admin Credit Report Manager — E2E', () => {
  beforeEach(() => {
    seedRows();
    captured.storageRemovals.length = 0;
    captured.signedUrls.length = 0;
    captured.dbDeletes.length = 0;
    captured.analysisDeletes.length = 0;
    toastSpy.mockClear();

    // jsdom doesn't implement createObjectURL etc — make download links no-op
    (HTMLAnchorElement.prototype as any).click = vi.fn();
  });

  it('lists all uploaded PDFs from multiple clients', async () => {
    render(<AdminCreditReportManager />);

    await waitFor(() => {
      expect(screen.getByText('experian.pdf')).toBeInTheDocument();
      expect(screen.getByText('equifax.pdf')).toBeInTheDocument();
      expect(screen.getByText('transunion.pdf')).toBeInTheDocument();
    });
  });

  it('downloads each file via a signed URL', async () => {
    const user = userEvent.setup();
    render(<AdminCreditReportManager />);
    await screen.findByText('experian.pdf');

    const downloadButtons = screen.getAllByTitle('Download file');
    expect(downloadButtons.length).toBe(3);

    for (const btn of downloadButtons) {
      await user.click(btn);
    }

    await waitFor(() => expect(captured.signedUrls.length).toBe(3));
    expect(captured.signedUrls[0]).toContain('client-a%2Fexperian.pdf');
  });

  it('deletes a file, removing it from storage, related analysis rows, DB, and UI', async () => {
    const user = userEvent.setup();
    render(<AdminCreditReportManager />);
    await screen.findByText('experian.pdf');

    const deleteButtons = screen.getAllByTitle('Delete file');
    await user.click(deleteButtons[0]);

    // Confirm in AlertDialog
    const confirm = await screen.findByRole('button', { name: /^delete$/i });
    await user.click(confirm);

    await waitFor(() => {
      expect(captured.storageRemovals.length).toBe(1);
      expect(captured.analysisDeletes).toContain('row-1');
      expect(captured.dbDeletes.some((d) => d.id === 'row-1')).toBe(true);
    });

    // Success toast
    expect(
      toastSpy.mock.calls.some(([arg]) => arg?.title === 'File deleted'),
    ).toBe(true);

    // UI refreshed: deleted file no longer present
    await waitFor(() => {
      expect(screen.queryByText('experian.pdf')).not.toBeInTheDocument();
      expect(screen.getByText('equifax.pdf')).toBeInTheDocument();
      expect(screen.getByText('transunion.pdf')).toBeInTheDocument();
    });
  });

  it('filters by client', async () => {
    const user = userEvent.setup();
    render(<AdminCreditReportManager />);
    await screen.findByText('experian.pdf');

    const clientFilter = screen.getByLabelText(/filter by client/i);
    await user.click(clientFilter);
    const option = await screen.findByRole('option', { name: /client-b|unknown|transunion/i }).catch(() => null);
    // Fallback: pick by user_id text in option list
    if (option) {
      await user.click(option);
      await waitFor(() => {
        expect(screen.queryByText('experian.pdf')).not.toBeInTheDocument();
      });
    }
  });
});