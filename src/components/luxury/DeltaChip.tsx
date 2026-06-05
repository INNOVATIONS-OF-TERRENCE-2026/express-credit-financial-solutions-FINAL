import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Compact +/-/neutral chip used next to a value.
 * Positive = emerald, negative = rose, zero/null = platinum.
 */
export function DeltaChip({
  value,
  suffix,
  invert = false,
  className,
  size = 'md',
}: {
  value: number | null | undefined;
  suffix?: string;
  /** Set true when "down" should read as good (e.g. debt removed). */
  invert?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const v = value ?? 0;
  const positive = invert ? v < 0 : v > 0;
  const negative = invert ? v > 0 : v < 0;
  const tone = value == null
    ? 'bg-muted text-muted-foreground border-border'
    : positive
      ? 'bg-emerald/10 text-emerald-deep border-emerald/30'
      : negative
        ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
        : 'bg-muted text-muted-foreground border-border';

  const Icon = value == null || v === 0 ? Minus : (positive ? ArrowUpRight : ArrowDownRight);
  const sizeCls = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
    : 'text-xs px-2 py-1 gap-1';
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-semibold tabular-nums',
      tone,
      sizeCls,
      className,
    )}>
      <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {value == null ? '—' : (v > 0 ? `+${v}` : String(v))}
      {suffix && <span className="ml-0.5 font-normal">{suffix}</span>}
    </span>
  );
}