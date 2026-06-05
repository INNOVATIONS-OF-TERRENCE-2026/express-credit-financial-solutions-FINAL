import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { useClientPortalData } from '@/hooks/useClientPortalData';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  XCircle, ScrollText, FileText, Wallet, ArrowRight, CheckCircle2, Home,
  Target, MessageSquare, Sparkles, ShieldCheck, TrendingDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MatchStatusBadge } from '@/components/MatchStatusBadge';
import { computeReadiness } from '@/lib/mortgageReadiness';
import { Button } from '@/components/ui/button';
import { ScoreGauge } from '@/components/client/ScoreGauge';
import { ScoreHistoryTimeline } from '@/components/client/ScoreHistoryTimeline';
import {
  LuxuryCard, LuxurySection, LuxuryStat, EyebrowLabel, DeltaChip,
  BeforeAfterPanel, ProgressTimeline,
} from '@/components/luxury';
import type { BeforeAfterRow, TimelineStep } from '@/components/luxury';

const fmtMoney = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function DashboardInner() {
  const { clientId, userId, fullName } = useClient();
  const d = useClientPortalData(clientId, userId);

  if (d.loading) return <p className="text-sm text-muted-foreground">Loading your credit profile…</p>;

  const noData =
    d.startingScore == null && d.currentScore == null && d.accountsDeleted === 0 && d.debtRemoved === 0;
  const readiness = computeReadiness(d.currentScore, d.remainingNegatives);
  const pointsToNext = d.currentScore != null
    ? Math.max(0, readiness.nextMilestoneTarget - d.currentScore)
    : null;
  const lastUpdated = d.client?.updated_at ?? d.client?.last_updated ?? null;
  const firstName = (fullName || 'Client').split(' ')[0];

  // Pull tri-bureau scores if recorded; fall back to the blended score.
  const bureaus: { key: 'ex' | 'eq' | 'tu'; label: string; current: number | null; starting: number | null }[] = [
    {
      key: 'ex',
      label: 'Experian',
      current: d.client?.current_score_ex ?? d.currentScore ?? null,
      starting: d.client?.starting_score_ex ?? d.startingScore ?? null,
    },
    {
      key: 'eq',
      label: 'Equifax',
      current: d.client?.current_score_eq ?? d.currentScore ?? null,
      starting: d.client?.starting_score_eq ?? d.startingScore ?? null,
    },
    {
      key: 'tu',
      label: 'TransUnion',
      current: d.client?.current_score_tu ?? d.currentScore ?? null,
      starting: d.client?.starting_score_tu ?? d.startingScore ?? null,
    },
  ];
  const triBureauPending =
    d.client?.current_score_ex == null &&
    d.client?.current_score_eq == null &&
    d.client?.current_score_tu == null;

  // Before/After transformation rows derived from existing fields only.
  const startingNegatives = Number(d.client?.starting_negatives_count ?? d.client?.starting_negatives ?? 0);
  const startingDebt = Number(d.client?.starting_debt_total ?? d.client?.debt_starting_total ?? 0);
  const currentDebt = Math.max(0, startingDebt - d.debtRemoved);
  const transformRows: BeforeAfterRow[] = [
    {
      label: 'Credit Score',
      before: d.startingScore,
      current: d.currentScore,
      delta: d.scoreChange,
      deltaSuffix: 'pts',
    },
    {
      label: 'Negative Accounts',
      before: startingNegatives || null,
      current: d.remainingNegatives,
      delta: startingNegatives ? d.remainingNegatives - startingNegatives : null,
      invertDelta: true,
    },
    {
      label: 'Outstanding Debt',
      before: startingDebt ? `$${startingDebt.toLocaleString()}` : null,
      current: startingDebt ? `$${currentDebt.toLocaleString()}` : null,
      delta: d.debtRemoved ? -d.debtRemoved : null,
      invertDelta: true,
      deltaSuffix: ' debt',
    },
  ];

  // Progress timeline — derived from current dispute round + activity.
  const round = d.currentDisputeRound || 0;
  const stepStatus = (n: number): TimelineStep['status'] =>
    round > n ? 'complete' : round === n ? 'current' : 'upcoming';
  const milestoneStatus = (target: number): TimelineStep['status'] =>
    (d.currentScore ?? 0) >= target ? 'complete' : 'upcoming';
  const timelineSteps: TimelineStep[] = [
    {
      id: 'intake',
      title: 'Onboarding & Reports Uploaded',
      description: `${d.reportsCount} credit ${d.reportsCount === 1 ? 'report' : 'reports'} on file.`,
      status: d.reportsCount > 0 ? 'complete' : 'current',
    },
    { id: 'r1', title: 'Dispute Round 1', meta: 'Initial removals', status: stepStatus(1) },
    { id: 'r2', title: 'Dispute Round 2', meta: 'Re-verification & escalation', status: stepStatus(2) },
    { id: 'r3', title: 'Dispute Round 3', meta: 'Stragglers & verifications', status: stepStatus(3) },
    { id: 'fha', title: 'FHA Eligible · 580+', status: milestoneStatus(580) },
    { id: 'conv', title: 'Conventional Eligible · 620+', status: milestoneStatus(620) },
    { id: 'mortgage', title: 'Mortgage Ready · 680+', status: milestoneStatus(680) },
    { id: 'funding', title: 'Funding Ready · 740+', status: milestoneStatus(740) },
  ];

  return (
    <div className="space-y-14 md:space-y-20">
      {/* ============================================================
          1. WELCOME HERO — midnight private-banking surface
          ============================================================ */}
      <LuxuryCard variant="midnight" elevated accent className="p-8 md:p-12 lg:p-14">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-3 space-y-4">
            <EyebrowLabel withRule>Welcome Back</EyebrowLabel>
            <h2 className="lux-display text-3xl md:text-5xl lg:text-[3.5rem] text-ivory leading-[1.02]">
              {firstName}, your credit journey is underway.
            </h2>
            <p className="text-sm md:text-base text-ivory/75 max-w-2xl leading-relaxed">
              {readiness.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-soft/40 bg-ivory/5 px-4 py-1.5 text-xs font-medium text-ivory">
                <Home className="h-3.5 w-3.5 text-gold-soft" />
                {readiness.label}
              </span>
              {lastUpdated && (
                <span className="text-[11px] uppercase tracking-[0.18em] text-ivory/50">
                  Updated · {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-ivory/15 bg-ivory/5 backdrop-blur p-6 md:p-7">
              <EyebrowLabel className="!text-ivory/70 [&>span]:!text-ivory/70">Next Milestone</EyebrowLabel>
              <p className="lux-display text-ivory text-lg md:text-xl mt-2 leading-tight">
                {readiness.nextMilestoneLabel}
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-ivory/70">
                  <span className="flex items-center gap-1.5"><Target className="h-3 w-3" /> Progress</span>
                  {pointsToNext != null && pointsToNext > 0 && (
                    <span className="tabular-nums text-gold-soft font-semibold">{pointsToNext} pts</span>
                  )}
                </div>
                <Progress value={readiness.progressPct} className="h-1.5 bg-ivory/10 [&>div]:bg-gradient-gold" />
              </div>
              {d.nextStep && (
                <div className="mt-5 pt-5 border-t border-ivory/10">
                  <EyebrowLabel className="!text-gold-soft [&>span]:!text-gold-soft">Your Next Action</EyebrowLabel>
                  <p className="text-sm text-ivory mt-2 leading-relaxed">{d.nextStep}</p>
                  <Button asChild size="sm" className="mt-4 rounded-full bg-gradient-gold text-midnight hover:opacity-95">
                    <Link to="/client/messages"><MessageSquare className="h-3.5 w-3.5 mr-1.5" />Message Specialist <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </LuxuryCard>

      {/* ============================================================
          2. CREDIT SCORE CENTER — the largest component on page
          ============================================================ */}
      <LuxurySection
        eyebrow="Credit Score Center"
        title="Your Tri-Bureau Scores"
        description="FICO 8 readings across Experian, Equifax, and TransUnion. Updated as new reports are processed."
      >
        {triBureauPending && (
          <p className="mb-4 text-xs text-muted-foreground italic">
            Tri-bureau breakdown is pending your next report sync. Showing blended score on all three.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bureaus.map((b) => (
            <ScoreGauge
              key={b.key}
              label={`${b.label} · FICO 8`}
              current={b.current}
              starting={b.starting}
              updatedAt={lastUpdated}
            />
          ))}
        </div>
        {userId && (
          <div className="mt-6">
            <ScoreHistoryTimeline userId={userId} />
          </div>
        )}
      </LuxurySection>

      {/* ============================================================
          3. BEFORE / AFTER TRANSFORMATION
          ============================================================ */}
      <LuxurySection
        eyebrow="Transformation"
        title="Before vs. Current"
        description="A side-by-side ledger of how your file has changed since onboarding."
      >
        <BeforeAfterPanel rows={transformRows} />
      </LuxurySection>

      {/* ============================================================
          4. RESULTS CENTER — luxury KPI grid
          ============================================================ */}
      <LuxurySection
        eyebrow="Results Center"
        title="What we've removed for you"
        description="Items resolved by your restoration team to date."
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <LuxuryStat
            eyebrow="Accounts Deleted"
            value={d.accountsDeleted}
            hint={d.remainingNegatives > 0 ? `${d.remainingNegatives} remaining` : 'File is clean'}
            icon={XCircle}
            emphasize={d.accountsDeleted > 0}
          />
          <LuxuryStat
            eyebrow="Debt Removed"
            value={d.debtRemoved ? fmtMoney(d.debtRemoved) : '—'}
            icon={TrendingDown}
          />
          <LuxuryStat
            eyebrow="Inquiries Removed"
            value={d.inquiriesRemoved}
            icon={ShieldCheck}
          />
          <LuxuryStat
            eyebrow="Personal Info Removed"
            value={d.personalInfoRemoved}
            icon={Sparkles}
          />
        </div>
      </LuxurySection>

      {/* ============================================================
          5. PROGRESS TIMELINE + CONCIERGE COLUMN
          ============================================================ */}
      <LuxurySection eyebrow="Roadmap" title="Your Credit Progress Timeline">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LuxuryCard className="p-6 md:p-8 lg:col-span-2">
            <ProgressTimeline steps={timelineSteps} />
          </LuxuryCard>

          <div className="space-y-6">
            <LuxuryCard className="p-6">
              <EyebrowLabel withRule>Dispute Activity</EyebrowLabel>
              <h4 className="lux-display text-xl mt-2 text-foreground">Round {round || 0} in progress</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {d.disputesCount} dispute {d.disputesCount === 1 ? 'case' : 'cases'} on file ·{' '}
                {d.remainingNegatives} remaining negatives.
              </p>
              <Progress value={Math.min(100, round * 25)} className="mt-4 h-1.5" />
              <Button asChild size="sm" variant="ghost" className="px-0 mt-3 text-gold-deep hover:text-gold-deep hover:bg-transparent">
                <Link to="/client/disputes">Open dispute center <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </LuxuryCard>

            <LuxuryCard variant="champagne" className="p-6">
              <EyebrowLabel>Account & Billing</EyebrowLabel>
              <h4 className="lux-display text-xl mt-2 text-foreground">
                {fmtMoney(Number(d.paymentSummary?.total_paid || 0))} <span className="text-sm font-normal text-muted-foreground">paid</span>
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {fmtMoney(Number(d.paymentSummary?.total_pending || 0))} pending review.
              </p>
              <Button asChild size="sm" variant="ghost" className="px-0 mt-3 text-gold-deep hover:text-gold-deep hover:bg-transparent">
                <Link to="/client/payments"><Wallet className="h-3.5 w-3.5 mr-1.5" />Manage account</Link>
              </Button>
            </LuxuryCard>

            <div className="grid grid-cols-3 gap-3">
              <MiniLink to="/client/documents" label="Vault"      value={d.documentsPendingCount} icon={FileText} />
              <MiniLink to="/client/agreements" label="Signed"    value={d.agreementsSigned}      icon={ScrollText} />
              <MiniLink to="/client/reports" label="Reports"      value={d.reportsCount}          icon={FileText} />
            </div>
          </div>
        </div>
      </LuxurySection>

      {/* ============================================================
          6. LATEST PAYMENT + REPORT LEDGER
          ============================================================ */}
      {d.latestPayment && (
        <LuxuryCard className="p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10 text-emerald-deep">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <EyebrowLabel>Latest Payment</EyebrowLabel>
              <p className="lux-display text-2xl text-foreground tabular-nums mt-1">
                {fmtMoney(Number(d.latestPayment.payment_amount || 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Posted {new Date(d.latestPayment.reviewed_at || d.latestPayment.submitted_at || '').toLocaleDateString()}
                {' · Ref '}<span className="font-mono">{d.latestPayment.id.slice(0, 8)}</span>
              </p>
            </div>
          </div>
          <Badge className="bg-emerald hover:bg-emerald text-white rounded-full px-3">Cleared</Badge>
        </LuxuryCard>
      )}

      {d.recentReports.length > 0 && (
        <LuxurySection eyebrow="Credit File" title="Recent Reports" divider={false}>
          <LuxuryCard className="p-6 md:p-8">
            <ul className="divide-y divide-border/60">
              {d.recentReports.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.file_name}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      Uploaded {new Date(r.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <MatchStatusBadge
                    status={r.match_status}
                    score={r.match_score}
                    checkedAt={r.match_checked_at}
                    error={r.match_error}
                    compact
                  />
                </li>
              ))}
            </ul>
          </LuxuryCard>
        </LuxurySection>
      )}

      {noData && (
        <LuxuryCard className="p-8 md:p-12 text-center border-dashed">
          <EyebrowLabel className="justify-center" withRule>Welcome</EyebrowLabel>
          <h3 className="lux-display text-2xl mt-3 text-foreground">Your private portfolio is ready.</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            As soon as your specialist uploads your reports and completes your first round of work,
            your scores, results, and timeline will appear here.
          </p>
        </LuxuryCard>
      )}

      {/* Hide unused delta chip import warning */}
      <span className="hidden"><DeltaChip value={0} /></span>
    </div>
  );
}

function MiniLink({ to, label, value, icon: Icon }: { to: string; label: string; value: number; icon: any }) {
  return (
    <Link
      to={to}
      className="lux-surface p-3 flex flex-col items-start gap-1 hover:border-gold-deep/40 hover:bg-secondary/40 transition-colors"
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3 w-3" />{label}
      </span>
      <span className="lux-display text-lg text-foreground tabular-nums">{value}</span>
    </Link>
  );
}

export default function ClientDashboardPage() {
  return (
    <ClientPortalLayout title="Private Dashboard">
      <DashboardInner />
    </ClientPortalLayout>
  );
}