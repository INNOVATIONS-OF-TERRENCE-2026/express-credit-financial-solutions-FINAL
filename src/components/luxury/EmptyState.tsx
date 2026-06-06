import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';

type CTA = {
  label: string;
  onClick?: () => void;
  href?: string;
};

/**
 * Premium empty state used across the portal and admin.
 * Never shows fabricated data — purely a friendly fallback surface.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  primary,
  secondary,
  className,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  primary?: CTA;
  secondary?: CTA;
  className?: string;
  children?: ReactNode;
}) {
  const renderCta = (cta: CTA, variant: 'premium' | 'outline') => {
    if (cta.href) {
      return (
        <Button asChild variant={variant} size="sm">
          <a href={cta.href}>{cta.label}</a>
        </Button>
      );
    }
    return (
      <Button variant={variant} size="sm" onClick={cta.onClick}>
        {cta.label}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        'lux-surface flex flex-col items-center justify-center text-center px-6 py-12 md:py-16 gap-4',
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-champagne text-gold-deep border border-gold-soft/30"
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="max-w-md space-y-1.5">
        <h3 className="lux-display text-lg text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {(primary || secondary) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {primary && renderCta(primary, 'premium')}
          {secondary && renderCta(secondary, 'outline')}
        </div>
      )}
      {children}
    </div>
  );
}