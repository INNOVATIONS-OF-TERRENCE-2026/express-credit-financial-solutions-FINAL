import { useState, useMemo } from 'react';
import { ScoreGauge } from './ScoreGauge';
import { LuxuryCard, EyebrowLabel, DeltaChip } from '@/components/luxury';
import { ArrowUpRight, ArrowDownRight, Minus, Activity, Sparkles, Vault, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type BureauKey = 'ex' | 'eq' | 'tu';
interface Bureau {
  key: BureauKey;
  label: string;
  short: string;
  current: number | null;
  starting: number | null;
}

const TIER = (s: number | null) => {
  if (s == null) return { label: '—', color: 'hsl(var(--muted-foreground))' };
  if (s >= 800) return { label: 'Excellent', color: 'hsl(160 70% 40%)' };
  if (s >= 740) return { label: 'Very Good', color: 'hsl(140 60% 45%)' };
  if (s >= 670) return { label: 'Good',      color: 'hsl(46 90% 50%)' };
  if (s >= 580) return { label: 'Fair',      color: 'hsl(28 90% 55%)' };
  return { label: 'Poor', color: 'hsl(0 70% 55%)' };
};

export function CreditCommandCenter({
  bureaus,
  updatedAt,
}: {
  bureaus: Bureau[];
  updatedAt?: string | null;
}) {
  const [active, setActive] = useState<BureauKey>(bureaus[0]?.key ?? 'ex');
  const featured = bureaus.find((b) => b.key === active) ?? bureaus[0];

  const totals = useMemo(() => {
    const current = bureaus.map((b) => b.current).filter((v): v is number => v != null);
    const starting = bureaus.map((b) => b.starting).filter((v): v is number => v != null);
    const avgCur = current.length ? Math.round(current.reduce((a, b) => a + b, 0) / current.length) : null;
    const avgStart = starting.length ? Math.round(starting.reduce((a, b) => a + b, 0) / starting.length) : null;
    const delta = avgCur != null && avgStart != null ? avgCur - avgStart : null;
    const high = current.length ? Math.max(...current) : null;
    const low = current.length ? Math.min(...current) : null;
    return { avgCur, avgStart, delta, high, low };
  }, [bureaus]);

  const featuredDelta =
    featured?.current != null && featured?.starting != null
      ? featured.current - featured.starting
      : null;
  const featuredTier = TIER(featured?.current ?? null);

  return (
    <LuxuryCard variant="midnight" elevated accent className="overflow-hidden">
      {/* ============ HEADER ============ */}
      <div className="relative p-6 md:p-10 lg:p-12 pb-0">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-gradient-gold opacity-15 blur-3xl" aria-hidden />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold-soft">
              <Activity className="h-3 w-3" /> Credit Command Center
            </span>
            <h2 className="lux-display text-4xl md:text-5xl lg:text-[3.25rem] text-ivory mt-2 leading-[1.02]">
              Your tri-bureau profile, live.
            </h2>
            <p className="text-sm md:text-base text-ivory/70 max-w-xl mt-2 leading-relaxed">
              Premium FICO 8 readings across Experian, Equifax, and TransUnion. Toggle a bureau to inspect movement and deltas in detail.
            </p>
          </div>
          {totals.delta != null && (
            <div className="rounded-2xl border border-ivory/15 bg-ivory/5 backdrop-blur p-5 min-w-[220px]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ivory/60">Lifetime Gain</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="lux-display text-4xl text-ivory tabular-nums">
                  {totals.delta >= 0 ? `+${totals.delta}` : totals.delta}
                </span>
                <span className="text-sm text-ivory/60">pts blended</span>
              </div>
              <p className="text-[11px] text-ivory/60 mt-2 tabular-nums">
                {totals.avgStart ?? '—'} → {totals.avgCur ?? '—'}
              </p>
            </div>
          )}
        </div>

        {/* ============ BUREAU TABS ============ */}
        <div className="mt-8 md:mt-10 -mb-px -mx-6 md:mx-0 px-6 md:px-0 overflow-x-auto no-scrollbar">
          <div
            role="tablist"
            aria-label="Credit bureau"
            className="relative inline-flex rounded-t-xl border border-b-0 border-ivory/15 bg-ivory/5 p-1 backdrop-blur whitespace-nowrap"
          >
            {bureaus.map((b) => {
              const isActive = b.key === active;
              const dlt = b.current != null && b.starting != null ? b.current - b.starting : null;
              const TrendIcon = dlt == null || dlt === 0 ? Minus : dlt > 0 ? ArrowUpRight : ArrowDownRight;
              return (
                <button
                  key={b.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(b.key)}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-lg px-4 md:px-5 py-2.5 transition-all duration-300 ease-out active:scale-[0.97]',
                    isActive
                      ? 'bg-ivory text-midnight shadow-elevated scale-[1.02]'
                      : 'text-ivory/70 hover:text-ivory hover:bg-ivory/10',
                  )}
                >
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-[9px] uppercase tracking-[0.18em] opacity-70 leading-none">
                      {b.short}
                    </span>
                    <span className="lux-display text-base md:text-lg leading-tight tabular-nums mt-0.5">
                      {b.current ?? '—'}
                    </span>
                  </div>
                  {dlt != null && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full',
                        dlt > 0
                          ? isActive ? 'bg-emerald/15 text-emerald-deep' : 'bg-emerald/10 text-emerald'
                          : dlt < 0
                            ? isActive ? 'bg-rose-500/15 text-rose-600' : 'bg-rose-500/15 text-rose-300'
                            : 'bg-muted/30 text-muted-foreground',
                      )}
                    >
                      <TrendIcon className="h-2.5 w-2.5" />
                      {dlt > 0 ? `+${dlt}` : dlt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============ FEATURED GAUGE PANEL ============ */}
      <div className="bg-ivory/[0.04] border-t border-ivory/10 backdrop-blur-sm">
        <div className="p-6 md:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-10">
          {/* Hero gauge */}
          <div className="lg:col-span-3 lg:static">
            <div className="sticky top-16 z-10 rounded-2xl bg-ivory p-6 md:p-8 shadow-elevated lg:static">
              <ScoreGauge
                key={featured?.key}
                label={`${featured?.label ?? '—'} · FICO 8`}
                current={featured?.current ?? null}
                starting={featured?.starting ?? null}
                updatedAt={updatedAt ?? null}
              />
              <div key={`anim-${featured?.key}`} className="animate-fade-in" aria-hidden />
            </div>
          </div>

          {/* Movement breakdown */}
          <div key={`panel-${featured?.key}`} className="lg:col-span-2 space-y-4 animate-fade-in">
            <div className="rounded-2xl border border-ivory/15 bg-ivory/5 backdrop-blur p-6">
              <EyebrowLabel className="!text-gold-soft [&>span]:!text-gold-soft">
                <Sparkles className="h-3 w-3" /> {featured?.label} Movement
              </EyebrowLabel>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MovementStat label="Starting" value={featured?.starting ?? '—'} tone="ivory" />
                <MovementStat label="Current"  value={featured?.current  ?? '—'} tone="gold" />
                <MovementStat
                  label="Change"
                  value={featuredDelta == null ? '—' : featuredDelta >= 0 ? `+${featuredDelta}` : String(featuredDelta)}
                  tone={featuredDelta == null ? 'ivory' : featuredDelta >= 0 ? 'emerald' : 'rose'}
                />
              </div>
              <div className="mt-5 pt-5 border-t border-ivory/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-ivory/60">Current Tier</span>
                  <span
                    className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border"
                    style={{ color: featuredTier.color, borderColor: featuredTier.color }}
                  >
                    {featuredTier.label}
                  </span>
                </div>
              </div>
            </div>

            {/* All bureaus side-by-side */}
            <div className="rounded-2xl border border-ivory/15 bg-ivory/5 backdrop-blur p-6">
              <EyebrowLabel className="!text-ivory/70 [&>span]:!text-ivory/70">All Bureaus</EyebrowLabel>
              <ul className="mt-3 space-y-2">
                {bureaus.map((b) => {
                  const dlt = b.current != null && b.starting != null ? b.current - b.starting : null;
                  const tier = TIER(b.current);
                  return (
                    <li
                      key={b.key}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                        b.key === active
                          ? 'border-gold-soft/50 bg-ivory/10'
                          : 'border-ivory/10 bg-transparent hover:bg-ivory/[0.06]',
                      )}
                    >
                      <button onClick={() => setActive(b.key)} className="flex-1 text-left">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-ivory/60">{b.label}</p>
                        <p className="lux-display text-xl text-ivory tabular-nums leading-tight">
                          {b.current ?? '—'}
                        </p>
                      </button>
                      <div className="text-right space-y-1">
                        <span
                          className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full border block"
                          style={{ color: tier.color, borderColor: tier.color }}
                        >
                          {tier.label}
                        </span>
                        <DeltaChip value={dlt} suffix="pts" size="sm" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* High / Low summary */}
            {totals.high != null && totals.low != null && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-ivory/10 bg-ivory/5 backdrop-blur p-4">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-ivory/60">Highest</p>
                  <p className="lux-display text-2xl text-ivory tabular-nums mt-1">{totals.high}</p>
                </div>
                <div className="rounded-xl border border-ivory/10 bg-ivory/5 backdrop-blur p-4">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-ivory/60">Lowest</p>
                  <p className="lux-display text-2xl text-ivory tabular-nums mt-1">{totals.low}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ MOBILE SHORTCUT BAR (Vault / Inbox) ============ */}
        <div className="md:hidden border-t border-ivory/10 bg-midnight/30 backdrop-blur px-6 py-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-ivory/55 mb-3">Jump to</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/client/documents"
              className="group flex items-center gap-3 rounded-xl border border-ivory/15 bg-ivory/5 px-4 py-3 active:scale-[0.98] transition-transform"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold text-midnight shadow-elevated">
                <Vault className="h-4 w-4" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase tracking-[0.18em] text-ivory/55 leading-none">Secure</span>
                <span className="text-sm font-semibold text-ivory leading-tight">Vault</span>
              </span>
            </Link>
            <Link
              to="/client/messages"
              className="group flex items-center gap-3 rounded-xl border border-ivory/15 bg-ivory/5 px-4 py-3 active:scale-[0.98] transition-transform"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ivory text-midnight shadow-elevated">
                <Bell className="h-4 w-4" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase tracking-[0.18em] text-ivory/55 leading-none">Concierge</span>
                <span className="text-sm font-semibold text-ivory leading-tight">Inbox</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </LuxuryCard>
  );
}

function MovementStat({
  label, value, tone,
}: {
  label: string;
  value: React.ReactNode;
  tone: 'ivory' | 'gold' | 'emerald' | 'rose';
}) {
  const toneCls = {
    ivory:   'text-ivory',
    gold:    'text-gold-soft',
    emerald: 'text-emerald',
    rose:    'text-rose-300',
  }[tone];
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.18em] text-ivory/60">{label}</p>
      <p className={cn('lux-display text-2xl tabular-nums mt-1', toneCls)}>{value}</p>
    </div>
  );
}