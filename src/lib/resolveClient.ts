import { supabase } from '@/integrations/supabase/client';

/**
 * Canonical client identity resolved from any ID type.
 * Always returns `clients.id` as the primary key and the optional `user_id` foreign key.
 */
export interface ResolvedClient {
  /** Primary key from the `clients` table */
  clientId: string;
  /** The auth user UUID (`clients.user_id`) — null for seeded/unlinked clients */
  userId: string | null;
  fullName: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve any identifier to a canonical `clients` record.
 *
 * Resolution order for UUID inputs:
 *   1. `clients.id`        — direct row match
 *   2. `clients.user_id`   — auth-user linked match
 *   3. `profiles.user_id`  → `clients.user_id` — indirect via profiles
 *
 * Non-UUID inputs fall through to a name-slug ilike search.
 */
export async function resolveClient(identifier: string): Promise<ResolvedClient | null> {
  if (!identifier) return null;

  if (UUID_RE.test(identifier)) {
    // 1. Try clients.id
    const { data: byId } = await supabase
      .from('clients')
      .select('id, full_name, user_id')
      .eq('id', identifier)
      .maybeSingle();
    if (byId) return { clientId: byId.id, userId: byId.user_id, fullName: byId.full_name };

    // 2. Try clients.user_id (auth UUID passed directly)
    const { data: byUserId } = await supabase
      .from('clients')
      .select('id, full_name, user_id')
      .eq('user_id', identifier)
      .maybeSingle();
    if (byUserId) return { clientId: byUserId.id, userId: byUserId.user_id, fullName: byUserId.full_name };

    // 3. Try profiles.user_id → get that profile's user_id → look up client
    //    Handles the case where identifier is profiles.id (auto UUID ≠ user_id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', identifier)
      .maybeSingle();
    if (profile?.user_id) {
      const { data: byProfileUserId } = await supabase
        .from('clients')
        .select('id, full_name, user_id')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      if (byProfileUserId) return { clientId: byProfileUserId.id, userId: byProfileUserId.user_id, fullName: byProfileUserId.full_name };
    }

    return null;
  }

  // Name-slug fallback: "john-doe" → ilike search
  const nameParts = identifier.split('-').filter(Boolean);
  if (nameParts.length === 0) return null;

  const { data: byName } = await supabase
    .from('clients')
    .select('id, full_name, user_id')
    .ilike('full_name', `%${nameParts.join('%')}%`)
    .limit(1)
    .maybeSingle();

  if (byName) return { clientId: byName.id, userId: byName.user_id, fullName: byName.full_name };
  return null;
}
