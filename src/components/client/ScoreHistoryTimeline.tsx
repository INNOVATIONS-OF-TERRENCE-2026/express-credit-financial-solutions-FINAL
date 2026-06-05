import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LuxuryCard, EyebrowLabel } from '@/components/luxury';
import { ArrowUpRight, ArrowDownRight, Minus, LineChart as LineChartIcon } from 'lucide-react';

type Bureau = 'experian' | 'equifax' | 'transunion';

interface Point {
  date: string;
  bureau: Bureau;
  score: number;
}

const BUREAU_META: Record<Bureau, { label: string; color: string }> = {
  experian:   { label: 'Experian',   color: 'hsl(160 60% 38%)' },
  equifax:    { label: 'Equifax',    color: 'hsl(220 70% 50%)' },
  transunion: { label: 'TransUnion', color: 'hsl(28 85% 50%)' },
};

function normalizeBureau(raw: string | null | undefined): Bureau | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.startsWith('ex')) return 'experian';
  if (s.startsWith('eq')) return 'equifax';
  if (s.startsWith('tu') || s.startsWith('tr')) return 'transunion';
  return null;
}

export function ScoreHistoryTimeline({ userId }: { userId: string }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      // Prefer score_history (richer); fall back to credit_scores.
      const [histRes, csRes] = await Promise.all([
        (supabase as any)
          .from('score_history')
          .select('bureau, score_value, recorded_at')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: true })
          .limit(120),
        (supabase as any)
          .from('credit_scores')
          .select('bureau, score, score_date')
          .eq('user_id', userId)
          .order('score_date', { ascending: true })
          .limit(120),
      ]);

      const collected: Point[] = [];
      for (const r of histRes.data ?? []) {
        const b = normalizeBureau(r.bureau);
        if (b && r.score_value != null && r.recorded_at) {
          collected.push({ bureau: b, score: Number(r.score_value), date: r.recorded_at });
        }
      }
      for (const r of csRes.data ?? []) {
        const b = normalizeBureau(r.bureau);
        if (b && r.score != null && r.score_date) {
          collected.push({ bureau: b, score: Number(r.score), date: r.score_date });
        }
      }
      if (alive) {
        collected.sort((a, b) => a.date.localeCompare(b.date));
        setPoints(collected);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  const series = useMemo(() => {
    const grouped: Record<Bureau, Point[]> = { experian: [], equifax: [], transunion: [] };
    for (const p of points) grouped[p.bureau].push(p);
    return grouped;
  }, [points]);

  const { width, height, padL, padR, padT, padB, xFor, yFor, ticks, latestPoints, minScore, maxScore } = useMemo(() => {
    const width = 720, height = 220;
    const padL = 40, padR = 24, padT = 16, padB = 28;
    const allScores = points.map((p) => p.score);
    const rawMin = allScores.length ? Math.min(...allScores) : 500;
    const rawMax = allScores.length ? Math.max(...allScores) : 750;
    const minScore = Math.max(300, Math.floor((rawMin - 20) / 20) * 20);
    const maxScore = Math.min(850, Math.ceil((rawMax + 20) / 20) * 20);
    const span = Math.max(1, maxScore - minScore);
    const times = points.map((p) => new Date(p.date).getTime());
    const t0 = times.length ? Math.min(...times) : 0;
    const t1 = times.length ? Math.max(...times) : 1;
    const tSpan = Math.max(1, t1 - t0);
    const xFor = (iso: string) => padL + ((new Date(iso).getTime() - t0) / tSpan) * (width - padL - padR);
    const yFor = (s: number) => padT + (1 - (s - minScore) / span) * (height - padT - padB);
    const tickCount = 4;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round(minScore + (span * i) / tickCount));
    const latestPoints: { bureau: Bureau; point: Point | null }[] = (Object.keys(series) as Bureau[]).map((b) => ({
      bureau: b,
      point: series[b][series[b].length - 1] ?? null,
    }));
    return { width, height, padL, padR, padT, padB, xFor, yFor, ticks, latestPoints, minScore, maxScore };
  }, [points, series]);

  // Identify the single most-recent change across all bureaus to highlight.
  const highlight = useMemo(() => {
    let best: { bureau: Bureau; prev: Point; curr: Point } | null = null;
    let bestTime = -Infinity;
    for (const b of Object.keys(series) as Bureau[]) {
      const arr = series[b];
      if (arr.length < 2) continue;
      const curr = arr[arr.length - 1];
      const prev = arr[arr.length - 2];
      const t = new Date(curr.date).getTime();
      if (t > bestTime) { bestTime = t; best = { bureau: b, prev, curr }; }
    }
    return best;
  }, [series]);

  return (
    <LuxuryCard className="p-6 md:p-8">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <EyebrowLabel withRule>
            <LineChartIcon className="h-3 w-3" /> Score History
          </EyebrowLabel>
          <h3 className="lux-display text-xl md:text-2xl mt-2 text-foreground">
            Your tri-bureau movement over time
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Each point represents a recorded score from a credit report or sync. The most recent change is highlighted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BUREAU_META) as Bureau[]).map((b) => (
            <span key={b} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
              <span className="h-2 w-3 rounded-sm" style={{ background: BUREAU_META[b].color }} />
              {BUREAU_META[b].label}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground italic py-10 text-center">Loading score history…</p>
      ) : points.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-background/40 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No historical scores recorded yet. Your timeline will populate as new reports are processed.
          </p>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px] min-w-[560px]">
              {/* Y grid + labels */}
              {ticks.map((t) => (
                <g key={t}>
                  <line
                    x1={padL} x2={width - padR}
                    y1={yFor(t)} y2={yFor(t)}
                    stroke="hsl(var(--border))" strokeOpacity="0.5" strokeDasharray="2 3"
                  />
                  <text x={padL - 6} y={yFor(t) + 3} fontSize="9" textAnchor="end" fill="hsl(var(--muted-foreground))">
                    {t}
                  </text>
                </g>
              ))}

              {/* Series */}
              {(Object.keys(series) as Bureau[]).map((b) => {
                const arr = series[b];
                if (arr.length === 0) return null;
                const color = BUREAU_META[b].color;
                const path = arr
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.date).toFixed(1)} ${yFor(p.score).toFixed(1)}`)
                  .join(' ');
                return (
                  <g key={b}>
                    {arr.length > 1 && (
                      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {arr.map((p, i) => (
                      <circle
                        key={i}
                        cx={xFor(p.date)}
                        cy={yFor(p.score)}
                        r={i === arr.length - 1 ? 4 : 2.5}
                        fill={color}
                        stroke="hsl(var(--background))"
                        strokeWidth="1.5"
                      >
                        <title>{`${BUREAU_META[b].label} · ${p.score} on ${new Date(p.date).toLocaleDateString()}`}</title>
                      </circle>
                    ))}
                  </g>
                );
              })}

              {/* Highlight latest change */}
              {highlight && (
                <g>
                  <circle
                    cx={xFor(highlight.curr.date)}
                    cy={yFor(highlight.curr.score)}
                    r="9"
                    fill="none"
                    stroke={BUREAU_META[highlight.bureau].color}
                    strokeOpacity="0.5"
                    strokeWidth="1.5"
                  >
                    <animate attributeName="r" values="6;12;6" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.6;0.05;0.6" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                </g>
              )}
            </svg>
          </div>

          {/* Summary row */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {latestPoints.map(({ bureau, point }) => {
              const arr = series[bureau];
              const prev = arr.length > 1 ? arr[arr.length - 2] : null;
              const delta = point && prev ? point.score - prev.score : null;
              const Trend = delta == null ? Minus : delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
              const trendColor =
                delta == null || delta === 0 ? 'text-muted-foreground' : delta > 0 ? 'text-emerald-deep' : 'text-rose-500';
              const isHighlighted = highlight?.bureau === bureau;
              return (
                <div
                  key={bureau}
                  className={`rounded-lg border px-3 py-2.5 ${
                    isHighlighted
                      ? 'border-gold-deep/60 bg-gold-soft/10'
                      : 'border-border/50 bg-background/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: BUREAU_META[bureau].color }} />
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                      {BUREAU_META[bureau].label}
                    </span>
                    {isHighlighted && (
                      <span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-gold-deep">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="lux-display text-2xl tabular-nums text-foreground">
                      {point?.score ?? '—'}
                    </span>
                    {delta != null && (
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${trendColor}`}>
                        <Trend className="h-3 w-3" />
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                    {point ? new Date(point.date).toLocaleDateString() : 'No history yet'}
                    {prev && ` · prev ${prev.score}`}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-4 tabular-nums">
            Range shown: {minScore}–{maxScore} · {points.length} data point{points.length === 1 ? '' : 's'}
          </p>
        </>
      )}
    </LuxuryCard>
  );
}