import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Upload, ShieldCheck, Eye, Loader2 } from 'lucide-react';
import { LuxuryCard, LuxurySection, EyebrowLabel, EmptyState, StatusBadge } from '@/components/luxury';
import type { StatusKind } from '@/components/luxury';

type ReportRow = {
  id: string;
  file_name: string;
  file_path: string | null;
  report_type: string | null;
  bureau: string | null;
  created_at: string;
  analysis_status?: string | null;
  match_status?: string | null;
};

const ACCEPTED_SOURCES = [
  'Experian', 'Equifax', 'TransUnion',
  'IdentityIQ', 'SmartCredit', 'MyFreeScoreNow',
  'AnnualCreditReport.com',
];

function analysisBadge(r: ReportRow): { kind: StatusKind; label: string } {
  const s = (r.analysis_status || r.match_status || '').toLowerCase();
  if (s === 'matched' || s === 'completed' || s === 'complete') return { kind: 'completed', label: 'Analyzed' };
  if (s === 'needs_review') return { kind: 'needs-review', label: 'Needs Review' };
  if (s === 'failed' || s === 'error') return { kind: 'missing', label: 'Issue' };
  if (s === 'in_progress' || s === 'processing') return { kind: 'in-progress', label: 'Reviewing' };
  return { kind: 'uploaded', label: 'Uploaded' };
}

function ReportsInner() {
  const { clientId, userId } = useClient();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!clientId && !userId) { setLoading(false); return; }
      const client: any = supabase;
      let q = client.from('credit_report_uploads').select('*').order('created_at', { ascending: false });
      q = clientId ? q.eq('client_id', clientId) : q.eq('user_id', userId);
      const { data } = await q;
      if (alive) {
        setRows(data || []);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [clientId, userId]);

  const open = async (path: string) => {
    const { data } = await supabase.storage.from('credit-reports').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="space-y-10 md:space-y-14">
      {/* Header / instructions */}
      <LuxuryCard variant="midnight" elevated accent className="p-8 md:p-10">
        <EyebrowLabel withRule>Credit File</EyebrowLabel>
        <h2 className="lux-display text-3xl md:text-4xl text-ivory mt-3 leading-tight">
          Your credit report archive
        </h2>
        <p className="text-sm md:text-base text-ivory/75 mt-3 max-w-2xl">
          Uploaded reports are used to prepare a compliance-focused dispute strategy
          and a clearer picture of your credit profile. Results depend on investigation
          outcomes and are not guaranteed.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <Button asChild variant="premium">
            <Link to="/client/documents"><Upload className="h-4 w-4" /> Upload Credit Report</Link>
          </Button>
          <span className="inline-flex items-center gap-2 text-[11px] text-ivory/65">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure document submission
          </span>
        </div>
      </LuxuryCard>

      {/* Accepted sources */}
      <LuxurySection
        eyebrow="Accepted Sources"
        title="Reports we can review"
        description="Upload your most recent full report from any of the sources below. PDF format is preferred for fastest processing."
      >
        <LuxuryCard className="p-5 md:p-6">
          <div className="flex flex-wrap gap-2">
            {ACCEPTED_SOURCES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-[12px] font-medium text-foreground"
              >
                <FileText className="h-3 w-3 text-gold-deep" />
                {s}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Upload clear, complete PDF reports — partial screenshots may delay your profile review.
          </p>
        </LuxuryCard>
      </LuxurySection>

      {/* Reports list */}
      <LuxurySection eyebrow="Archive" title="Recent uploads" divider={false}>
        {loading ? (
          <LuxuryCard className="p-10 flex items-center justify-center text-muted-foreground gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your credit file…
          </LuxuryCard>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No credit report uploaded yet"
            description="Upload your most recent full report so your profile can be reviewed and a dispute strategy can be prepared."
            primary={{ label: 'Upload Credit Report', href: '/client/documents' }}
            secondary={{ label: 'Contact Concierge', href: '/client/messages' }}
          />
        ) : (
          <LuxuryCard className="p-2 md:p-3 overflow-hidden">
            <ul className="divide-y divide-border/60">
              {rows.map((r) => {
                const b = analysisBadge(r);
                return (
                  <li
                    key={r.id}
                    className="px-3 md:px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="min-w-0 flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-champagne text-gold-deep border border-gold-soft/30">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.file_name}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {(r.report_type || 'Report')} · {(r.bureau || 'Multi-bureau')} ·
                          {' '}{new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 self-end md:self-auto">
                      <StatusBadge status={b.kind} label={b.label} />
                      {r.file_path && (
                        <Button size="sm" variant="outline" onClick={() => open(r.file_path!)} className="gap-1.5">
                          <Eye className="h-3.5 w-3.5" /> View
                          <Download className="h-3.5 w-3.5 md:hidden" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </LuxuryCard>
        )}
      </LuxurySection>
    </div>
  );
}

export default function ClientReportsPage() {
  return (
    <ClientPortalLayout title="Credit File">
      <ReportsInner />
    </ClientPortalLayout>
  );
}