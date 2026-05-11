import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, History, RotateCcw, Loader2 } from 'lucide-react';

interface Props {
  clientId: string;
}

interface ReportRow {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  is_current: boolean;
  version: number;
  analysis_status: string | null;
}

export function CreditReportVersionHistory({ clientId }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('credit_reports')
      .select('id,file_name,file_path,uploaded_at,is_current,version,analysis_status')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false });
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { if (clientId) fetch(); }, [clientId]);

  const download = async (r: ReportRow) => {
    setBusyId(r.id);
    try {
      const { data, error } = await supabase.storage.from('credit-reports').createSignedUrl(r.file_path, 300);
      if (error || !data?.signedUrl) throw error || new Error('No signed URL');
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      toast({ title: 'Download failed', description: err.message || 'Could not get download URL', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const restore = async (r: ReportRow) => {
    if (!confirm(`Restore "${r.file_name}" as the current credit report? Previous versions remain on file.`)) return;
    setBusyId(r.id);
    try {
      // Flip current flag: clear all, set this one. Inserts/uploads can't undo because version triggers run on INSERT only.
      const { error: clearErr } = await supabase.from('credit_reports').update({ is_current: false }).eq('client_id', clientId);
      if (clearErr) throw clearErr;
      const { error: setErr } = await supabase.from('credit_reports').update({ is_current: true }).eq('id', r.id);
      if (setErr) throw setErr;
      await supabase.rpc('log_security_event', {
        p_action: 'CREDIT_REPORT_VERSION_RESTORED',
        p_table_name: 'credit_reports',
        p_record_id: r.id,
        p_details: { client_id: clientId, restored_version: r.version, file_name: r.file_name },
        p_security_level: 'info',
        p_risk_score: 1,
      });
      toast({ title: 'Version restored', description: `${r.file_name} is now current.` });
      fetch();
    } catch (err: any) {
      toast({ title: 'Restore failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Credit Report Version History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-6 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No credit reports uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map(r => (
              <li key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">{r.file_name}</span>
                    <Badge variant="outline" className="text-[10px]">v{r.version}</Badge>
                    {r.is_current && <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-[10px]">Current</Badge>}
                    {r.analysis_status && <Badge variant="outline" className="text-[10px]">{r.analysis_status}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.uploaded_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => download(r)} disabled={busyId === r.id} className="h-9">
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                  {!r.is_current && (
                    <Button size="sm" variant="default" onClick={() => restore(r)} disabled={busyId === r.id} className="h-9">
                      <RotateCcw className="h-4 w-4 mr-1" /> Restore
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}