import { useClient } from '@/contexts/ClientContext';
import { useClientPortalData } from '@/hooks/useClientPortalData';
import { computeReadiness } from '@/lib/mortgageReadiness';
import { Home, Target } from 'lucide-react';
import { DeltaChip } from '@/components/luxury/DeltaChip';

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

  return (
    <div className="border-b border-border/70 bg-background/70 backdrop-blur">
      <div className="mx-auto max-w-[1320px] px-4 md:px-10 lg:px-14 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-sm">
        <div>
          <p className="lux-eyebrow !text-[10px]">Current Score</p>
          <p className="lux-display text-lg md:text-xl text-foreground tabular-nums">{d.currentScore ?? '—'}</p>
        </div>
        <div className="flex flex-col items-start gap-1">
          <p className="lux-eyebrow !text-[10px]">Change</p>
          <DeltaChip value={delta} suffix="pts" />
        </div>
        <div className="min-w-0">
          <p className="lux-eyebrow !text-[10px] flex items-center gap-1.5">
            <Home className="h-3 w-3" />Readiness
          </p>
          <p className="font-medium text-foreground truncate">{readiness.label}</p>
        </div>
        <div className="min-w-0">
          <p className="lux-eyebrow !text-[10px] flex items-center gap-1.5">
            <Target className="h-3 w-3" />Next Milestone
          </p>
          <p className="font-medium text-foreground truncate">{readiness.nextMilestoneLabel}</p>
        </div>
      </div>
    </div>
  );
}