import { useMemo } from 'react';

const TIERS = [
  { min: 300, max: 579, label: 'Poor',      color: 'hsl(0 70% 55%)' },
  { min: 580, max: 669, label: 'Fair',      color: 'hsl(28 90% 55%)' },
  { min: 670, max: 739, label: 'Good',      color: 'hsl(46 90% 50%)' },
  { min: 740, max: 799, label: 'Very Good', color: 'hsl(140 60% 45%)' },
  { min: 800, max: 850, label: 'Excellent', color: 'hsl(160 70% 40%)' },
];

function tierFor(score: number | null) {
  if (score == null) return null;
  return TIERS.find((t) => score >= t.min && score <= t.max) ?? TIERS[0];
}
function nextTier(score: number | null) {
  if (score == null) return null;
  return TIERS.find((t) => t.min > score) ?? null;
}

export function ScoreGauge({
  label,
  current,
  starting,
  updatedAt,
}: {
  label: string;
  current: number | null;
  starting: number | null;
  updatedAt?: string | null;
}) {
  const tier = tierFor(current);
  const next = nextTier(current);
  const change = current != null && starting != null ? current - starting : null;

  // Gauge geometry: 240° arc, score 300→850
  const { dashFull, dashFilled, percent } = useMemo(() => {
    const radius = 90;
    const circ = 2 * Math.PI * radius;
    const arcLen = circ * (240 / 360);
    const v = current == null ? 0 : Math.min(1, Math.max(0, (current - 300) / (850 - 300)));
    return { dashFull: arcLen, dashFilled: arcLen * v, percent: v };
  }, [current]);

  const pointsToNext = next && current != null ? Math.max(0, next.min - current) : null;

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/30 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold tracking-wide text-foreground">{label}</p>
        {tier && (
          <span
            className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border"
            style={{ color: tier.color, borderColor: tier.color }}
          >
            {tier.label}
          </span>
        )}
      </div>

      <div className="relative h-48 flex items-center justify-center">
        <svg viewBox="0 0 220 220" className="w-full h-full -rotate-[210deg]">
          <circle
            cx="110" cy="110" r="90"
            fill="none" stroke="hsl(var(--muted))" strokeWidth="14"
            strokeDasharray={`${dashFull} 9999`}
            strokeLinecap="round"
          />
          <circle
            cx="110" cy="110" r="90"
            fill="none" stroke={tier?.color ?? 'hsl(var(--primary))'} strokeWidth="14"
            strokeDasharray={`${dashFilled} 9999`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 600ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
            {current ?? '—'}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            FICO 8 · 300–850
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mt-2">
        <Stat label="Starting" value={starting ?? '—'} />
        <Stat
          label="Change"
          value={change == null ? '—' : (change >= 0 ? `+${change}` : String(change))}
          tone={change == null ? '' : change >= 0 ? 'text-emerald-500' : 'text-rose-500'}
        />
        <Stat label="Next Tier" value={next ? `${pointsToNext}pt` : 'Max'} />
      </div>

      {updatedAt && (
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Updated {new Date(updatedAt).toLocaleDateString()} · Express Credit & Financial Solutions
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: any; tone?: string }) {
  return (
    <div className="rounded-md border border-border/40 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${tone ?? 'text-foreground'}`}>{value}</p>
    </div>
  );
}