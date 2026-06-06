import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, AlertTriangle, XCircle, Loader2, FileCheck, FileX, Crown, Sparkles, Star } from 'lucide-react';
import { ReactNode } from 'react';

export type StatusKind =
  | 'active' | 'pending' | 'needs-review' | 'completed' | 'in-progress'
  | 'missing' | 'uploaded' | 'signed' | 'unsigned' | 'paid' | 'unpaid'
  | 'elite' | 'pro' | 'basic';

type Spec = {
  label: string;
  icon: ReactNode;
  /** semantic classnames using design tokens */
  className: string;
};

const ICON = 'h-3 w-3';

const MAP: Record<StatusKind, Spec> = {
  active:        { label: 'Active',        icon: <CheckCircle2 className={ICON} />, className: 'bg-emerald/15 text-emerald border-emerald/30' },
  paid:          { label: 'Paid',          icon: <CheckCircle2 className={ICON} />, className: 'bg-emerald/15 text-emerald border-emerald/30' },
  signed:        { label: 'Signed',        icon: <FileCheck    className={ICON} />, className: 'bg-emerald/15 text-emerald border-emerald/30' },
  completed:     { label: 'Completed',     icon: <CheckCircle2 className={ICON} />, className: 'bg-emerald/15 text-emerald border-emerald/30' },
  uploaded:      { label: 'Uploaded',      icon: <FileCheck    className={ICON} />, className: 'bg-platinum/30 text-foreground border-platinum-2/50' },

  'in-progress': { label: 'In Progress',   icon: <Loader2      className={cn(ICON, 'animate-spin')} />, className: 'bg-midnight/10 text-midnight border-midnight/20' },
  pending:       { label: 'Pending',       icon: <Clock        className={ICON} />, className: 'bg-gold-soft/15 text-gold-deep border-gold-soft/40' },
  'needs-review':{ label: 'Needs Review',  icon: <AlertTriangle className={ICON} />, className: 'bg-gold-soft/15 text-gold-deep border-gold-soft/40' },

  missing:       { label: 'Missing',       icon: <XCircle      className={ICON} />, className: 'bg-destructive/12 text-destructive border-destructive/30' },
  unpaid:        { label: 'Unpaid',        icon: <XCircle      className={ICON} />, className: 'bg-destructive/12 text-destructive border-destructive/30' },
  unsigned:      { label: 'Unsigned',      icon: <FileX        className={ICON} />, className: 'bg-destructive/12 text-destructive border-destructive/30' },

  elite:         { label: 'Elite',         icon: <Crown        className={ICON} />, className: 'btn-premium-gold border-0 !text-midnight' },
  pro:           { label: 'Pro',           icon: <Sparkles     className={ICON} />, className: 'bg-midnight text-ivory border-midnight' },
  basic:         { label: 'Basic',         icon: <Star         className={ICON} />, className: 'bg-platinum/40 text-foreground border-platinum-2/50' },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusKind;
  /** Optional override label (otherwise the default for this status). */
  label?: string;
  className?: string;
}) {
  const spec = MAP[status] ?? { label: status, icon: <Circle className={ICON} />, className: 'bg-muted text-muted-foreground border-border' };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap',
        spec.className,
        className,
      )}
    >
      {spec.icon}
      {label ?? spec.label}
    </span>
  );
}