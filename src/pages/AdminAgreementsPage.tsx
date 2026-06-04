import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAgreementsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const client: any = supabase;
      const { data } = await client
        .from('client_agreements')
        .select('id, client_id, user_id, signed_at, created_at, agreement_type')
        .order('created_at', { ascending: false })
        .limit(200);
      setRows(data || []);
    })();
  }, []);
  return (
    <AdminShell title="Agreements" subtitle="Signed and pending client agreements">
      <Card>
        <CardHeader><CardTitle className="text-base">Agreements ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Client</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Signed</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.agreement_type || 'service'}</TableCell>
                  <TableCell className="font-mono text-xs">{r.client_id?.slice(0, 8) || '—'}</TableCell>
                  <TableCell>{r.signed_at ? <Badge>Signed</Badge> : <Badge variant="secondary">Pending</Badge>}</TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{r.signed_at ? new Date(r.signed_at).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}