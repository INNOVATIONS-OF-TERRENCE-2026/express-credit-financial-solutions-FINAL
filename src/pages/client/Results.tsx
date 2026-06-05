import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { useClientPortalData } from '@/hooks/useClientPortalData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreGauge } from '@/components/client/ScoreGauge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

function ResultsInner() {
  const { clientId, userId } = useClient();
  const d = useClientPortalData(clientId, userId);
  const [tab, setTab] = useState<'ex' | 'eq' | 'tu'>('ex');
  if (d.loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const bureaus = [
    { key: 'ex' as const, label: 'Experian',  start: d.client?.starting_score_ex, current: d.client?.current_score_ex },
    { key: 'eq' as const, label: 'Equifax',   start: d.client?.starting_score_eq, current: d.client?.current_score_eq },
    { key: 'tu' as const, label: 'TransUnion',start: d.client?.starting_score_tu, current: d.client?.current_score_tu },
  ];
  const active = bureaus.find((b) => b.key === tab) ?? bureaus[0];
  const updatedAt = (d.client as any)?.updated_at ?? null;

  return (
    <div className="space-y-6">
      {/* Bureau tabs */}
      <div className="inline-flex rounded-lg border border-border/60 p-1 bg-muted/30">
        {bureaus.map((b) => (
          <Button
            key={b.key}
            size="sm"
            variant={tab === b.key ? 'default' : 'ghost'}
            onClick={() => setTab(b.key)}
            className="rounded-md px-4"
          >
            {b.label}
          </Button>
        ))}
      </div>

      {/* Featured bureau gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ScoreGauge
            label={`${active.label} · FICO 8`}
            current={active.current ?? null}
            starting={active.start ?? null}
            updatedAt={updatedAt}
          />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">All Bureaus</CardTitle>
            <CardDescription className="text-xs">Side-by-side comparison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {bureaus.map((b) => {
              const ch = b.current != null && b.start != null ? b.current - b.start : null;
              return (
                <div key={b.key} className="flex items-center justify-between rounded-md border border-border/40 p-2.5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{b.label}</p>
                    <p className="text-xl font-bold tabular-nums">{b.current ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Start: {b.start ?? '—'}</p>
                    <p className={`text-xs font-semibold ${ch == null ? 'text-muted-foreground' : ch >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {ch == null ? '—' : ch >= 0 ? `+${ch}` : ch} pts
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">About Your Score</CardTitle>
          <CardDescription className="text-xs">
            Your FICO score reflects the most recent bureau data reviewed by your Express Credit specialist.
            Scores are tracked across all three bureaus and updated as deletions, debt removals, and
            inquiry/personal-information corrections post to your file.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function ClientResultsPage() {
  return <ClientPortalLayout title="Progress Center"><ResultsInner /></ClientPortalLayout>;
}