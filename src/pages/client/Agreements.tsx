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
      let q = client.from('client_agreements').select('*').order('created_at', { ascending: false });
      q = clientId ? q.eq('client_id', clientId) : q.eq('user_id', userId);
      const { data } = await q;
      setRows(data || []);
    })();
  }, [clientId, userId]);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Your Agreements</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No agreements yet.</p> : (
          <ul className="divide-y divide-border/40">
            {rows.map((r) => (
              <li key={r.id} className="py-2 flex justify-between">
                <span className="text-sm">{r.agreement_type || 'Service Agreement'}</span>
                {r.signed_at ? <Badge>Signed {new Date(r.signed_at).toLocaleDateString()}</Badge> : <Badge variant="secondary">Pending signature</Badge>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
export default function ClientAgreementsPage() {
  return <ClientPortalLayout title="Agreement Center"><Inner /></ClientPortalLayout>;
}