import { cn } from '@/lib/utils';
import { EyebrowLabel } from './EyebrowLabel';

/**
 * Section header with generous vertical rhythm.
 * Use to wrap large content blocks (Score Center, Results, Timeline).
 */
export function LuxurySection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  divider = true,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}) {
  return (
    <section className={cn('space-y-6 md:space-y-8', className)}>
      {(eyebrow || title || description || actions) && (
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="space-y-2 md:space-y-3 min-w-0">
            {eyebrow && <EyebrowLabel withRule>{eyebrow}</EyebrowLabel>}
            {title && (
              <h2 className="lux-display text-3xl md:text-4xl lg:text-[2.6rem] text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      {divider && (eyebrow || title) && <div className="lux-divider" aria-hidden />}
      <div>{children}</div>
    </section>
  );
}