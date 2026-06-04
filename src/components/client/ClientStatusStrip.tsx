import { useClient } from '@/contexts/ClientContext';
import { useClientPortalData } from '@/hooks/useClientPortalData';
import { computeReadiness } from '@/lib/mortgageReadiness';
import { TrendingUp, TrendingDown, Home, Target } from 'lucide-react';

/**
 * Persistent header strip shown on every client portal page.
 * Answers "am I winning?" at a glance: score · delta · readiness · next milestone.
 */
export function ClientStatusStrip() {
  const { clientId, userId } = useClient();
  const d = useClientPortalData(clientId, userId);

  if (d.loading) return null;
  // Hide on brand-new accounts with no scores yet.
  if (d.startingScore == null && d.currentScore == null) return null;

  const readiness = computeReadiness(d.currentScore, d.remainingNegatives);
  const delta = d.scoreChange ?? 0;
  const positive = delta >= 0;

  return (
    <div className="border-b border-border/50 bg-card/40 backdrop-blur">
      <div className="px-4 md:px-6 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Current Score</p>
          <p className="text-base font-bold text-amber-500">{d.currentScore ?? '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Change</p>
          <p className={`text-base font-bold flex items-center gap-1 ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {positive ? '+' : ''}{delta}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <Home className="h-3 w-3" />Readiness
          </p>
          <p className={`text-sm font-semibold truncate ${readiness.tone.split(' ')[0]}`}>{readiness.label}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />Next Milestone
          </p>
          <p className="text-sm font-semibold truncate">{readiness.nextMilestoneLabel}</p>
        </div>
      </div>
    </div>
  );
}