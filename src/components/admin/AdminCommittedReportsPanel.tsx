import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

type CommittedReport = {
  id: string;
  file_name: string | null;
  bureau: string | null;
  fico_score: number | null;
  uploaded_at: string;
  is_current: boolean | null;
  negative_items: string[] | null;
  storage_path: string | null;
  notes: string | null;
};

export function AdminCommittedReportsPanel({ clientId }: { clientId: string }) {
  const [reports, setReports] = useState<CommittedReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('credit_reports')
      .select('id,file_name,bureau,fico_score,uploaded_at,is_current,negative_items,storage_path,notes')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Unable to load committed reports:', error);
      setReports([]);
    } else {
      setReports((data || []) as CommittedReport[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [clientId]);

  const latest = (bureau: string) => reports.find((report) => report.bureau === bureau && report.is_current) || reports.find((report) => report.bureau === bureau);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Committed Report Sync</CardTitle>
              <CardDescription className="text-xs">
                These committed records power the client dashboard, results page, and client report archive.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {(['Experian', 'Equifax', 'TransUnion'] as const).map((bureau) => {
            const report = latest(bureau);
            return (
              <div key={bureau} className="rounded-md border border-border/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{bureau}</p>
                  {report?.is_current && <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Current</Badge>}
                </div>
                <p className="mt-2 text-2xl font-black tabular-nums">{report?.fico_score || '—'}</p>
                <p className="mt-1 text-xs text-muted-foreground truncate">{report?.file_name || 'No committed report'}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Committed Report History</CardTitle>
          <CardDescription className="text-xs">Portal-visible reports created through the approval and commit pipeline.</CardDescription>
        </CardHeader>
        <CardContent className="rounded-md border border-border/50 divide-y divide-border/40">
          {loading ? (
            <p className="p-3 text-xs text-muted-foreground">Loading committed reports…</p>
          ) : reports.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">No committed reports yet.</p>
          ) : reports.map((report) => (
            <div key={report.id} className="p-2 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{report.file_name || 'Committed report'}</span>
                <Badge variant="outline" className="text-[10px]">{report.bureau || 'Unknown'}</Badge>
                <Badge variant="outline" className="text-[10px]">Score {report.fico_score || '—'}</Badge>
                {report.is_current && <Badge className="bg-emerald-600 text-[10px]">Current</Badge>}
              </div>
              <span className="text-muted-foreground shrink-0">{new Date(report.uploaded_at).toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
