import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { ClientPaymentWidget } from '@/components/payments/ClientPaymentWidget';
import { PaymentHistoryList } from '@/components/payments/PaymentHistoryList';
import { usePayments } from '@/hooks/usePayments';
import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

function ServiceBalanceCard() {
  const { clientId } = useClient();
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const sb: any = supabase;
      let { data } = await sb
        .from('client_payment_summary')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      if (!data) {
        const r = await sb.rpc('ensure_payment_summary', { p_client_id: clientId });
        data = r.data;
      }
      if (alive) { setRow(data); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [clientId]);

  if (loading || !row) return null;
  const expected = Number(row.expected_amount || 0);
  const paid = Number(row.paid_amount || 0);
  const balance = expected - paid;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Service Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Service</p><p className="font-medium">{row.service_type || 'Credit Repair'}</p></div>
          <div><p className="text-xs text-muted-foreground">Expected</p><p className="font-medium">{fmt(expected)}</p></div>
          <div><p className="text-xs text-muted-foreground">Paid</p><p className="font-medium text-emerald-500">{fmt(paid)}</p></div>
          <div><p className="text-xs text-muted-foreground">Balance Due</p><p className={`font-medium ${balance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{fmt(balance)}</p></div>
          <div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium capitalize">{row.payment_status}</p></div>
          {row.payment_method && <div><p className="text-xs text-muted-foreground">Method</p><p className="font-medium">{row.payment_method}</p></div>}
          {row.notes && row.visible_to_client && (
            <div className="col-span-full"><p className="text-xs text-muted-foreground">Notes</p><p className="font-medium whitespace-pre-wrap">{row.notes}</p></div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Inner() {
  const { records, replaceProof } = usePayments();
  return (
    <div className="space-y-4">
      <ServiceBalanceCard />
      <ClientPaymentWidget />
      <PaymentHistoryList records={records} onReplace={replaceProof} />
    </div>
  );
}

export default function ClientPaymentsPage() {
  return <ClientPortalLayout title="Account & Billing"><Inner /></ClientPortalLayout>;
}