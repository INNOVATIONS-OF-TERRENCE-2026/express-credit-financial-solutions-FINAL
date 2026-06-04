import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** A client row plus derived fields. */
export interface RegistryClient {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  created_at: string | null;
  not_a_client?: boolean | null;
  portal_status?: string | null;
}

/** A profile that has no matching client row (by user_id OR by email). */
export interface MissingProfile {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  membership_type: string | null;
  created_at: string | null;
  /** Suggested match against an existing client, if any (low confidence). */
  suggested_client_id: string | null;
  suggested_client_label: string | null;
  suggested_confidence: number; // 0-100
}

/** A non-client owner identity discovered in a feature table. */
export interface OrphanIdentity {
  source: 'payment_records' | 'credit_report_uploads' | 'client_agreements';
  user_id: string;
  /** Best-effort label from the source row. */
  label: string | null;
  count: number;
}

export interface DuplicateGroup {
  key: string;       // email or normalized name
  reason: 'email' | 'name' | 'phone';
  clients: RegistryClient[];
}

export type RegistryTag =
  | 'Registered'
  | 'Profile Only'
  | 'Needs Client Row'
  | 'Needs Portal Link'
  | 'Duplicate Risk'
  | 'Orphan Data'
  | 'Reconciled'
  | 'Not Client';

export interface RegistryAuditEntry {
  id: string;
  action: string;
  details: any;
  record_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface RegistrySnapshot {
  loading: boolean;
  error: string | null;
  totals: {
    registeredClients: number;
    profiles: number;
    portalLinked: number;
    clientsWithoutPortal: number;
    profilesMissingClient: number;
    reportsOrphan: number;
    documentsOrphan: number;
    paymentsOrphan: number;
    agreementsOrphan: number;
    disputesOrphan: number;
    possibleDuplicates: number;
    totalPotentialIdentities: number;
    notClientCount: number;
    reconciledThisSession: number;
  };
  clients: RegistryClient[];
  missingProfiles: MissingProfile[];
  orphanIdentities: OrphanIdentity[];
  duplicates: DuplicateGroup[];
  needsPortalLink: RegistryClient[];
  recentAudit: RegistryAuditEntry[];
  /** Map of missing-profile user_id -> tags. */
  profileTags: Record<string, RegistryTag[]>;
  /** Map of client.id -> tags. */
  clientTags: Record<string, RegistryTag[]>;
  refresh: () => Promise<void>;
}

const norm = (s: string | null | undefined) =>
  (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

const composeName = (first?: string | null, last?: string | null) =>
  [first, last].filter(Boolean).join(' ').trim() || null;

export function useClientRegistry(): RegistrySnapshot {
  const [snap, setSnap] = useState<Omit<RegistrySnapshot, 'refresh'>>({
    loading: true,
    error: null,
    totals: {
      registeredClients: 0, profiles: 0, portalLinked: 0, clientsWithoutPortal: 0,
      profilesMissingClient: 0, reportsOrphan: 0, documentsOrphan: 0, paymentsOrphan: 0,
      agreementsOrphan: 0, disputesOrphan: 0, possibleDuplicates: 0, totalPotentialIdentities: 0,
      notClientCount: 0, reconciledThisSession: 0,
    },
    clients: [], missingProfiles: [], orphanIdentities: [], duplicates: [], needsPortalLink: [],
    recentAudit: [], profileTags: {}, clientTags: {},
  });

  const load = useCallback(async () => {
    setSnap((s) => ({ ...s, loading: true, error: null }));
    try {
      const sb: any = supabase;

      // 1. All clients
      const { data: clientRows, error: cErr } = await sb
        .from('clients')
        .select('id, full_name, email, phone, user_id, created_at, not_a_client, portal_status')
        .order('created_at', { ascending: false });
      if (cErr) throw cErr;
      const clients: RegistryClient[] = clientRows || [];

      // 2. All profiles
      const { data: profileRows } = await sb
        .from('profiles')
        .select('user_id, email, first_name, last_name, membership_type, created_at');
      const profiles = profileRows || [];

      // 3. Orphan owners from feature tables (NULL client_id OR client_id pointing nowhere)
      const [pmt, rpt, agr] = await Promise.all([
        sb.from('payment_records').select('user_id, client_id'),
        sb.from('credit_report_uploads').select('user_id, client_id, file_name'),
        sb.from('client_agreements').select('user_id, client_id, full_name'),
      ]);

      const clientIds = new Set(clients.map((c) => c.id));
      const clientByUserId = new Map<string, RegistryClient>();
      const clientByEmail = new Map<string, RegistryClient>();
      const clientByName = new Map<string, RegistryClient[]>();
      clients.forEach((c) => {
        if (c.user_id) clientByUserId.set(c.user_id, c);
        if (c.email) clientByEmail.set(c.email.toLowerCase(), c);
        const nk = norm(c.full_name);
        if (nk) {
          const arr = clientByName.get(nk) || [];
          arr.push(c);
          clientByName.set(nk, arr);
        }
      });

      // Missing profiles: profile.user_id has no client.user_id AND profile.email has no client.email
      const missingProfiles: MissingProfile[] = [];
      profiles.forEach((p: any) => {
        if (!p.user_id) return;
        if (clientByUserId.has(p.user_id)) return;
        const emailLc = (p.email || '').toLowerCase();
        if (emailLc && clientByEmail.has(emailLc)) return;
        // Suggest by normalized name (low confidence)
        const nm = composeName(p.first_name, p.last_name);
        const suggestion = nm ? clientByName.get(norm(nm))?.[0] : undefined;
        missingProfiles.push({
          user_id: p.user_id,
          email: p.email || null,
          first_name: p.first_name || null,
          last_name: p.last_name || null,
          membership_type: p.membership_type || null,
          created_at: p.created_at || null,
          suggested_client_id: suggestion?.id || null,
          suggested_client_label: suggestion?.full_name || null,
          suggested_confidence: suggestion ? 75 : 0,
        });
      });

      // Orphan identities: rows in feature tables whose user_id has no client
      const orphanMap = new Map<string, OrphanIdentity>();
      const bump = (src: OrphanIdentity['source'], userId: string | null, label: string | null) => {
        if (!userId) return;
        if (clientByUserId.has(userId)) return;
        const key = `${src}::${userId}`;
        const cur = orphanMap.get(key);
        if (cur) cur.count += 1;
        else orphanMap.set(key, { source: src, user_id: userId, label, count: 1 });
      };
      (pmt.data || []).forEach((r: any) => bump('payment_records', r.user_id, null));
      (rpt.data || []).forEach((r: any) => bump('credit_report_uploads', r.user_id, r.file_name || null));
      (agr.data || []).forEach((r: any) => bump('client_agreements', r.user_id, r.full_name || null));
      const orphanIdentities = Array.from(orphanMap.values());

      // Orphan record counts (rows whose client_id references a missing client)
      const countOrphanRecords = (rows: any[]) =>
        (rows || []).filter((r) => r.client_id && !clientIds.has(r.client_id)).length;
      const reportsOrphan = countOrphanRecords(rpt.data || []);
      const paymentsOrphan = countOrphanRecords(pmt.data || []);
      const agreementsOrphan = countOrphanRecords(agr.data || []);
      // documents/disputes counted via separate queries to keep payload small
      const [docOrph, dispOrph] = await Promise.all([
        sb.from('documents').select('client_id'),
        sb.from('dispute_letters').select('client_id'),
      ]);
      const documentsOrphan = countOrphanRecords(docOrph.data || []);
      const disputesOrphan = countOrphanRecords(dispOrph.data || []);

      // Possible duplicates inside clients table
      const dupGroups: DuplicateGroup[] = [];
      const emailBuckets = new Map<string, RegistryClient[]>();
      const nameBuckets = new Map<string, RegistryClient[]>();
      clients.forEach((c) => {
        if (c.not_a_client) return;
        if (c.email) {
          const k = c.email.toLowerCase();
          const a = emailBuckets.get(k) || [];
          a.push(c); emailBuckets.set(k, a);
        }
        const nk = norm(c.full_name);
        if (nk) {
          const a = nameBuckets.get(nk) || [];
          a.push(c); nameBuckets.set(nk, a);
        }
      });
      emailBuckets.forEach((arr, key) => { if (arr.length > 1) dupGroups.push({ key, reason: 'email', clients: arr }); });
      nameBuckets.forEach((arr, key) => {
        if (arr.length > 1 && !dupGroups.some((g) => g.clients.every((c) => arr.includes(c)))) {
          dupGroups.push({ key, reason: 'name', clients: arr });
        }
      });

      const needsPortalLink = clients.filter((c) => !c.user_id && !c.not_a_client);
      const profilesMissingClient = missingProfiles.length;
      const portalLinked = clients.filter((c) => !!c.user_id).length;
      const clientsWithoutPortal = clients.filter((c) => !c.user_id).length;
      const totalPotentialIdentities =
        clients.length + profilesMissingClient + orphanIdentities.length;

      setSnap({
        loading: false,
        error: null,
        totals: {
          registeredClients: clients.length,
          profiles: profiles.length,
          portalLinked,
          clientsWithoutPortal,
          profilesMissingClient,
          reportsOrphan,
          documentsOrphan,
          paymentsOrphan,
          agreementsOrphan,
          disputesOrphan,
          possibleDuplicates: dupGroups.length,
          totalPotentialIdentities,
        },
        clients,
        missingProfiles,
        orphanIdentities,
        duplicates: dupGroups,
        needsPortalLink,
      });
    } catch (e: any) {
      setSnap((s) => ({ ...s, loading: false, error: e?.message || 'Failed to load registry' }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { ...snap, refresh: load };
}

/** Persist a registry action to the audit log via the existing security_event RPC. */
export async function logRegistryAction(
  action: string,
  details: Record<string, any>,
  recordId?: string | null,
) {
  try {
    await (supabase as any).rpc('log_security_event', {
      p_action: `REGISTRY_${action}`,
      p_table_name: 'clients',
      p_record_id: recordId ?? null,
      p_details: details,
      p_security_level: 'info',
      p_risk_score: 1,
    });
  } catch (err) {
    console.warn('Registry audit log failed:', err);
  }
}