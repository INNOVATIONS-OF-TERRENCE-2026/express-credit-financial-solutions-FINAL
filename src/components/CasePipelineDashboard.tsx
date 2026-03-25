import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANTS,
  type CaseStatus,
  type DisputeLetterRow,
} from '@/services/disputeWorkflow';
import { cn } from '@/lib/utils';

export function CasePipelineDashboard() {
  const [disputes, setDisputes] = useState<DisputeLetterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<CaseStatus | null>(null);

  useEffect(() => {
    fetchDisputes();
    const channel = supabase
      .channel('pipeline-disputes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispute_letters' }, () => { fetchDisputes(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDisputes = async () => {
    const { data, error } = await supabase.from('dispute_letters').select('*').order('created_at', { ascending: false });
    if (!error) setDisputes((data || []) as unknown as DisputeLetterRow[]);
    setLoading(false);
  };

  const statuses = Object.keys(CASE_STATUS_LABELS) as CaseStatus[];
  const getDisputesForStatus = (status: CaseStatus) => disputes.filter((d) => (d.case_status || 'intake_received') === status);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex gap-3 overflow-x-auto">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[400px] min-w-[220px]" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredDisputes = activeStatus ? getDisputesForStatus(activeStatus) : disputes;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-foreground">Case Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Pipeline segments */}
        <div className="flex gap-1 overflow-x-auto pb-4 mb-4">
          <button
            onClick={() => setActiveStatus(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              activeStatus === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent/10'
            )}
          >
            All ({disputes.length})
          </button>
          {statuses.map((status) => {
            const count = getDisputesForStatus(status).length;
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(activeStatus === status ? null : status)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                  activeStatus === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent/10'
                )}
              >
                {CASE_STATUS_LABELS[status]} ({count})
              </button>
            );
          })}
        </div>

        {/* Cards */}
        {filteredDisputes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No disputes found for this status.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDisputes.map((d) => (
              <Card key={d.id} className="glass-card-hover">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium truncate text-foreground">{d.creditor_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.account_number ? `****${d.account_number.slice(-4)}` : 'N/A'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">{CASE_STATUS_LABELS[(d.case_status || 'intake_received') as CaseStatus]}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
