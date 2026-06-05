import { cn } from '@/lib/utils';
import { forwardRef, HTMLAttributes } from 'react';

type Variant = 'ivory' | 'champagne' | 'midnight' | 'plain';

/**
 * Premium card surface. Replaces shadcn Card when we want the full
 * Amex / Chase Private Client look — large radius, soft shadows, optional
 * gold rule, deep midnight variant for hero panels.
 */
export const LuxuryCard = forwardRef<HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    variant?: Variant;
    elevated?: boolean;
    accent?: boolean;
  }
>(function LuxuryCard(
  { variant = 'ivory', elevated = false, accent = false, className, children, ...rest },
  ref,
) {
  const base = elevated ? 'lux-surface-elevated' : 'lux-surface';
  const variantClass = {
    ivory: 'bg-card',
    champagne: 'bg-gradient-champagne',
    midnight: 'lux-midnight border-midnight/30',
    plain: 'bg-transparent border-0 shadow-none',
  }[variant];
  return (
    <div
      ref={ref}
      className={cn(
        base,
        variantClass,
        accent && 'relative overflow-hidden',
        className,
      )}
      {...rest}
    >
      {accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-deep to-transparent opacity-60"
        />
      )}
      {children}
    </div>
  );
});