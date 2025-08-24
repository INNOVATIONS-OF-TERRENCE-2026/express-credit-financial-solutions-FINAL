import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, AlertCircle, Mail, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays, isPast } from 'date-fns';

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

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dispute_timeline')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimeline(data || []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast({
        title: "Error",
        description: "Failed to load dispute timeline",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTimelineEntry = async (id: string, updates: Partial<DisputeTimelineEntry>) => {
    try {
      const { error } = await supabase
        .from('dispute_timeline')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchTimeline();
      toast({
        title: "Success",
        description: "Timeline updated successfully",
      });
    } catch (error) {
      console.error('Error updating timeline:', error);
      toast({
        title: "Error",
        description: "Failed to update timeline",
        variant: "destructive",
      });
    }
  };

  const markAsMailed = (entry: DisputeTimelineEntry) => {
    const mailedDate = new Date().toISOString();
    const estimatedResponse = addDays(new Date(), 30).toISOString();
    const deadlineDate = addDays(new Date(), 30).toISOString();
    
    updateTimelineEntry(entry.id, {
      date_mailed: mailedDate,
      estimated_response_date: estimatedResponse,
      deadline_date: deadlineDate,
      status: 'mailed'
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      'generated': { color: 'bg-blue-100 text-blue-800', icon: FileText },
      'mailed': { color: 'bg-yellow-100 text-yellow-800', icon: Mail },
      'responded': { color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };
    
    const config = configs[status] || configs['generated'];
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getDaysUntilDeadline = (entry: DisputeTimelineEntry): number | null => {
    if (!entry.deadline_date || entry.actual_response_date) return null;
    const deadlineDate = new Date(entry.deadline_date);
    const today = new Date();
    return differenceInDays(deadlineDate, today);
  };

  const getDeadlineBadge = (entry: DisputeTimelineEntry) => {
    const daysLeft = getDaysUntilDeadline(entry);
    
    if (daysLeft === null) return null;
    
    if (daysLeft < 0) {
      return (
        <Badge className="bg-red-500 text-white">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overdue ({Math.abs(daysLeft)} days)
        </Badge>
      );
    } else if (daysLeft <= 5) {
      return (
        <Badge className="bg-red-100 text-red-800 animate-pulse">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
        </Badge>
      );
    } else if (daysLeft <= 10) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          {daysLeft} days left
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Calendar className="h-3 w-3 mr-1" />
          {daysLeft} days left
        </Badge>
      );
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;
    
    const colors: Record<string, string> = {
      'removed': 'bg-green-100 text-green-800',
      'updated': 'bg-blue-100 text-blue-800',
      'verified': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={colors[outcome] || 'bg-gray-100 text-gray-800'}>
        {outcome.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading timeline...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Dispute Timeline Tracker
        </CardTitle>
        <CardDescription>
          Track the progress of your credit disputes from generation to completion
        </CardDescription>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No dispute timeline entries found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Timeline entries will appear here after you generate dispute letters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((entry) => (
              <div key={entry.id} className={`border rounded-lg p-4 space-y-3 ${
                getDaysUntilDeadline(entry) !== null && getDaysUntilDeadline(entry)! <= 5 && getDaysUntilDeadline(entry)! >= 0
                  ? 'border-red-200 bg-red-50/50' 
                  : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{entry.creditor_name}</h3>
                    <p className="text-sm text-muted-foreground">Account: {entry.account_number}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {getStatusBadge(entry.status)}
                    {getOutcomeBadge(entry.outcome)}
                    {getDeadlineBadge(entry)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Generated</p>
                      <p className="text-muted-foreground">
                        {entry.date_generated 
                          ? format(new Date(entry.date_generated), 'MMM dd, yyyy')
                          : format(new Date(entry.created_at), 'MMM dd, yyyy')
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Mailed</p>
                      <p className="text-muted-foreground">
                        {entry.date_mailed 
                          ? format(new Date(entry.date_mailed), 'MMM dd, yyyy')
                          : 'Not mailed'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Expected Response</p>
                      <p className="text-muted-foreground">
                        {entry.estimated_response_date 
                          ? format(new Date(entry.estimated_response_date), 'MMM dd, yyyy')
                          : 'TBD'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">30-Day Deadline</p>
                      <p className={`text-muted-foreground ${
                        getDaysUntilDeadline(entry) !== null && getDaysUntilDeadline(entry)! <= 5 && getDaysUntilDeadline(entry)! >= 0
                          ? 'text-red-600 font-medium' 
                          : ''
                      }`}>
                        {entry.deadline_date 
                          ? format(new Date(entry.deadline_date), 'MMM dd, yyyy')
                          : 'TBD'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Actual Response</p>
                      <p className="text-muted-foreground">
                        {entry.actual_response_date 
                          ? format(new Date(entry.actual_response_date), 'MMM dd, yyyy')
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {entry.status === 'generated' && !entry.date_mailed && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsMailed(entry)}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Mark as Mailed
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}