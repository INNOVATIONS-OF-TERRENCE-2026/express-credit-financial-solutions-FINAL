import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

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
  const startTier = tierFor(starting);
  const next = nextTier(current);
  const change = current != null && starting != null ? current - starting : null;

  // Gauge geometry: 240° arc, score 300→850
  const { dashFull, dashFilled, dashStarting } = useMemo(() => {
    const radius = 90;
    const circ = 2 * Math.PI * radius;
    const arcLen = circ * (240 / 360);
    const v = current == null ? 0 : Math.min(1, Math.max(0, (current - 300) / (850 - 300)));
    const s = starting == null ? 0 : Math.min(1, Math.max(0, (starting - 300) / (850 - 300)));
    return { dashFull: arcLen, dashFilled: arcLen * v, dashStarting: arcLen * s };
  }, [current, starting]);

  const pointsToNext = next && current != null ? Math.max(0, next.min - current) : null;
  const trend = change == null ? 'flat' : change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground';

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
          {/* Tinted tier track segments */}
          {(() => {
            const radius = 90;
            const circ = 2 * Math.PI * radius;
            const arcLen = circ * (240 / 360);
            let offset = 0;
            const segs = TIERS.map((t) => {
              const span = ((t.max - t.min + 1) / (850 - 300 + 1)) * arcLen;
              const el = (
                <circle
                  key={t.label}
                  cx="110" cy="110" r="90"
                  fill="none"
                  stroke={t.color}
                  strokeOpacity="0.18"
                  strokeWidth="14"
                  strokeDasharray={`${span} ${arcLen}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += span;
              return el;
            });
            return segs;
          })()}
          {/* Filled progress to current score */}
          <circle
            cx="110" cy="110" r="90"
            fill="none" stroke={tier?.color ?? 'hsl(var(--primary))'} strokeWidth="14"
            strokeDasharray={`${dashFilled} 9999`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 600ms ease' }}
          />
          {/* Starting score tick marker */}
          {starting != null && (
            <circle
              cx="110" cy="110" r="90"
              fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.6"
              strokeWidth="18"
              strokeDasharray={`3 ${dashFull}`}
              strokeDashoffset={-Math.max(0, dashStarting - 1.5)}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
            {current ?? '—'}
          </span>
          {change != null && (
            <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              {change > 0 ? `+${change}` : change}
              <span className="text-muted-foreground font-normal">pts</span>
            </span>
          )}
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            FICO 8 · 300–850
          </span>
        </div>
      </div>

      {/* FICO tier legend with thresholds */}
      <div className="mt-3 grid grid-cols-5 gap-1 text-[9px]">
        {TIERS.map((t) => {
          const active = tier?.label === t.label;
          return (
            <div key={t.label} className="flex flex-col items-center gap-1">
              <span
                className="h-1 w-full rounded-full"
                style={{ background: t.color, opacity: active ? 1 : 0.3 }}
              />
              <span
                className={`tabular-nums ${active ? 'font-bold' : 'text-muted-foreground'}`}
                style={active ? { color: t.color } : undefined}
              >
                {t.min}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mt-3">
        <Stat
          label="Starting"
          value={starting ?? '—'}
          sub={startTier?.label}
          subColor={startTier?.color}
        />
        <Stat
          label="Movement"
          value={change == null ? '—' : (change >= 0 ? `+${change}` : String(change))}
          tone={change == null ? '' : change >= 0 ? 'text-emerald-600' : 'text-rose-500'}
          sub={change == null ? undefined : trend === 'up' ? 'Improving' : trend === 'down' ? 'Declined' : 'Holding'}
        />
        <Stat
          label="To Next Tier"
          value={next && pointsToNext != null ? `${pointsToNext} pt` : 'Max'}
          sub={next?.label}
          subColor={next?.color}
        />
      </div>

      {updatedAt && (
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Updated {new Date(updatedAt).toLocaleDateString()} · Express Credit & Financial Solutions
        </p>
      )}
    </div>
  );
}

function Stat({
  label, value, tone, sub, subColor,
}: { label: string; value: any; tone?: string; sub?: string; subColor?: string }) {
  return (
    <div className="rounded-md border border-border/40 py-1.5 px-1">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${tone ?? 'text-foreground'}`}>{value}</p>
      {sub && (
        <p
          className="text-[9px] uppercase tracking-wider mt-0.5"
          style={{ color: subColor ?? 'hsl(var(--muted-foreground))' }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}