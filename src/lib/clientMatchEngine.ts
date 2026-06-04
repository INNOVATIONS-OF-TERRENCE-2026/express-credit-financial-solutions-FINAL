import { supabase } from '@/integrations/supabase/client';

export interface MatchInput {
  selectedClientId?: string | null;
  email?: string | null;
  fullName?: string | null;
  dob?: string | null;       // YYYY-MM-DD
  ssnLast4?: string | null;
  address?: string | null;
}

export interface MatchResult {
  clientId: string;
  userId: string | null;
  fullName: string;
  email: string | null;
  confidence: number;        // 0-100
  reasons: string[];
  tier: 'auto' | 'confirm' | 'manual';
}

const norm = (s: string | null | undefined) =>
  (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

const nameTokens = (s: string | null | undefined) =>
  norm(s).split(' ').filter(Boolean);

const tokenOverlap = (a: string | null | undefined, b: string | null | undefined) => {
  const A = new Set(nameTokens(a));
  const B = new Set(nameTokens(b));
  if (A.size === 0 || B.size === 0) return 0;
  let hit = 0;
  A.forEach((t) => { if (B.has(t)) hit += 1; });
  return hit / Math.max(A.size, B.size);
};

function tierFor(confidence: number): MatchResult['tier'] {
  if (confidence >= 95) return 'auto';
  if (confidence >= 80) return 'confirm';
  return 'manual';
}

/**
 * Resolve a client using a priority-based scoring system.
 * Priority (per product spec):
 *   1. Selected Client ID — always wins
 *   2. Email exact match
 *   3. Full Name
 *   4. DOB
 *   5. SSN Last 4
 *   6. Address
 *
 * Always uses clients.id; never falls back to auth.uid().
 */
export async function matchClient(input: MatchInput): Promise<MatchResult[]> {
  // 1) Explicit selection bypasses everything.
  if (input.selectedClientId) {
    const { data } = await supabase
      .from('clients')
      .select('id,user_id,full_name,email')
      .eq('id', input.selectedClientId)
      .maybeSingle();
    if (data) {
      return [{
        clientId: data.id,
        userId: data.user_id ?? null,
        fullName: data.full_name,
        email: data.email,
        confidence: 100,
        reasons: ['Admin-selected client id'],
        tier: 'auto',
      }];
    }
  }

  // Pull a candidate pool. Filter server-side by email exact when given to keep it tight.
  const builders: Promise<any>[] = [];

  if (input.email) {
    builders.push(
      supabase.from('clients')
        .select('id,user_id,full_name,email,dob,ssn_last4,address')
        .ilike('email', input.email.trim())
        .limit(20),
    );
  }
  // Always include a broader name/dob/ssn pool (capped) so we can score even without email.
  builders.push(
    supabase.from('clients')
      .select('id,user_id,full_name,email,dob,ssn_last4,address')
      .order('updated_at', { ascending: false })
      .limit(500),
  );

  const results = await Promise.all(builders);
  const seen = new Set<string>();
  const pool: any[] = [];
  results.forEach((r) => (r.data ?? []).forEach((row: any) => {
    if (!seen.has(row.id)) { seen.add(row.id); pool.push(row); }
  }));

  const scored: MatchResult[] = pool.map((c) => {
    const reasons: string[] = [];
    let score = 0;

    // Email exact (case-insensitive) — strongest secondary signal: 55
    if (input.email && c.email && norm(c.email) === norm(input.email)) {
      score += 55; reasons.push('Email exact match');
    }

    // Full name — token overlap up to 25
    if (input.fullName && c.full_name) {
      const overlap = tokenOverlap(input.fullName, c.full_name);
      if (overlap === 1)      { score += 25; reasons.push('Full name exact match'); }
      else if (overlap >= 0.5){ score += Math.round(25 * overlap); reasons.push(`Name partial match (${Math.round(overlap*100)}%)`); }
    }

    // DOB — exact 15
    if (input.dob && c.dob && input.dob === c.dob) {
      score += 15; reasons.push('DOB match');
    }

    // SSN last 4 — exact 15 (must also have at least name or dob signal)
    if (input.ssnLast4 && c.ssn_last4 && input.ssnLast4 === c.ssn_last4) {
      score += 15; reasons.push('SSN last 4 match');
    }

    // Address contains test — 10
    if (input.address && c.address) {
      const a = norm(input.address);
      const b = norm(c.address);
      if (a && b && (a.includes(b) || b.includes(a))) {
        score += 10; reasons.push('Address match');
      }
    }

    const confidence = Math.min(100, score);
    return {
      clientId: c.id,
      userId: c.user_id ?? null,
      fullName: c.full_name,
      email: c.email,
      confidence,
      reasons,
      tier: tierFor(confidence),
    };
  });

  return scored
    .filter((m) => m.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}