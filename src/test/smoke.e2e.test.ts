/**
 * End-to-end smoke test — runs against the LIVE Supabase project.
 *
 * Skipped automatically unless ALL of these env vars are set:
 *   E2E_ADMIN_EMAIL
 *   E2E_ADMIN_PASSWORD
 *   E2E_CLIENT_EMAIL
 *   E2E_CLIENT_PASSWORD
 *
 * Run locally with:
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
 *   E2E_CLIENT_EMAIL=... E2E_CLIENT_PASSWORD=... \
 *   bunx vitest run src/test/smoke.e2e.test.ts
 *
 * What it verifies (production-safe):
 *  1. Admin sign-in succeeds and has_role('admin') returns true.
 *  2. Client sign-in succeeds.
 *  3. Client uploads a tiny file to client-documents/<uid>/e2e/ and the
 *     object is listable. The object is deleted in afterAll.
 *  4. Admin can query the same metric counts the dashboard uses
   *     (clients, payment_records, document_archive, credit_report_uploads,
 *      clients where ftc_readiness_status='ready').
 *  5. No console.error / console.warn fired during the whole run.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const ANON = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const CLIENT_EMAIL = process.env.E2E_CLIENT_EMAIL;
const CLIENT_PASSWORD = process.env.E2E_CLIENT_PASSWORD;

const enabled = Boolean(
  URL && ANON && ADMIN_EMAIL && ADMIN_PASSWORD && CLIENT_EMAIL && CLIENT_PASSWORD
);
const describeMaybe = enabled ? describe : describe.skip;

const mkClient = (): SupabaseClient =>
  createClient(URL!, ANON!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

describeMaybe('E2E smoke — admin + client + upload + KPIs', () => {
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  let adminClient: SupabaseClient;
  let clientClient: SupabaseClient;
  let adminUserId = '';
  let clientUserId = '';
  const uploadedPaths: string[] = [];

  beforeAll(() => {
    adminClient = mkClient();
    clientClient = mkClient();
  });

  afterAll(async () => {
    // Clean up any uploaded smoke-test objects
    if (clientClient && uploadedPaths.length) {
      try {
        await clientClient.storage.from('client-documents').remove(uploadedPaths);
      } catch {
        /* best-effort cleanup */
      }
    }
    try { await adminClient?.auth.signOut(); } catch { /* noop */ }
    try { await clientClient?.auth.signOut(); } catch { /* noop */ }
    errSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('admin signs in and has the admin role', async () => {
    const { data, error } = await adminClient.auth.signInWithPassword({
      email: ADMIN_EMAIL!,
      password: ADMIN_PASSWORD!,
    });
    expect(error).toBeNull();
    expect(data?.user?.id).toBeTruthy();
    adminUserId = data!.user!.id;

    const { data: isAdmin, error: rpcErr } = await adminClient.rpc('has_role', {
      _user_id: adminUserId,
      _role: 'admin',
    });
    expect(rpcErr).toBeNull();
    expect(isAdmin).toBe(true);
  }, 30_000);

  it('client signs in', async () => {
    const { data, error } = await clientClient.auth.signInWithPassword({
      email: CLIENT_EMAIL!,
      password: CLIENT_PASSWORD!,
    });
    expect(error).toBeNull();
    expect(data?.user?.id).toBeTruthy();
    clientUserId = data!.user!.id;
  }, 30_000);

  it('client uploads a tiny document and can list it back', async () => {
    expect(clientUserId).toBeTruthy();
    const path = `${clientUserId}/e2e/smoke-${Date.now()}.txt`;
    const body = new Blob(
      [`e2e smoke test — safe to delete — ${new Date().toISOString()}`],
      { type: 'text/plain' }
    );

    const { error: upErr } = await clientClient.storage
      .from('client-documents')
      .upload(path, body, { contentType: 'text/plain', upsert: true });
    expect(upErr, upErr?.message).toBeNull();
    uploadedPaths.push(path);

    const { data: listed, error: listErr } = await clientClient.storage
      .from('client-documents')
      .list(`${clientUserId}/e2e`, { limit: 100 });
    expect(listErr).toBeNull();
    expect(listed?.some((o) => path.endsWith(o.name))).toBe(true);
  }, 45_000);

  it('admin can read the same counts the KPI dashboard renders', async () => {
    const countHead = async (
      table: string,
      build?: (q: any) => any
    ): Promise<{ ok: boolean; count: number | null; error: string | null }> => {
      const c: any = adminClient;
      let q = c.from(table).select('id', { count: 'exact', head: true });
      if (build) q = build(q);
      const { count, error } = await q;
      return { ok: !error, count: count ?? null, error: error?.message ?? null };
    };

    const probes = await Promise.all([
      countHead('clients'),
      countHead('clients', (q: any) => q.eq('status', 'active')),
      countHead('clients', (q: any) => q.eq('ftc_readiness_status', 'ready')),
      countHead('payment_records', (q: any) => q.eq('payment_status', 'pending')),
      countHead('document_archive', (q: any) => q.eq('document_type', 'pending')),
      countHead('credit_report_uploads'),
    ]);

    for (const p of probes) {
      expect(p.ok, p.error ?? 'admin KPI query failed').toBe(true);
      expect(typeof p.count === 'number' || p.count === null).toBe(true);
    }
  }, 45_000);

  it('produced no console errors or warnings during the run', () => {
    // Filter out the React-Router / SBAConfig dev warning that fires on every page load —
    // it is unrelated to the auth + upload + KPI surface this smoke test exercises.
    const ignore = (s: string) => /default API URL for development/i.test(s);

    const realErrs = errSpy.mock.calls
      .map((args) => args.map(String).join(' '))
      .filter((s) => !ignore(s));
    const realWarns = warnSpy.mock.calls
      .map((args) => args.map(String).join(' '))
      .filter((s) => !ignore(s));

    expect(realErrs, `console.error: ${realErrs.join(' | ')}`).toEqual([]);
    expect(realWarns, `console.warn: ${realWarns.join(' | ')}`).toEqual([]);
  });
});