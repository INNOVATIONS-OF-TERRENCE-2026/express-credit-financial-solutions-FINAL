import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Download } from 'lucide-react';

export default function AdminReportsList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const client: any = supabase;
      const { data } = await client
        .from('credit_report_uploads')
        .select('id, file_name, file_path, report_type, bureau, analysis_status, created_at, client_id, user_id')
        .order('created_at', { ascending: false })
        .limit(200);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const open = async (path: string) => {
    const { data } = await supabase.storage.from('credit-reports').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <AdminShell title="Reports & Results" subtitle="Every uploaded credit report across clients">
      <Card>
        <CardHeader><CardTitle className="text-base">Uploaded Reports ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Bureau</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-xs truncate">{r.file_name}</TableCell>
                    <TableCell><Badge variant="secondary">{r.report_type || '—'}</Badge></TableCell>
                    <TableCell>{r.bureau || '—'}</TableCell>
                    <TableCell><Badge>{r.analysis_status}</Badge></TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {r.file_path && (
                        <Button size="sm" variant="ghost" onClick={() => open(r.file_path)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}