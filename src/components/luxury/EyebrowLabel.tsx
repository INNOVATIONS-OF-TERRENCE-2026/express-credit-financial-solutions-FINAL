import { cn } from '@/lib/utils';

/**
 * Tiny uppercase label used above premium headings.
 * Visual: 0.65rem, tracked 0.18em, muted ink.
 */
export function EyebrowLabel({
  children,
  className,
  withRule = false,
}: {
  children: React.ReactNode;
  className?: string;
  withRule?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {withRule && <span className="lux-rule-gold" aria-hidden />}
      <span className="lux-eyebrow">{children}</span>
    </div>
  );
}