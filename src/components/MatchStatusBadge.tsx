import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export type MatchStatus = 'matched' | 'needs_review' | 'failed' | null | undefined;

export function MatchStatusBadge({
  status,
  score,
  checkedAt,
  error,
  compact = false,
}: {
  status: MatchStatus;
  score?: number | null;
  checkedAt?: string | null;
  error?: string | null;
  compact?: boolean;
}) {
  const meta = (() => {
    switch (status) {
      case 'matched':
        return { label: 'Matched', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500', Icon: CheckCircle2 };
      case 'needs_review':
        return { label: 'Needs review', cls: 'border-amber-500/40 bg-amber-500/10 text-amber-500', Icon: AlertTriangle };
      case 'failed':
        return { label: 'Match failed', cls: 'border-rose-500/40 bg-rose-500/10 text-rose-500', Icon: XCircle };
      default:
        return { label: 'Not checked', cls: 'border-border/60 text-muted-foreground', Icon: Clock };
    }
  })();

  const pct = score != null ? `${Math.round(Number(score) * 100)}%` : null;
  return (
    <div className="inline-flex flex-col gap-0.5">
      <Badge variant="outline" className={`inline-flex items-center gap-1 ${meta.cls}`}>
        <meta.Icon className="h-3 w-3" />
        {meta.label}{pct ? ` · ${pct}` : ''}
      </Badge>
      {!compact && checkedAt && (
        <span className="text-[10px] text-muted-foreground">
          Checked {new Date(checkedAt).toLocaleString()}
        </span>
      )}
      {!compact && error && (
        <span className="text-[10px] text-rose-500 max-w-xs">{error}</span>
      )}
    </div>
  );
}