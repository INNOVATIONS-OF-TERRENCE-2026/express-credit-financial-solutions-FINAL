import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MatchStatusBadge, MatchStatus } from '@/components/MatchStatusBadge';

type Row = {
  id: string;
  file_name: string;
  client_id: string | null;
  uploaded_at: string;
  match_status: MatchStatus;
  match_score: number | null;
  match_checked_at: string | null;
  match_error: string | null;
  client?: { full_name: string | null } | null;
};

export function RecentReportMatches({ clientId }: { clientId?: string | null }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const c: any = supabase;
    let q = c.from('credit_report_uploads')
      .select('id,file_name,client_id,uploaded_at,match_status,match_score,match_checked_at,match_error,client:clients(full_name)')
      .order('uploaded_at', { ascending: false })
      .limit(20);
    if (clientId) q = q.eq('client_id', clientId);
    const { data } = await q;
    setRows((data as Row[]) || []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const rerun = async (row: Row) => {
    setRunning(row.id);
    try {
      const { data, error } = await supabase.functions.invoke('match-report-to-client', {
        body: { report_id: row.id, source: 'credit_report_uploads' },
      });
      if (error) throw error;
      const res = data as { match_status?: string; match_error?: string | null };
      toast({
        title: `Match: ${res.match_status ?? 'done'}`,
        description: res.match_error ?? 'Status updated.',
        variant: res.match_status === 'failed' ? 'destructive' : 'default',
      });
      await load();
    } catch (e: any) {
      toast({ title: 'Re-run failed', description: e?.message ?? 'Try again', variant: 'destructive' });
    } finally {
      setRunning(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Recent Report Matches</CardTitle>
          <CardDescription>Status from the match-report-to-client engine.</CardDescription>
        </div>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No uploads yet.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {rows.map((r) => (
              <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.file_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.client?.full_name ?? 'Unlinked'} · uploaded {new Date(r.uploaded_at).toLocaleString()}
                  </p>
                  <div className="mt-1">
                    <MatchStatusBadge
                      status={r.match_status}
                      score={r.match_score}
                      checkedAt={r.match_checked_at}
                      error={r.match_error}
                    />
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => rerun(r)} disabled={running === r.id}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${running === r.id ? 'animate-spin' : ''}`} />
                  Run match again
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}