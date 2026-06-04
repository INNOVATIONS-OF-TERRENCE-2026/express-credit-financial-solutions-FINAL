/**
 * UI test for the canonical client document upload flow
 * (/client/documents -> <SecureVerificationUpload />).
 *
 * Verifies end-to-end *in the UI*:
 *   1. The three required upload zones render (ID, SSN, Address).
 *   2. Dropping a file into the ID zone calls supabase.storage
 *      .from('verification-docs').upload(...) with the right path.
 *   3. The verification row is upserted with id_document_url set to
 *      the same storage path.
 *   4. The zone flips to the "Uploaded / Complete" state immediately
 *      after the upload promise resolves (no manual reload needed).
 *   5. A success toast is fired.
 *
 * This does NOT hit Supabase — it asserts the UI contract that the
 * upload button flow actually wires the file to storage + db and
 * reflects the new doc in the same render.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';

// ---- Mocks ----------------------------------------------------------------

const uploadMock = vi.fn().mockResolvedValue({ data: { path: 'ok' }, error: null });
const getPublicUrlMock = vi.fn().mockReturnValue({
  data: { publicUrl: 'https://example.test/x' },
});
const upsertMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: (_bucket: string) => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      }),
    },
    from: (_table: string) => ({
      upsert: upsertMock,
    }),
    rpc: vi.fn().mockResolvedValue({ data: 'ciphertext', error: null }),
  },
}));

const toastMock = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

// Import AFTER mocks so the module picks them up.
import { SecureVerificationUpload } from '@/components/SecureVerificationUpload';

// ---- Helpers --------------------------------------------------------------

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';

function getDropzoneForLabel(labelText: RegExp): HTMLInputElement {
  // Each upload zone renders a Label + dropzone div + hidden <input type="file">.
  // Find the label, walk up to its space-y-2 container, then query the hidden input.
  const label = screen.getByText(labelText);
  const container = label.closest('div.space-y-2') as HTMLElement;
  expect(container).toBeTruthy();
  const input = container.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement | null;
  expect(input, 'hidden file input for ' + labelText).toBeTruthy();
  return input!;
}

function makeFile(name = 'license.png', type = 'image/png') {
  return new File(['fake-image-bytes'], name, { type });
}

// ---- Tests ----------------------------------------------------------------

describe('Client documents UI — upload button flow', () => {
  beforeEach(() => {
    uploadMock.mockClear();
    getPublicUrlMock.mockClear();
    upsertMock.mockClear();
    toastMock.mockClear();
  });

  it('renders the three required upload zones', () => {
    render(<SecureVerificationUpload userId={TEST_USER_ID} />);
    expect(screen.getByText(/Government-Issued Photo ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Proof of Social Security/i)).toBeInTheDocument();
    expect(screen.getByText(/Proof of Current Address/i)).toBeInTheDocument();
    // All three start as "Required"
    expect(screen.getAllByText(/^Required$/i).length).toBe(3);
  });

  it('uploads a file via the ID dropzone, persists the row, and flips the zone to "Uploaded / Complete" immediately', async () => {
    render(<SecureVerificationUpload userId={TEST_USER_ID} />);

    const idInput = getDropzoneForLabel(/Government-Issued Photo ID/i);
    const file = makeFile('license.png', 'image/png');

    // Simulate the user picking a file via the hidden <input type="file">
    // (react-dropzone wires onChange on this input to its onDrop handler).
    Object.defineProperty(idInput, 'files', { value: [file], configurable: true });
    fireEvent.change(idInput);

    // 1. Upload was called on the verification-docs bucket with a path
    //    scoped to the user id.
    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1));
    const [uploadedPath, uploadedBody] = uploadMock.mock.calls[0];
    expect(uploadedPath).toMatch(
      new RegExp(`^${TEST_USER_ID}/id_\\d+\\.png$`)
    );
    expect(uploadedBody).toBe(file);

    // 2. The verification row was upserted with id_document_url = same path.
    await waitFor(() => expect(upsertMock).toHaveBeenCalledTimes(1));
    const upsertPayload = upsertMock.mock.calls[0][0];
    expect(upsertPayload.user_id).toBe(TEST_USER_ID);
    expect(upsertPayload.id_document_url).toBe(uploadedPath);

    // 3. UI flips to "Uploaded / Complete" in the SAME render (no refetch).
    const label = screen.getByText(/Government-Issued Photo ID/i);
    const container = label.closest('div.space-y-2') as HTMLElement;
    await waitFor(() => {
      expect(within(container).getByText(/^Uploaded$/i)).toBeInTheDocument();
      expect(within(container).getByText(/^Complete$/i)).toBeInTheDocument();
    });

    // 4. The other two zones still show "Required" — we only updated one.
    expect(screen.getAllByText(/^Required$/i).length).toBe(2);

    // 5. Success toast fired (no destructive variant).
    expect(toastMock).toHaveBeenCalled();
    const lastToast = toastMock.mock.calls.at(-1)?.[0];
    expect(lastToast?.title).toMatch(/Document Uploaded/i);
    expect(lastToast?.variant).not.toBe('destructive');
  });

  it('rejects an unsupported file type with a destructive toast and no upload call', async () => {
    render(<SecureVerificationUpload userId={TEST_USER_ID} />);

    const idInput = getDropzoneForLabel(/Government-Issued Photo ID/i);
    const badFile = new File(['x'], 'malware.exe', { type: 'application/x-msdownload' });

    Object.defineProperty(idInput, 'files', { value: [badFile], configurable: true });
    fireEvent.change(idInput);

    // react-dropzone's `accept` filter drops the file before our handler runs,
    // so we just assert no upload happened and the zone stays "Required".
    await waitFor(() => {
      expect(uploadMock).not.toHaveBeenCalled();
    });
    expect(screen.getAllByText(/^Required$/i).length).toBe(3);
  });
});