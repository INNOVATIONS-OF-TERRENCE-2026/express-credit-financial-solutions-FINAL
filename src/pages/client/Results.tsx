import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { useClientPortalData } from '@/hooks/useClientPortalData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ResultsInner() {
  const { clientId, userId } = useClient();
  const d = useClientPortalData(clientId, userId);
  if (d.loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const rows = [
    { bureau: 'Equifax', start: d.client?.starting_score_eq, current: d.client?.current_score_eq },
    { bureau: 'TransUnion', start: d.client?.starting_score_tu, current: d.client?.current_score_tu },
    { bureau: 'Experian', start: d.client?.starting_score_ex, current: d.client?.current_score_ex },
  ];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Before vs Current</CardTitle><CardDescription>Tracked per bureau</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rows.map((r) => (
            <Card key={r.bureau}>
              <CardHeader className="pb-2"><CardDescription>{r.bureau}</CardDescription></CardHeader>
              <CardContent>
                <p className="text-sm">Start: <strong>{r.start ?? '—'}</strong></p>
                <p className="text-sm">Current: <strong className="text-amber-500">{r.current ?? '—'}</strong></p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClientResultsPage() {
  return <ClientPortalLayout title="Results"><ResultsInner /></ClientPortalLayout>;
}