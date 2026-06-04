import { useEffect, useState } from 'react';
import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Download } from 'lucide-react';

function ReportsInner() {
  const { clientId, userId } = useClient();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      if (!clientId && !userId) return;
      const client: any = supabase;
      let q = client.from('credit_report_uploads').select('*').order('created_at', { ascending: false });
      q = clientId ? q.eq('client_id', clientId) : q.eq('user_id', userId);
      const { data } = await q;
      setRows(data || []);
    })();
  }, [clientId, userId]);

  const open = async (path: string) => {
    const { data } = await supabase.storage.from('credit-reports').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Your Credit Reports</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No reports uploaded yet.</p> : (
          <ul className="divide-y divide-border/40">
            {rows.map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.file_name}</p>
                  <p className="text-xs text-muted-foreground"><Badge variant="secondary">{r.report_type || 'report'}</Badge> · {r.bureau || '—'} · {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                {r.file_path && <Button size="sm" variant="ghost" onClick={() => open(r.file_path)}><Download className="h-4 w-4" /></Button>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientReportsPage() {
  return <ClientPortalLayout title="My Reports"><ReportsInner /></ClientPortalLayout>;
}