import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export type ProgressStageId =
  | 'onboarding'
  | 'documents'
  | 'report'
  | 'review'
  | 'strategy'
  | 'disputes'
  | 'monitoring';

const STAGES: { id: ProgressStageId; label: string }[] = [
  { id: 'onboarding', label: 'Onboarding Started' },
  { id: 'documents',  label: 'Documents Submitted' },
  { id: 'report',     label: 'Credit Report Uploaded' },
  { id: 'review',     label: 'Review In Progress' },
  { id: 'strategy',   label: 'Dispute Strategy Prepared' },
  { id: 'disputes',   label: 'Disputes In Progress' },
  { id: 'monitoring', label: 'Monitoring / Next Round' },
];

/**
 * Premium 7-stage progress rail for the client dashboard.
 * Pass the currently-active stage; everything before it renders as completed.
 * If `currentStage` is undefined a neutral "Onboarding Started" fallback is shown.
 */
export function ProgressStageTimeline({
  currentStage,
  className,
}: {
  currentStage?: ProgressStageId;
  className?: string;
}) {
  const activeIdx = Math.max(
    0,
    STAGES.findIndex((s) => s.id === (currentStage ?? 'onboarding')),
  );

  return (
    <div className={cn('lux-surface p-5 md:p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="lux-eyebrow">Progress Tracker</p>
          <h3 className="lux-display text-lg text-foreground mt-1">Your credit repair journey</h3>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          Stage {activeIdx + 1} of {STAGES.length}
        </span>
      </div>

      {/* Desktop horizontal rail */}
      <ol className="hidden md:grid grid-cols-7 gap-2 relative">
        {STAGES.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <li key={s.id} className="flex flex-col items-center text-center gap-2">
              <div className="relative w-full flex items-center justify-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-0 right-1/2 top-1/2 h-px -translate-y-1/2',
                      done || active ? 'bg-gradient-gold' : 'bg-border',
                    )}
                  />
                )}
                {i < STAGES.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-1/2 right-0 top-1/2 h-px -translate-y-1/2',
                      done ? 'bg-gradient-gold' : 'bg-border',
                    )}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums',
                    done && 'btn-premium-gold border-0',
                    active && 'bg-midnight text-ivory border-midnight ring-4 ring-gold-soft/30',
                    !done && !active && 'bg-card text-muted-foreground border-border',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
              </div>
              <span
                className={cn(
                  'text-[11px] leading-tight max-w-[10ch]',
                  active ? 'text-foreground font-semibold' : 'text-muted-foreground',
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile vertical rail */}
      <ol className="md:hidden space-y-3">
        {STAGES.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <li key={s.id} className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums',
                  done && 'btn-premium-gold border-0',
                  active && 'bg-midnight text-ivory border-midnight ring-2 ring-gold-soft/40',
                  !done && !active && 'bg-card text-muted-foreground border-border',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-sm',
                  active ? 'text-foreground font-semibold' : done ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}