import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANTS,
  type CaseStatus,
  type DisputeLetterRow,
} from '@/services/disputeWorkflow';

export function CasePipelineDashboard() {
  const [disputes, setDisputes] = useState<DisputeLetterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();

    const channel = supabase
      .channel('pipeline-disputes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispute_letters' }, () => {
        fetchDisputes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDisputes = async () => {
    const { data, error } = await supabase
      .from('dispute_letters')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setDisputes((data || []) as unknown as DisputeLetterRow[]);
    setLoading(false);
  };

  const statuses = Object.keys(CASE_STATUS_LABELS) as CaseStatus[];

  const getDisputesForStatus = (status: CaseStatus) =>
    disputes.filter((d) => (d.case_status || 'intake_received') === status);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">Loading pipeline...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const items = getDisputesForStatus(status);
            return (
              <div key={status} className="min-w-[220px] flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={CASE_STATUS_VARIANTS[status]}>
                    {CASE_STATUS_LABELS[status]}
                  </Badge>
                  <span className="text-sm font-bold text-muted-foreground">{items.length}</span>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center p-4 border border-dashed rounded-lg">
                        Empty
                      </div>
                    ) : (
                      items.map((d) => (
                        <Card key={d.id} className="p-3">
                          <p className="text-sm font-medium truncate">{d.creditor_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {d.account_number ? `****${d.account_number.slice(-4)}` : 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(d.created_at).toLocaleDateString()}
                          </p>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
