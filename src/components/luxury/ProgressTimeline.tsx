import { cn } from '@/lib/utils';
import { Check, Circle, Clock } from 'lucide-react';

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  status: 'complete' | 'current' | 'upcoming';
  meta?: string;
}

/**
 * Vertical luxury timeline. Gold accent on current step.
 * Used for Credit Progress (Round 1 / 2 / 3 / Funding Ready).
 */
export function ProgressTimeline({ steps, className }: { steps: TimelineStep[]; className?: string }) {
  return (
    <ol className={cn('relative space-y-6 md:space-y-7 pl-8 md:pl-10', className)}>
      <span
        aria-hidden
        className="absolute left-3 md:left-4 top-2 bottom-2 w-px bg-gradient-to-b from-border via-border to-transparent"
      />
      {steps.map((s) => {
        const Icon = s.status === 'complete' ? Check : s.status === 'current' ? Clock : Circle;
        const ring =
          s.status === 'complete'
            ? 'bg-emerald text-white border-emerald'
            : s.status === 'current'
              ? 'bg-gradient-gold text-midnight border-gold-deep shadow-gold'
              : 'bg-card text-muted-foreground border-border';
        return (
          <li key={s.id} className="relative">
            <span
              className={cn(
                'absolute -left-8 md:-left-10 top-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border-2',
                ring,
              )}
            >
              <Icon className="h-3 w-3" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className={cn(
                  'lux-display text-base md:text-lg',
                  s.status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                )}>
                  {s.title}
                </h4>
                {s.meta && (
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {s.meta}
                  </span>
                )}
              </div>
              {s.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {s.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}