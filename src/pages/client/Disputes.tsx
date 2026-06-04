import { useEffect, useState } from 'react';
import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

function Inner() {
  const { clientId, userId } = useClient();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      if (!clientId && !userId) return;
      const client: any = supabase;
      let q = client.from('dispute_letters').select('*').order('created_at', { ascending: false });
      q = clientId ? q.eq('client_id', clientId) : q.eq('user_id', userId);
      const { data } = await q;
      setRows(data || []);
    })();
  }, [clientId, userId]);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Your Disputes</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No disputes filed yet.</p> : (
          <ul className="divide-y divide-border/40">
            {rows.map((r) => (
              <li key={r.id} className="py-2 flex justify-between">
                <div><p className="text-sm font-medium">{r.creditor_name}</p><p className="text-xs text-muted-foreground">{r.issue_type}</p></div>
                <Badge variant="secondary">{r.case_status || (r.generated_letter ? 'completed' : 'pending')}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
export default function ClientDisputesPage() {
  return <ClientPortalLayout title="Disputes & Letters"><Inner /></ClientPortalLayout>;
}