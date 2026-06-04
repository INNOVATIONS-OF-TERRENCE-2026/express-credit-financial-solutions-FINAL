import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Canonical client identity. `clients.id` is always primary; `user_id` is optional.
 */
export interface ResolvedClient {
  clientId: string;
  userId: string | null;
  fullName: string;
  email: string | null;
  raw: any;
}

export type PortalResolution =
  | { status: 'linked'; client: ResolvedClient }
  | { status: 'auto_linked'; client: ResolvedClient }
  | { status: 'pending_setup'; reason: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toResolved = (row: any): ResolvedClient => ({
  clientId: row.id,
  userId: row.user_id ?? null,
  fullName: row.full_name ?? '',
  email: row.email ?? null,
  raw: row,
});

/** Resolve a client by `clients.id`. */
export async function resolveClientById(clientId: string): Promise<ResolvedClient | null> {
  if (!clientId || !UUID_RE.test(clientId)) return null;
  const { data } = await supabase.from('clients').select('*').eq('id', clientId).maybeSingle();
  return data ? toResolved(data) : null;
}

/** Resolve by `clients.user_id` (the auth uid linked to the client). */
export async function resolveClientByUserId(userId: string): Promise<ResolvedClient | null> {
  if (!userId) return null;
  const { data } = await supabase.from('clients').select('*').eq('user_id', userId).maybeSingle();
  return data ? toResolved(data) : null;
}

/** Resolve by `clients.email` (case-insensitive). */
export async function resolveClientByEmail(email: string): Promise<ResolvedClient | null> {
  if (!email) return null;
  const { data } = await supabase
    .from('clients')
    .select('*')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();
  return data ? toResolved(data) : null;
}

/**
 * Admin-side: always resolves by `clients.id`. Never uses admin's auth uid.
 * Works even when the client has no linked auth account.
 */
export async function resolveClientForAdmin(clientId: string): Promise<ResolvedClient | null> {
  return resolveClientById(clientId);
}

/**
 * Portal-side: tries user_id first, then email. If matched by email and
 * `clients.user_id` is null, safely links it to the current auth user.
 */
export async function resolveClientForPortal(user: User | null | undefined): Promise<PortalResolution> {
  if (!user) return { status: 'pending_setup', reason: 'no_auth_user' };

  const byUser = await resolveClientByUserId(user.id);
  if (byUser) return { status: 'linked', client: byUser };

  const email = (user.email || '').trim();
  if (!email) return { status: 'pending_setup', reason: 'no_email' };

  const byEmail = await resolveClientByEmail(email);
  if (!byEmail) return { status: 'pending_setup', reason: 'no_match' };

  if (byEmail.userId && byEmail.userId !== user.id) {
    // Email match collides with another auth user — do not auto-link.
    return { status: 'pending_setup', reason: 'email_owned_by_other_user' };
  }

  if (!byEmail.userId) {
    // Safe, idempotent link: only update when still null.
    const { data: linked } = await supabase
      .from('clients')
      .update({ user_id: user.id, updated_at: new Date().toISOString() })
      .eq('id', byEmail.clientId)
      .is('user_id', null)
      .select('*')
      .maybeSingle();
    if (linked) return { status: 'auto_linked', client: toResolved(linked) };
  }

  return { status: 'linked', client: { ...byEmail, userId: user.id } };
}
