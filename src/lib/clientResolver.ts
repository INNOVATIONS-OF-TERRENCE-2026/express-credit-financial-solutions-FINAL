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
  | { status: 'created'; client: ResolvedClient }
  | { status: 'pending_setup'; reason: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toResolved = (row: any): ResolvedClient => ({
  clientId: row.id,
  userId: row.user_id ?? null,
  fullName: row.full_name ?? '',
  email: row.email ?? null,
  raw: row,
});

const normalizeEmail = (email?: string | null) => (email || '').trim().toLowerCase();

const getFallbackName = (user: User, email: string) => {
  const metadata = user.user_metadata || {};
  const candidate =
    metadata.full_name ||
    metadata.name ||
    [metadata.first_name, metadata.last_name].filter(Boolean).join(' ') ||
    email.split('@')[0];

  return String(candidate || email.split('@')[0]).trim();
};

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
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  const { data } = await supabase
    .from('clients')
    .select('*')
    .ilike('email', normalizedEmail)
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

async function createClientForPortalUser(user: User, email: string): Promise<ResolvedClient | null> {
  const fullName = getFallbackName(user, email);

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      email,
      full_name: fullName,
      portal_status: 'active',
      status: 'active',
      service_status: 'active',
      access_services_enabled: true,
      membership_plan: 'premium',
      payment_status: 'active',
    })
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Unable to create portal client record:', error);
    return null;
  }

  return data ? toResolved(data) : null;
}

/**
 * Portal-side: tries user_id first, then email. If matched by email and
 * `clients.user_id` is null, safely links it to the current auth user.
 * If no client row exists, creates a clean client row for the authenticated user.
 */
export async function resolveClientForPortal(user: User | null | undefined): Promise<PortalResolution> {
  if (!user) return { status: 'pending_setup', reason: 'no_auth_user' };

  const byUser = await resolveClientByUserId(user.id);
  if (byUser) return { status: 'linked', client: byUser };

  const email = normalizeEmail(user.email);
  if (!email) return { status: 'pending_setup', reason: 'no_email' };

  const byEmail = await resolveClientByEmail(email);

  if (byEmail?.userId && byEmail.userId !== user.id) {
    return { status: 'pending_setup', reason: 'email_owned_by_other_user' };
  }

  if (byEmail && !byEmail.userId) {
    const { data: linked } = await supabase
      .from('clients')
      .update({
        user_id: user.id,
        email,
        portal_status: 'active',
        status: byEmail.raw?.status || 'active',
        service_status: byEmail.raw?.service_status || 'active',
        access_services_enabled: byEmail.raw?.access_services_enabled ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', byEmail.clientId)
      .is('user_id', null)
      .select('*')
      .maybeSingle();

    if (linked) return { status: 'auto_linked', client: toResolved(linked) };
  }

  const created = await createClientForPortalUser(user, email);
  if (created) return { status: 'created', client: created };

  return { status: 'pending_setup', reason: 'client_create_failed' };
}
