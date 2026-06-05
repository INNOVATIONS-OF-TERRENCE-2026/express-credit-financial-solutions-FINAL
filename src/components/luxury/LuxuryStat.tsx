import { cn } from '@/lib/utils';
import { LuxuryCard } from './LuxuryCard';
import { EyebrowLabel } from './EyebrowLabel';
import { DeltaChip } from './DeltaChip';
import { LucideIcon } from 'lucide-react';

/**
 * Executive KPI tile. Large display numeral + eyebrow + optional delta.
 * Used for Active Clients, Open Disputes, Revenue MTD, Score Lift, etc.
 */
export function LuxuryStat({
  eyebrow,
  value,
  suffix,
  hint,
  delta,
  deltaSuffix,
  invertDelta = false,
  icon: Icon,
  className,
  emphasize = false,
}: {
  eyebrow: string;
  value: React.ReactNode;
  suffix?: string;
  hint?: React.ReactNode;
  delta?: number | null;
  deltaSuffix?: string;
  invertDelta?: boolean;
  icon?: LucideIcon;
  className?: string;
  emphasize?: boolean;
}) {
  return (
    <LuxuryCard
      accent={emphasize}
      className={cn(
        'p-5 md:p-6 flex flex-col gap-3 min-h-[140px] justify-between',
        emphasize && 'bg-gradient-champagne',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <EyebrowLabel>{eyebrow}</EyebrowLabel>
        {Icon && (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-midnight/5 text-midnight/70">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="lux-display text-4xl md:text-5xl text-foreground tabular-nums">
          {value}
        </span>
        {suffix && (
          <span className="text-sm font-medium text-muted-foreground mb-1.5">{suffix}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {delta !== undefined && <DeltaChip value={delta} suffix={deltaSuffix} invert={invertDelta} />}
      </div>
    </LuxuryCard>
  );
}