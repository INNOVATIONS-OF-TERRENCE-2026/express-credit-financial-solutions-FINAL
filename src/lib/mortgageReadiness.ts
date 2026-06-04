export type ReadinessBand = 'not_ready' | 'building' | 'near_ready' | 'ready';

export interface ReadinessResult {
  band: ReadinessBand;
  label: string;
  tone: string; // tailwind class
  description: string;
  progressPct: number; // 0-100 toward "ready"
  nextMilestoneLabel: string;
  nextMilestoneTarget: number;
}

/**
 * Derive mortgage readiness purely from existing client data.
 * No schema changes — read-only computation.
 *
 * Thresholds align with typical FHA / conventional mortgage minimums:
 *  - 580 FHA floor
 *  - 620 conventional floor
 *  - 680 strong rate band
 *  - 740+ best rate
 */
export function computeReadiness(
  currentScore: number | null,
  remainingNegatives: number,
): ReadinessResult {
  const score = currentScore ?? 0;

  if (score >= 680 && remainingNegatives <= 2) {
    return {
      band: 'ready',
      label: 'Mortgage Ready',
      tone: 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10',
      description: 'Your profile qualifies for conventional mortgage programs.',
      progressPct: Math.min(100, 70 + (score - 680) / 2),
      nextMilestoneLabel: 'Best rate tier (740+)',
      nextMilestoneTarget: 740,
    };
  }
  if (score >= 620) {
    return {
      band: 'near_ready',
      label: 'Near Mortgage Ready',
      tone: 'text-amber-500 border-amber-500/40 bg-amber-500/10',
      description: 'You qualify for FHA & some conventional programs. Push past 680 for stronger rates.',
      progressPct: 45 + ((score - 620) / 60) * 25,
      nextMilestoneLabel: 'Mortgage Ready (680)',
      nextMilestoneTarget: 680,
    };
  }
  if (score >= 580) {
    return {
      band: 'building',
      label: 'Building Credit',
      tone: 'text-blue-500 border-blue-500/40 bg-blue-500/10',
      description: 'FHA territory. Keep clearing negatives to reach conventional eligibility.',
      progressPct: 20 + ((score - 580) / 40) * 25,
      nextMilestoneLabel: 'Conventional eligible (620)',
      nextMilestoneTarget: 620,
    };
  }
  return {
    band: 'not_ready',
    label: 'Foundation Phase',
    tone: 'text-rose-500 border-rose-500/40 bg-rose-500/10',
    description: 'Your specialist is removing negatives to lift you into FHA range (580).',
    progressPct: score ? Math.max(5, (score / 580) * 20) : 5,
    nextMilestoneLabel: 'FHA eligible (580)',
    nextMilestoneTarget: 580,
  };
}