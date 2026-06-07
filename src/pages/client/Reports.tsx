import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Upload, ShieldCheck, Eye, Loader2, CheckCircle2 } from 'lucide-react';
import { LuxuryCard, LuxurySection, EyebrowLabel, EmptyState, StatusBadge } from '@/components/luxury';
import type { StatusKind } from '@/components/luxury';

type ReportRow = {
  id: string;
  file_name: string | null;
  storage_path: string | null;
  uploaded_file_url?: string | null;
  bureau: string | null;
  uploaded_at: string;
  fico_score: number | null;
  is_current: boolean | null;
  notes: string | null;
};

const ACCEPTED_SOURCES = [
  'Experian', 'Equifax', 'TransUnion',
  'IdentityIQ', 'SmartCredit', 'MyFreeScoreNow',
  'AnnualCreditReport.com',
];

function analysisBadge(r: ReportRow): { kind: StatusKind; label: string } {
  if (r.is_current) return { kind: 'completed', label: 'Current' };
  return { kind: 'uploaded', label: 'Archived' };
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
      try {
        let q = client
          .from('portal_credit_reports')
          .select('id,file_name,storage_path,uploaded_file_url,bureau,uploaded_at,fico_score,is_current,notes')
          .order('uploaded_at', { ascending: false });
        q = clientId ? q.eq('client_id', clientId) : q.eq('user_id', userId);
        const { data, error } = await q;
        if (error) throw error;
        if (alive) setRows(Array.isArray(data) ? data : []);
      } catch (viewErr) {
        console.warn('portal_credit_reports unavailable, falling back to credit_report_uploads:', viewErr);
        try {
          let fb = client
            .from('credit_report_uploads')
            .select('id,file_name,file_path,bureau,uploaded_at')
            .order('uploaded_at', { ascending: false });
          fb = clientId ? fb.eq('client_id', clientId) : fb.eq('user_id', userId);
          const { data: fbRows } = await fb;
          if (alive) {
            setRows((fbRows || []).map((r: any) => ({
              id: r.id,
              file_name: r.file_name ?? null,
              storage_path: r.file_path ?? null,
              uploaded_file_url: null,
              bureau: r.bureau ?? null,
              uploaded_at: r.uploaded_at,
              fico_score: null,
              is_current: false,
              notes: null,
            })));
          }
        } catch (fbErr) {
          console.error('Unable to load credit reports:', fbErr);
          if (alive) setRows([]);
        }
      } finally {
        if (alive) setLoading(false);
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
      <LuxuryCard variant="midnight" elevated accent className="p-8 md:p-10">
        <EyebrowLabel withRule>Credit File</EyebrowLabel>
        <h2 className="lux-display text-3xl md:text-4xl text-ivory mt-3 leading-tight">
          Your committed credit report archive
        </h2>
        <p className="text-sm md:text-base text-ivory/75 mt-3 max-w-2xl">
          This page shows reports that have passed admin review and were committed to your portal history.
          Results depend on investigation outcomes and are not guaranteed.
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
            Uploaded reports appear here after admin extraction review and commit.
          </p>
        </LuxuryCard>
      </LuxurySection>

      <LuxurySection eyebrow="Archive" title="Committed report history" divider={false}>
        {loading ? (
          <LuxuryCard className="p-10 flex items-center justify-center text-muted-foreground gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your committed credit file…
          </LuxuryCard>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No committed report yet"
            description="Your reviewed reports will appear here after your specialist commits them to your portal history."
            primary={{ label: 'Upload Credit Report', href: '/client/documents' }}
            secondary={{ label: 'Contact Concierge', href: '/client/messages' }}
          />
        ) : (
          <LuxuryCard className="p-2 md:p-3 overflow-hidden">
            <ul className="divide-y divide-border/60">
              {rows.map((r) => {
                const b = analysisBadge(r);
                const filePath = r.storage_path || r.uploaded_file_url || null;
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
                        <p className="text-sm font-medium text-foreground truncate">{r.file_name || `${r.bureau || 'Credit'} report`}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {(r.bureau || 'Multi-bureau')} · Score {r.fico_score || '—'} ·{' '}
                          {new Date(r.uploaded_at).toLocaleDateString()}
                        </p>
                        {r.notes && <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{r.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 self-end md:self-auto">
                      <StatusBadge status={b.kind} label={b.label} />
                      {r.is_current && <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Current report" />}
                      {filePath && (
                        <Button size="sm" variant="outline" onClick={() => open(filePath)} className="gap-1.5">
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
