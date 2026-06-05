import { Home, Car, Briefcase, CreditCard, Landmark, ArrowRight } from 'lucide-react';
import { LuxuryCard, EyebrowLabel } from '@/components/luxury';
import { Progress } from '@/components/ui/progress';

type LaneKey = 'mortgage' | 'auto' | 'business' | 'card' | 'banking';

interface Lane {
  key: LaneKey;
  title: string;
  icon: any;
  target: number; // score threshold for "Ready"
  near: number;   // score threshold for "Near Ready"
  recommend: (score: number, neg: number) => string;
  nextMilestone: (score: number) => string;
}

const LANES: Lane[] = [
  {
    key: 'mortgage',
    title: 'Mortgage Readiness',
    icon: Home,
    target: 680, near: 620,
    recommend: (s) => s >= 680 ? 'Request a pre-approval introduction.' : s >= 620 ? 'Pay revolving balances under 30% utilization.' : 'Continue dispute work; FHA opens at 580.',
    nextMilestone: (s) => s >= 740 ? 'Best-rate tier achieved' : s >= 680 ? 'Push to 740 for best rates' : s >= 620 ? 'Reach 680 for conventional power' : 'Reach 620 for conventional eligibility',
  },
  {
    key: 'auto',
    title: 'Auto Loan Readiness',
    icon: Car,
    target: 660, near: 600,
    recommend: (s) => s >= 660 ? 'Eligible for prime auto financing.' : s >= 600 ? 'You qualify for near-prime auto loans.' : 'Subprime range — keep clearing collections.',
    nextMilestone: (s) => s >= 720 ? 'Tier 1 auto financing' : s >= 660 ? 'Reach 720 for Tier 1 rates' : s >= 600 ? 'Reach 660 for prime rates' : 'Reach 600 for near-prime',
  },
  {
    key: 'business',
    title: 'Business Funding Readiness',
    icon: Briefcase,
    target: 700, near: 640,
    recommend: (s, n) => s >= 700 && n <= 2 ? 'Ready for SBA introductions.' : 'Build personal score and resolve negatives before applying.',
    nextMilestone: (s) => s >= 740 ? 'Tier 1 SBA prepared' : s >= 700 ? 'Reach 740 for SBA strength' : 'Reach 700 for funding underwriting',
  },
  {
    key: 'card',
    title: 'Credit Card Readiness',
    icon: CreditCard,
    target: 670, near: 600,
    recommend: (s) => s >= 740 ? 'Eligible for premium travel and cashback cards.' : s >= 670 ? 'Solid prime card eligibility.' : s >= 600 ? 'Secured-to-unsecured graduation possible.' : 'Establish a secured tradeline to build history.',
    nextMilestone: (s) => s >= 740 ? 'Premium card eligible' : s >= 670 ? 'Reach 740 for premium cards' : 'Reach 670 for prime cards',
  },
  {
    key: 'banking',
    title: 'Banking Readiness',
    icon: Landmark,
    target: 600, near: 540,
    recommend: (s) => s >= 600 ? 'Standard checking & savings access cleared.' : 'Continue clearing ChexSystems items if present.',
    nextMilestone: (s) => s >= 700 ? 'Wealth management eligible' : s >= 600 ? 'Reach 700 for premium banking' : 'Reach 600 for standard banking',
  },
];

function bandFor(score: number, lane: Lane): { label: string; tone: string; pct: number } {
  if (score >= lane.target) {
    const ceil = lane.target + 80;
    return {
      label: 'Ready',
      tone: 'text-emerald-deep border-emerald/30 bg-emerald/10',
      pct: Math.min(100, 75 + ((score - lane.target) / (ceil - lane.target)) * 25),
    };
  }
  if (score >= lane.near) {
    return {
      label: 'Near Ready',
      tone: 'text-amber-600 border-amber-500/30 bg-amber-500/10',
      pct: 40 + ((score - lane.near) / (lane.target - lane.near)) * 30,
    };
  }
  return {
    label: 'Building',
    tone: 'text-rose-600 border-rose-500/30 bg-rose-500/10',
    pct: Math.max(8, (score / lane.near) * 30),
  };
}

export function FundingReadinessCenter({
  currentScore,
  remainingNegatives,
}: {
  currentScore: number | null;
  remainingNegatives: number;
}) {
  const score = currentScore ?? 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
      {LANES.map((lane) => {
        const band = bandFor(score, lane);
        const pct = Math.round(band.pct);
        return (
          <LuxuryCard key={lane.key} className="p-5 md:p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ivory-2 to-champagne/60 text-midnight border border-gold-deep/20">
                  <lane.icon className="h-5 w-5" />
                </span>
                <div>
                  <EyebrowLabel>{lane.key === 'card' ? 'Credit Cards' : lane.key === 'banking' ? 'Banking' : lane.key === 'business' ? 'Business' : lane.key === 'auto' ? 'Auto' : 'Mortgage'}</EyebrowLabel>
                  <h4 className="lux-display text-base md:text-lg text-foreground leading-tight mt-0.5">
                    {lane.title}
                  </h4>
                </div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${band.tone}`}>
                {band.label}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Progress to ready</span>
                <span className="tabular-nums font-semibold text-foreground">{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>

            <div className="space-y-3 pt-1 border-t border-border/60">
              <div>
                <p className="lux-eyebrow !text-[9px]">Recommended Action</p>
                <p className="text-sm text-foreground leading-snug mt-1">
                  {lane.recommend(score, remainingNegatives)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3 text-gold-deep" />
                <span>{lane.nextMilestone(score)}</span>
              </div>
            </div>
          </LuxuryCard>
        );
      })}
    </div>
  );
}