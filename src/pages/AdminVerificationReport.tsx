import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Download, RefreshCcw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

type Row = {
  client_id: string;
  full_name: string;
  email: string | null;
  user_id: string | null;
  status: string | null;
  portal_status: string | null;
  membership_plan: string | null;
  payment_status: string | null;
  service_status: string | null;
  access_services_enabled: boolean | null;
  not_a_client: boolean | null;
  portal_linked: boolean;
  profile_email_match: boolean;
  documents_count: number;
  archive_count: number;
  reports_count: number;
  disputes_count: number;
  expected_amount: number | null;
  paid_amount: number | null;
  payment_summary_status: string | null;
  payment_summary_exists: boolean;
  payment_amount_ok: boolean;
  payment_user_link_ok: boolean;
  experian_score: number | null;
  equifax_score: number | null;
  transunion_score: number | null;
  score_updated_at: string | null;
  has_score: boolean;
};

function Dot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  if (ok) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (warn) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-rose-500" />;
}

export default function AdminVerificationReport() {
  const [filter, setFilter] = useState('');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [includeNonClient, setIncludeNonClient] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['verification-report'],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await (supabase as any)
        .from('v_client_verification_report')
        .select('*')
        .order('full_name', { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = useMemo(() => {
    let r = data ?? [];
    if (!includeNonClient) r = r.filter((x) => !x.not_a_client);
    if (filter.trim()) {
      const q = filter.toLowerCase();
      r = r.filter(
        (x) =>
          (x.full_name ?? '').toLowerCase().includes(q) ||
          (x.email ?? '').toLowerCase().includes(q),
      );
    }
    if (onlyIssues) {
      r = r.filter(
        (x) =>
          !x.portal_linked ||
          !x.payment_summary_exists ||
          !x.payment_amount_ok ||
          !x.payment_user_link_ok ||
          !x.has_score,
      );
    }
    return r;
  }, [data, filter, onlyIssues, includeNonClient]);

  const totals = useMemo(() => {
    const base = (data ?? []).filter((x) => includeNonClient || !x.not_a_client);
    return {
      total: base.length,
      linked: base.filter((x) => x.portal_linked).length,
      paymentOk: base.filter((x) => x.payment_summary_exists && x.payment_amount_ok).length,
      paymentUserOk: base.filter((x) => x.payment_user_link_ok).length,
      withScores: base.filter((x) => x.has_score).length,
      withDocs: base.filter((x) => x.documents_count + x.archive_count > 0).length,
      withReports: base.filter((x) => x.reports_count > 0).length,
      emailCandidate: base.filter((x) => !x.portal_linked && x.profile_email_match).length,
    };
  }, [data, includeNonClient]);

  const exportCsv = () => {
    if (!rows.length) return;
    const header = [
      'client_id','full_name','email','user_id','status','portal_status','membership_plan',
      'payment_status','service_status','access_services_enabled','not_a_client',
      'portal_linked','profile_email_match','documents_count','archive_count',
      'reports_count','disputes_count','expected_amount','paid_amount',
      'payment_summary_exists','payment_amount_ok','payment_user_link_ok',
      'experian_score','equifax_score','transunion_score','has_score','score_updated_at',
    ];
    const esc = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [header.join(',')]
      .concat(rows.map((r) => header.map((h) => esc((r as any)[h])).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <SidebarInset>
          <header className="h-14 flex items-center gap-3 border-b border-border/50 px-4">
            <SidebarTrigger />
            <h1 className="text-base font-semibold">Verification Report</h1>
            <span className="text-xs text-muted-foreground">
              Post-execution audit · portal links, documents, payments, scores
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <Button size="sm" onClick={exportCsv} disabled={!rows.length}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
          </header>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <Kpi label="Total Clients" value={totals.total} />
              <Kpi label="Portal Linked" value={totals.linked} tone="text-emerald-500" />
              <Kpi label="Email Match Pending" value={totals.emailCandidate} tone="text-amber-500" />
              <Kpi label="Payment Row OK" value={totals.paymentOk} tone="text-emerald-500" />
              <Kpi label="Payment User Link OK" value={totals.paymentUserOk} tone="text-emerald-500" />
              <Kpi label="With Scores" value={totals.withScores} />
              <Kpi label="With Documents" value={totals.withDocs} />
              <Kpi label="With Reports" value={totals.withReports} />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Per-Client Audit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Input
                    placeholder="Search name or email..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm h-8"
                  />
                  <label className="text-xs flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={onlyIssues}
                      onChange={(e) => setOnlyIssues(e.target.checked)}
                    />
                    Issues only
                  </label>
                  <label className="text-xs flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={includeNonClient}
                      onChange={(e) => setIncludeNonClient(e.target.checked)}
                    />
                    Include "not a client"
                  </label>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Showing {rows.length} {isLoading && '(loading...)'}
                  </span>
                </div>
                <div className="rounded-md border border-border/50 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Portal</TableHead>
                        <TableHead className="text-center">Docs/Arch</TableHead>
                        <TableHead className="text-center">Reports</TableHead>
                        <TableHead className="text-center">Pay Row</TableHead>
                        <TableHead className="text-center">$600?</TableHead>
                        <TableHead className="text-center">User Match</TableHead>
                        <TableHead className="text-center">Scores</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.client_id}>
                          <TableCell>
                            <div className="font-medium text-sm">{r.full_name}</div>
                            <div className="text-xs text-muted-foreground">{r.email || '—'}</div>
                          </TableCell>
                          <TableCell>
                            {r.portal_linked ? (
                              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Linked</Badge>
                            ) : r.profile_email_match ? (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30">Email Match</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Unlinked</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs tabular-nums">
                            {r.documents_count}/{r.archive_count}
                          </TableCell>
                          <TableCell className="text-center text-xs tabular-nums">{r.reports_count}</TableCell>
                          <TableCell className="text-center"><Dot ok={r.payment_summary_exists} /></TableCell>
                          <TableCell className="text-center"><Dot ok={r.payment_amount_ok} /></TableCell>
                          <TableCell className="text-center"><Dot ok={r.payment_user_link_ok} warn={!r.portal_linked} /></TableCell>
                          <TableCell className="text-center"><Dot ok={r.has_score} warn /></TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {[r.status, r.membership_plan, r.service_status].filter(Boolean).join(' · ') || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!rows.length && !isLoading && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                            No rows match the current filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums ${tone ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}