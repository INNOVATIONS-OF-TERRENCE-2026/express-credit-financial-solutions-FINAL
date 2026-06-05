import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { ClientPaymentWidget } from '@/components/payments/ClientPaymentWidget';
import { PaymentHistoryList } from '@/components/payments/PaymentHistoryList';
import { usePayments } from '@/hooks/usePayments';
import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { LuxuryCard, LuxurySection, LuxuryStat, EyebrowLabel } from '@/components/luxury';
import { Progress } from '@/components/ui/progress';
import { Wallet, CreditCard, ShieldCheck, Crown, CheckCircle2 } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

function AccountOverview() {
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

  if (loading || !row) {
    return (
      <LuxuryCard variant="midnight" elevated accent className="p-8 md:p-10">
        <p className="text-sm text-ivory/70">Loading your account…</p>
      </LuxuryCard>
    );
  }
  const expected = Number(row.expected_amount || 0);
  const paid = Number(row.paid_amount || 0);
  const balance = Math.max(0, expected - paid);
  const pct = expected > 0 ? Math.min(100, Math.round((paid / expected) * 100)) : 0;
  const planName = row.service_type || 'Elite Restoration Program';

  return (
    <div className="space-y-6">
      {/* Membership plan card — Amex-style */}
      <LuxuryCard variant="midnight" elevated accent className="p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-gradient-gold opacity-20 blur-3xl" aria-hidden />
        <div className="grid lg:grid-cols-5 gap-8 items-end relative">
          <div className="lg:col-span-3 space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold-soft">
              <Crown className="h-3 w-3" /> Membership Plan
            </span>
            <h2 className="lux-display text-3xl md:text-4xl text-ivory leading-tight">{planName}</h2>
            <p className="text-sm text-ivory/70 max-w-lg">
              Your account is in good standing. All concierge restoration services are active.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-soft/40 bg-ivory/5 px-3 py-1 text-[11px] font-medium text-ivory">
                <CheckCircle2 className="h-3 w-3 text-gold-soft" />
                Status: <span className="capitalize">{row.payment_status || 'active'}</span>
              </span>
              {row.payment_method && (
                <span className="inline-flex items-center gap-2 rounded-full border border-ivory/20 bg-ivory/5 px-3 py-1 text-[11px] text-ivory/80">
                  <CreditCard className="h-3 w-3" />
                  {row.payment_method}
                </span>
              )}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-ivory/15 bg-ivory/5 backdrop-blur p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ivory/60">Account Balance</p>
              <p className="lux-display text-4xl md:text-5xl text-ivory tabular-nums mt-1">{fmt(balance)}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-ivory/70">
                  <span>Plan paid</span>
                  <span className="tabular-nums text-gold-soft font-semibold">{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5 bg-ivory/10 [&>div]:bg-gradient-gold" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-ivory/10">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ivory/60">Paid</p>
                  <p className="lux-display text-lg text-ivory tabular-nums">{fmt(paid)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ivory/60">Expected</p>
                  <p className="lux-display text-lg text-ivory tabular-nums">{fmt(expected)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LuxuryCard>

      {/* Executive KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LuxuryStat eyebrow="Amount Paid" value={fmt(paid)} icon={Wallet} emphasize={paid > 0} />
        <LuxuryStat eyebrow="Remaining Balance" value={fmt(balance)} icon={CreditCard} />
        <LuxuryStat eyebrow="Account Status" value={<span className="capitalize">{row.payment_status || 'Active'}</span>} icon={ShieldCheck} />
        <LuxuryStat eyebrow="Plan" value={planName.split(' ')[0]} hint={planName} icon={Crown} />
      </div>

      {row.notes && row.visible_to_client && (
        <LuxuryCard variant="champagne" className="p-5">
          <EyebrowLabel>Note from your specialist</EyebrowLabel>
          <p className="text-sm text-foreground mt-2 whitespace-pre-wrap leading-relaxed">{row.notes}</p>
        </LuxuryCard>
      )}
    </div>
  );
}

function Inner() {
  const { records, replaceProof } = usePayments();
  return (
    <div className="space-y-12 md:space-y-16">
      <LuxurySection eyebrow="Account Services" title="Your private banking ledger" divider={false}>
        <AccountOverview />
      </LuxurySection>

      <LuxurySection
        eyebrow="Payment Methods"
        title="Submit a payment"
        description="Choose a supported payment rail. All proofs are encrypted and reviewed by your specialist."
      >
        <ClientPaymentWidget />
      </LuxurySection>

      <LuxurySection
        eyebrow="Recent Transactions"
        title="Payment History"
        description="A running ledger of every payment you've submitted to Express Credit."
      >
        <LuxuryCard className="p-4 md:p-6">
          <PaymentHistoryList records={records} onReplace={replaceProof} />
        </LuxuryCard>
      </LuxurySection>
    </div>
  );
}

export default function ClientPaymentsPage() {
  return <ClientPortalLayout title="Account Services"><Inner /></ClientPortalLayout>;
}