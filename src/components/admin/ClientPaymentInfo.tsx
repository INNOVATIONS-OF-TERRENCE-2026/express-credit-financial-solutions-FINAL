import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  userId: string | null | undefined;
  variant?: 'inline' | 'block';
}

export function ClientPaymentInfo({ userId, variant = 'inline' }: Props) {
  const [payment, setPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!userId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('payment_records')
        .select('id,payment_amount,reviewed_at,submitted_at,payment_status,payment_method')
        .eq('user_id', userId)
        .eq('payment_status', 'approved')
        .order('reviewed_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (active) { setPayment(data); setLoading(false); }
    })();
    return () => { active = false; };
  }, [userId]);

  if (loading) return <span className="text-xs text-muted-foreground">…</span>;
  if (!payment) return <Badge variant="outline" className="text-[10px]">No payment</Badge>;

  const date = new Date(payment.reviewed_at || payment.submitted_at || '').toLocaleDateString();
  const ref = String(payment.id).slice(0, 8);

  if (variant === 'block') {
    return (
      <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-emerald-500">
          <CheckCircle2 className="h-4 w-4" /> Paid in Full · ${Number(payment.payment_amount).toFixed(0)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Payment Date: <span className="text-foreground font-medium">{date}</span></div>
        <div className="text-[11px] font-mono text-muted-foreground break-all">Ref: {payment.id}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-xs leading-tight">
      <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
        <CheckCircle2 className="h-3 w-3" />${Number(payment.payment_amount).toFixed(0)} · {date}
      </span>
      <span className="font-mono text-muted-foreground text-[10px]" title={payment.id}>Ref {ref}</span>
    </div>
  );
}