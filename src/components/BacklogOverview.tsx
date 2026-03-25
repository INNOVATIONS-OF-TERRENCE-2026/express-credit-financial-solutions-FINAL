import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getBacklogCounts,
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANTS,
  type BacklogCounts,
  type CaseStatus,
} from '@/services/disputeWorkflow';
import { Inbox, AlertTriangle, CheckCircle, Clock, FileSearch, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STATUS_ICONS: Partial<Record<CaseStatus, any>> = {
  intake_received: Inbox,
  needs_admin_review: AlertTriangle,
  approved: CheckCircle,
  followup_due: Clock,
  extracted: FileSearch,
  exported: Send,
};

export function BacklogOverview() {
  const [counts, setCounts] = useState<BacklogCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBacklogCounts()
      .then(setCounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!counts) return null;

  const statuses = Object.keys(CASE_STATUS_LABELS) as CaseStatus[];
  const total = statuses.reduce((sum, s) => sum + (counts[s] || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Pipeline Overview</h3>
        <Badge variant="outline">{total} total disputes</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statuses.map((status) => {
          const Icon = STATUS_ICONS[status] || Inbox;
          const count = counts[status] || 0;
          return (
            <Card key={status} className={cn('glass-card-hover', count > 0 && 'border-primary/20')}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="rounded-md p-1 bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium truncate text-foreground">
                    {CASE_STATUS_LABELS[status]}
                  </span>
                </div>
                <div className="stat-number text-2xl">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
