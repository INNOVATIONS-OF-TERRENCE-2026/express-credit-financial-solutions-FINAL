import { useEffect, useMemo, useState } from 'react';
import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Gavel, Info, MessageSquare, Loader2, FileText } from 'lucide-react';
import { LuxuryCard, LuxurySection, EyebrowLabel, EmptyState, StatusBadge } from '@/components/luxury';
import type { StatusKind } from '@/components/luxury';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type DisputeRow = {
  id: string;
  creditor_name: string | null;
  issue_type: string | null;
  case_status: string | null;
  generated_letter: any;
  created_at: string;
  bureau?: string | null;
};

function statusToBadge(s: string | null, hasLetter: boolean): { kind: StatusKind; label: string } {
  const v = (s || '').toLowerCase();
  if (['approved', 'exported', 'completed', 'closed'].includes(v)) return { kind: 'completed', label: v.charAt(0).toUpperCase() + v.slice(1) };
  if (['needs_admin_review', 'needs_review', 'validation_failed'].includes(v)) return { kind: 'needs-review', label: 'Needs Review' };
  if (['draft_generated', 'extracted', 'validation_passed', 'in_progress'].includes(v)) return { kind: 'in-progress', label: 'In Progress' };
  if (['documents_missing'].includes(v)) return { kind: 'missing', label: 'Docs Missing' };
  if (v) return { kind: 'pending', label: v.replace(/_/g, ' ') };
  return hasLetter ? { kind: 'completed', label: 'Letter Ready' } : { kind: 'pending', label: 'Pending' };
}

function Inner() {
  const { clientId, userId } = useClient();
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!clientId && !userId) { setLoading(false); return; }
      const client: any = supabase;
      let q = client.from('dispute_letters').select('*').order('created_at', { ascending: false });
      q = clientId ? q.eq('client_id', clientId) : q.eq('user_id', userId);
      const { data } = await q;
      if (alive) {
        setRows(data || []);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [clientId, userId]);

  const summary = useMemo(() => {
    const total = rows.length;
    const inProgress = rows.filter((r) => statusToBadge(r.case_status, !!r.generated_letter).kind === 'in-progress').length;
    const completed = rows.filter((r) => statusToBadge(r.case_status, !!r.generated_letter).kind === 'completed').length;
    const needsReview = rows.filter((r) => statusToBadge(r.case_status, !!r.generated_letter).kind === 'needs-review').length;
    return { total, inProgress, completed, needsReview };
  }, [rows]);

  return (
    <div className="space-y-10 md:space-y-14">
      {/* Hero */}
      <LuxuryCard variant="midnight" elevated accent className="p-8 md:p-10">
        <div className="grid lg:grid-cols-3 gap-6 items-end">
          <div className="lg:col-span-2 space-y-3">
            <EyebrowLabel withRule>Dispute Center</EyebrowLabel>
            <h2 className="lux-display text-3xl md:text-4xl text-ivory leading-tight">
              Your active dispute workflow
            </h2>
            <p className="text-sm md:text-base text-ivory/75 max-w-2xl">
              Track every dispute letter prepared on your behalf, the bureau it was sent to,
              and where each case stands in the review cycle.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:justify-self-end w-full lg:w-auto">
            <div className="rounded-xl border border-ivory/15 bg-ivory/5 px-3 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ivory/60">Total</p>
              <p className="lux-display text-ivory text-2xl tabular-nums mt-1">{summary.total}</p>
            </div>
            <div className="rounded-xl border border-ivory/15 bg-ivory/5 px-3 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ivory/60">In Progress</p>
              <p className="lux-display text-ivory text-2xl tabular-nums mt-1">{summary.inProgress}</p>
            </div>
            <div className="rounded-xl border border-ivory/15 bg-ivory/5 px-3 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ivory/60">Completed</p>
              <p className="lux-display text-ivory text-2xl tabular-nums mt-1">{summary.completed}</p>
            </div>
          </div>
        </div>
      </LuxuryCard>

      {/* Compliance notice */}
      <LuxuryCard className="p-5 md:p-6 flex gap-4 items-start border-gold-soft/40">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-champagne text-gold-deep border border-gold-soft/30">
          <Info className="h-4 w-4" />
        </span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Dispute preparation is based on information you provide and applicable consumer
          reporting rights. Results are not guaranteed and depend on investigation outcomes
          by the credit bureaus and data furnishers.
        </p>
      </LuxuryCard>

      {/* Dispute list */}
      <LuxurySection eyebrow="Cases" title="Dispute letters on file" divider={false}>
        {loading ? (
          <LuxuryCard className="p-10 flex items-center justify-center text-muted-foreground gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading dispute cases…
          </LuxuryCard>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="No dispute cases yet"
            description="Once your credit report is uploaded and reviewed, dispute letters prepared on your behalf will appear here."
            primary={{ label: 'Upload Credit Report', href: '/client/documents' }}
            secondary={{ label: 'Message Concierge', href: '/client/messages' }}
          />
        ) : (
          <LuxuryCard className="p-2 md:p-3 overflow-hidden">
            <ul className="divide-y divide-border/60">
              {rows.map((r) => {
                const b = statusToBadge(r.case_status, !!r.generated_letter);
                return (
                  <li
                    key={r.id}
                    className="px-3 md:px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="min-w-0 flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-midnight border border-border">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {r.creditor_name || 'Unspecified creditor'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.issue_type || 'Investigation request'}
                          {r.bureau ? ` · ${r.bureau}` : ''} ·{' '}
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="self-end md:self-auto">
                      <StatusBadge status={b.kind} label={b.label} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </LuxuryCard>
        )}
      </LuxurySection>

      <LuxuryCard variant="champagne" className="p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <EyebrowLabel>Need help?</EyebrowLabel>
          <h4 className="lux-display text-lg mt-1 text-foreground">Questions about a specific case?</h4>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Your concierge can walk you through current dispute stages and what to expect next.
          </p>
        </div>
        <Button asChild variant="premium">
          <Link to="/client/messages"><MessageSquare className="h-4 w-4" /> Message Concierge</Link>
        </Button>
      </LuxuryCard>
    </div>
  );
}

export default function ClientDisputesPage() {
  return (
    <ClientPortalLayout title="Dispute Center">
      <Inner />
    </ClientPortalLayout>
  );
}