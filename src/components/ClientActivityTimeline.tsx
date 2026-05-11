import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, Upload, Brain, Shield, TrendingUp, User, Bell, Clock, Activity 
} from 'lucide-react';

const ICONS: Record<string, any> = {
  document: Upload,
  credit_report: FileText,
  analysis: Brain,
  dispute: Shield,
  score: TrendingUp,
  profile: User,
  admin: Bell,
  followup: Clock,
  system: Activity,
};

type FilterKey = 'all' | 'documents' | 'ai' | 'disputes' | 'notes';

const FILTERS: { key: FilterKey; label: string; match: (t: string) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'documents', label: 'Documents', match: t => /document|credit_report|upload|file/i.test(t) },
  { key: 'ai', label: 'AI & Agent', match: t => /ai|analysis|agent|assistant|response/i.test(t) },
  { key: 'disputes', label: 'Disputes', match: t => /dispute|letter|bureau/i.test(t) },
  { key: 'notes', label: 'Notes', match: t => /note|admin|message|comment/i.test(t) },
];

interface Props {
  userId?: string;
  clientId?: string;
  showAdminOnly?: boolean;
  limit?: number;
}

export function ClientActivityTimeline({ userId, clientId, showAdminOnly = false, limit = 30 }: Props) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    fetchTimeline();
    
    // Realtime subscription
    const filter = userId ? `user_id=eq.${userId}` : clientId ? `client_id=eq.${clientId}` : undefined;
    if (!filter) return;
    
    const channel = supabase.channel('timeline-' + (userId || clientId))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'client_activity_timeline', filter }, () => fetchTimeline())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [userId, clientId]);

  const fetchTimeline = async () => {
    let query = supabase.from('client_activity_timeline' as any).select('*').order('created_at', { ascending: false }).limit(limit);
    if (userId) query = query.eq('user_id', userId);
    else if (clientId) query = query.eq('client_id', clientId);
    if (!showAdminOnly) query = query.eq('visible_to_client', true);
    
    const { data } = await query;
    setEntries((data || []) as any[]);
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Activity className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const activeFilter = FILTERS.find(f => f.key === filter) || FILTERS[0];
  const visible = entries.filter(e => activeFilter.match(String(e.activity_type || '')));

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>No activity yet. Your progress will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" />Activity Timeline</CardTitle>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => {
            const count = f.key === 'all' ? entries.length : entries.filter(e => f.match(String(e.activity_type || ''))).length;
            const active = filter === f.key;
            return (
              <Button
                key={f.key}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => setFilter(f.key)}
                className="h-9 px-3 text-xs"
              >
                {f.label}
                <span className={`ml-2 rounded-full px-1.5 text-[10px] ${active ? 'bg-background/20' : 'bg-muted'}`}>{count}</span>
              </Button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No entries match this filter.</p>
        ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {visible.map(entry => {
              const Icon = ICONS[entry.activity_type] || Activity;
              return (
                <div key={entry.id} className="relative flex items-start gap-3 pl-8">
                  <div className="absolute left-2.5 mt-1 rounded-full p-1 bg-primary/10 text-primary border-2 border-background z-10">
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{entry.title}</p>
                      {!entry.visible_to_client && <Badge variant="outline" className="text-[9px]">Internal</Badge>}
                    </div>
                    {entry.description && <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
