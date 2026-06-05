import { cn } from '@/lib/utils';
import { LuxuryCard } from './LuxuryCard';
import { EyebrowLabel } from './EyebrowLabel';
import { DeltaChip } from './DeltaChip';
import { ArrowRight } from 'lucide-react';

export interface BeforeAfterRow {
  label: string;
  before: number | string | null;
  current: number | string | null;
  /** Numeric difference for the delta chip. */
  delta?: number | null;
  deltaSuffix?: string;
  /** When true, down = good (debt, negatives). */
  invertDelta?: boolean;
  /** Optional currency / unit prefix for display values. */
  prefix?: string;
}

/**
 * Premium "Before / Current / Difference" comparison panel.
 * Renders rows as three columns on desktop, stacks on mobile.
 */
export function BeforeAfterPanel({
  title,
  eyebrow,
  rows,
  className,
}: {
  title?: string;
  eyebrow?: string;
  rows: BeforeAfterRow[];
  className?: string;
}) {
  return (
    <LuxuryCard elevated accent className={cn('overflow-hidden', className)}>
      <div className="p-6 md:p-8 lg:p-10">
        {(eyebrow || title) && (
          <header className="mb-6 md:mb-8 space-y-2">
            {eyebrow && <EyebrowLabel withRule>{eyebrow}</EyebrowLabel>}
            {title && (
              <h3 className="lux-display text-2xl md:text-3xl text-foreground">{title}</h3>
            )}
          </header>
        )}

        <div className="hidden md:grid grid-cols-12 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3 pb-3 border-b border-border/60">
          <span className="col-span-3">Metric</span>
          <span className="col-span-3">Before Program</span>
          <span className="col-span-3">Current Status</span>
          <span className="col-span-3 text-right">Result</span>
        </div>

        <ul className="divide-y divide-border/60">
          {rows.map((r) => (
            <li key={r.label} className="py-4 md:py-5">
              <div className="grid grid-cols-12 gap-2 md:gap-4 items-center">
                <div className="col-span-12 md:col-span-3 lux-eyebrow !text-xs !tracking-[0.12em] !text-foreground/70">
                  {r.label}
                </div>
                <div className="col-span-5 md:col-span-3">
                  <p className="lux-display text-xl md:text-2xl text-muted-foreground tabular-nums">
                    {r.prefix}{formatVal(r.before)}
                  </p>
                </div>
                <div className="col-span-1 md:hidden flex items-center justify-center">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
                <div className="col-span-5 md:col-span-3">
                  <p className="lux-display text-2xl md:text-3xl text-foreground tabular-nums">
                    {r.prefix}{formatVal(r.current)}
                  </p>
                </div>
                <div className="col-span-12 md:col-span-3 flex md:justify-end mt-1 md:mt-0">
                  {r.delta !== undefined && (
                    <DeltaChip value={r.delta} suffix={r.deltaSuffix} invert={r.invertDelta} />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </LuxuryCard>
  );
}

function formatVal(v: number | string | null): React.ReactNode {
  if (v == null) return '—';
  if (typeof v === 'number') return v.toLocaleString('en-US');
  return v;
}