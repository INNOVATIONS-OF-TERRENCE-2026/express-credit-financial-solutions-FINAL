import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, CheckCircle, AlertCircle, Mail, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays } from 'date-fns';

interface DisputeTimelineEntry {
  id: string;
  creditor_name: string;
  account_number: string;
  date_generated: string | null;
  date_mailed: string | null;
  estimated_response_date: string | null;
  actual_response_date: string | null;
  deadline_date: string | null;
  outcome: string | null;
  status: string;
  created_at: string;
}

export function DisputeTimelineTracker() {
  const [timeline, setTimeline] = useState<DisputeTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchTimeline(); }, []);

  const fetchTimeline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('dispute_timeline').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setTimeline(data || []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast({ title: "Error", description: "Failed to load dispute timeline", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const updateTimelineEntry = async (id: string, updates: Partial<DisputeTimelineEntry>) => {
    try {
      const { error } = await supabase.from('dispute_timeline').update(updates).eq('id', id);
      if (error) throw error;
      await fetchTimeline();
      toast({ title: "Success", description: "Timeline updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update timeline", variant: "destructive" });
    }
  };

  const markAsMailed = (entry: DisputeTimelineEntry) => {
    const mailedDate = new Date().toISOString();
    updateTimelineEntry(entry.id, {
      date_mailed: mailedDate,
      estimated_response_date: addDays(new Date(), 30).toISOString(),
      deadline_date: addDays(new Date(), 30).toISOString(),
      status: 'mailed'
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      'generated': { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: FileText },
      'mailed': { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Mail },
      'responded': { color: 'bg-violet-500/10 text-violet-500 border-violet-500/20', icon: AlertCircle },
      'completed': { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
    };
    const config = configs[status] || configs['generated'];
    const Icon = config.icon;
    return <Badge className={config.color}><Icon className="h-3 w-3 mr-1" />{status.toUpperCase()}</Badge>;
  };

  const getDaysUntilDeadline = (entry: DisputeTimelineEntry): number | null => {
    if (!entry.deadline_date || entry.actual_response_date) return null;
    return differenceInDays(new Date(entry.deadline_date), new Date());
  };

  const getDeadlineBadge = (entry: DisputeTimelineEntry) => {
    const daysLeft = getDaysUntilDeadline(entry);
    if (daysLeft === null) return null;
    if (daysLeft < 0) return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="h-3 w-3 mr-1" />Overdue ({Math.abs(daysLeft)}d)</Badge>;
    if (daysLeft <= 5) return <Badge className="bg-destructive/10 text-destructive border-destructive/20 animate-pulse"><AlertTriangle className="h-3 w-3 mr-1" />{daysLeft}d left</Badge>;
    if (daysLeft <= 10) return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="h-3 w-3 mr-1" />{daysLeft}d left</Badge>;
    return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><Calendar className="h-3 w-3 mr-1" />{daysLeft}d left</Badge>;
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;
    const colors: Record<string, string> = {
      'removed': 'bg-green-500/10 text-green-500',
      'updated': 'bg-blue-500/10 text-blue-500',
      'verified': 'bg-destructive/10 text-destructive',
      'rejected': 'bg-destructive/10 text-destructive',
      'pending': 'bg-amber-500/10 text-amber-500',
    };
    return <Badge className={colors[outcome] || 'bg-muted text-muted-foreground'}>{outcome.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground"><Clock className="h-5 w-5 text-primary" />Dispute Timeline Tracker</CardTitle>
        <CardDescription>Track your credit disputes from generation to completion</CardDescription>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No dispute timeline entries found.</p>
            <p className="text-sm text-muted-foreground mt-2">Timeline entries appear after you generate dispute letters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((entry) => {
              const daysLeft = getDaysUntilDeadline(entry);
              const isUrgent = daysLeft !== null && daysLeft <= 5 && daysLeft >= 0;
              return (
                <div key={entry.id} className={`border border-border rounded-lg p-4 space-y-3 ${isUrgent ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{entry.creditor_name}</h3>
                      <p className="text-sm text-muted-foreground">Account: {entry.account_number}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {getStatusBadge(entry.status)}
                      {getOutcomeBadge(entry.outcome)}
                      {getDeadlineBadge(entry)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    {[
                      { icon: FileText, label: 'Generated', value: entry.date_generated ? format(new Date(entry.date_generated), 'MMM dd, yyyy') : format(new Date(entry.created_at), 'MMM dd, yyyy') },
                      { icon: Mail, label: 'Mailed', value: entry.date_mailed ? format(new Date(entry.date_mailed), 'MMM dd, yyyy') : 'Not mailed' },
                      { icon: Calendar, label: 'Expected', value: entry.estimated_response_date ? format(new Date(entry.estimated_response_date), 'MMM dd, yyyy') : 'TBD' },
                      { icon: Clock, label: '30-Day Deadline', value: entry.deadline_date ? format(new Date(entry.deadline_date), 'MMM dd, yyyy') : 'TBD' },
                      { icon: CheckCircle, label: 'Response', value: entry.actual_response_date ? format(new Date(entry.actual_response_date), 'MMM dd, yyyy') : 'Pending' },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div><p className="font-medium text-foreground">{item.label}</p><p className="text-muted-foreground">{item.value}</p></div>
                        </div>
                      );
                    })}
                  </div>
                  {entry.status === 'generated' && !entry.date_mailed && (
                    <div className="pt-2"><Button variant="outline" size="sm" onClick={() => markAsMailed(entry)}><Mail className="h-4 w-4 mr-2" />Mark as Mailed</Button></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
