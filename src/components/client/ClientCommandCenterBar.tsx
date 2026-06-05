import { useClient } from '@/contexts/ClientContext';
import { useClientPortalData } from '@/hooks/useClientPortalData';
import { computeReadiness } from '@/lib/mortgageReadiness';
import { ShieldCheck, Sparkles, CalendarCheck2, Activity, Users, Crown } from 'lucide-react';
import { DeltaChip } from '@/components/luxury/DeltaChip';

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Premium "Client Command Center" header bar shown under the app chrome
 * on every client portal page. Echoes Experian Premium / Amex Platinum:
 * personalized greeting, membership tier, program status, current round,
 * assigned team, last-updated, score delta.
 */
export function ClientCommandCenterBar() {
  const { clientId, userId, fullName, email } = useClient();
  const d = useClientPortalData(clientId, userId);
  if (d.loading) return null;

  const firstName = (fullName || email || 'Client').split(' ')[0];
  const lastUpdated = d.client?.updated_at ?? d.client?.last_updated ?? null;
  const round = d.currentDisputeRound || 0;
  const readiness = computeReadiness(d.currentScore, d.remainingNegatives);
  const tier = (d.client?.membership_tier || d.client?.tier || 'Elite Member') as string;

  const items: { label: string; value: React.ReactNode; icon: any }[] = [
    { label: 'Membership',     value: <span className="text-foreground">{tier}</span>, icon: Crown },
    { label: 'Program Status', value: <span className="text-emerald-deep">Active</span>, icon: Activity },
    { label: 'Current Round',  value: <span className="tabular-nums">Round {round || 1}</span>, icon: ShieldCheck },
    { label: 'Assigned Team',  value: 'Express Credit Concierge', icon: Users },
    {
      label: 'Last Updated',
      value: lastUpdated
        ? new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—',
      icon: CalendarCheck2,
    },
  ];

  return (
    <div className="relative border-b border-border/70 bg-gradient-to-r from-ivory via-background to-ivory">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-deep/40 to-transparent" />
      <div className="mx-auto max-w-[1320px] px-4 md:px-10 lg:px-14 py-5 md:py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="lux-eyebrow !text-[10px] flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-gold-deep" />
              {greeting()} · Private Client Portal
            </p>
            <h1 className="lux-display text-2xl md:text-[2rem] text-foreground mt-1.5 leading-tight">
              {greeting()}, {firstName}.
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {readiness.description}
            </p>
          </div>
          {d.currentScore != null && (
            <div className="flex items-end gap-5 md:gap-7 shrink-0">
              <div className="text-right">
                <p className="lux-eyebrow !text-[10px]">FICO 8 · Blended</p>
                <p className="lux-display text-3xl md:text-4xl tabular-nums text-foreground leading-none mt-1">
                  {d.currentScore}
                </p>
              </div>
              <div className="text-right">
                <p className="lux-eyebrow !text-[10px]">Lifetime Change</p>
                <div className="mt-1">
                  <DeltaChip value={d.scoreChange ?? 0} suffix="pts" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-5 border-t border-border/60 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3">
          {items.map((it) => (
            <div key={it.label} className="min-w-0">
              <p className="lux-eyebrow !text-[10px] flex items-center gap-1.5">
                <it.icon className="h-3 w-3 text-gold-deep" />
                {it.label}
              </p>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">{it.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}