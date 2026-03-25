import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { 
  Zap, Bell, Clock, AlertTriangle, CheckCircle, RotateCw, Activity, 
  Mail, MessageSquare, Smartphone, FileText, TrendingUp, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AutomationControlCenter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sentToday: 0, pendingEvents: 0, failedAuto: 0, scoreUpdates: 0, followups: 0, activeAuto: 0 });

  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const [eventsRes, notifsRes, timelineRes, templatesRes, predsRes, clientsRes] = await Promise.all([
      supabase.from('automation_events' as any).select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('client_notifications' as any).select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('client_activity_timeline' as any).select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('notification_templates' as any).select('*').order('event_type'),
      supabase.from('score_predictions' as any).select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('clients').select('id, full_name'),
    ]);

    const evts = (eventsRes.data || []) as any[];
    const notifs = (notifsRes.data || []) as any[];

    setEvents(evts);
    setNotifications(notifs);
    setTimeline((timelineRes.data || []) as any[]);
    setTemplates((templatesRes.data || []) as any[]);
    setPredictions((predsRes.data || []) as any[]);
    setClients((clientsRes.data || []) as any[]);

    setStats({
      sentToday: notifs.filter(n => n.status === 'sent' && n.created_at?.startsWith(today)).length,
      pendingEvents: evts.filter(e => e.status === 'pending').length,
      failedAuto: evts.filter(e => e.status === 'failed').length,
      scoreUpdates: evts.filter(e => e.event_type === 'score_updated' && e.created_at?.startsWith(today)).length,
      followups: evts.filter(e => e.event_type === 'followup_due' && e.status !== 'processed').length,
      activeAuto: evts.filter(e => e.status === 'processing').length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeRefresh(['automation_events', 'client_notifications', 'client_activity_timeline'], fetchData);

  const getClientName = (id: string | null) => id ? (clients.find(c => c.id === id)?.full_name || id.slice(0, 8)) : '—';

  const rerunEvent = async (event: any) => {
    try {
      await supabase.functions.invoke('process-automation-event', {
        body: { event_type: event.event_type, client_id: event.client_id, user_id: event.user_id, payload: event.payload, source: 'admin_rerun' },
      });
      toast({ title: 'Re-run triggered' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const toggleTemplate = async (tpl: any) => {
    await supabase.from('notification_templates' as any).update({ is_active: !tpl.is_active, updated_at: new Date().toISOString() } as any).eq('id', tpl.id);
    fetchData();
  };

  const updateTemplate = async (tpl: any, field: string, value: string) => {
    await supabase.from('notification_templates' as any).update({ [field]: value, updated_at: new Date().toISOString() } as any).eq('id', tpl.id);
    toast({ title: 'Template updated' });
    fetchData();
  };

  const generatePrediction = async (clientId: string) => {
    toast({ title: 'Generating prediction...' });
    try {
      await supabase.functions.invoke('predict-credit-score', { body: { client_id: clientId } });
      toast({ title: 'Prediction generated' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Activity className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-3 bg-green-500/10 text-green-500"><Zap className="h-7 w-7" /></div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Automation Control Center</h2>
          <p className="text-sm text-muted-foreground">Monitor events, notifications, and automated workflows</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Event Queue</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Notifications Today', value: stats.sentToday, icon: Bell, color: 'text-blue-500 bg-blue-500/10' },
              { label: 'Pending Events', value: stats.pendingEvents, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
              { label: 'Failed Automations', value: stats.failedAuto, icon: AlertTriangle, color: 'text-red-500 bg-red-500/10' },
              { label: 'Score Updates Today', value: stats.scoreUpdates, icon: TrendingUp, color: 'text-green-500 bg-green-500/10' },
              { label: 'Follow-ups Due', value: stats.followups, icon: FileText, color: 'text-purple-500 bg-purple-500/10' },
              { label: 'Active Processing', value: stats.activeAuto, icon: Activity, color: 'text-cyan-500 bg-cyan-500/10' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <Card key={s.label}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                      </div>
                      <div className={cn('rounded-lg p-2.5', s.color)}><Icon className="h-5 w-5" /></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Provider Status */}
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Provider Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span className="text-sm">Email</span><Badge variant="default">Active</Badge></div>
                <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /><span className="text-sm">In-App</span><Badge variant="default">Active</Badge></div>
                <div className="flex items-center gap-2"><Smartphone className="h-4 w-4" /><span className="text-sm">SMS/Twilio</span><Badge variant="secondary">Not Connected</Badge></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Queue */}
        <TabsContent value="events">
          <Card>
            <CardHeader><CardTitle>Automation Events</CardTitle><CardDescription>Central event queue for all automation triggers</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.slice(0, 50).map(e => (
                      <TableRow key={e.id}>
                        <TableCell><Badge variant="outline" className="text-[10px]">{e.event_type}</Badge></TableCell>
                        <TableCell className="text-sm">{getClientName(e.client_id)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{e.event_source}</TableCell>
                        <TableCell>
                          <Badge variant={e.status === 'processed' ? 'default' : e.status === 'failed' ? 'destructive' : 'secondary'}>{e.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          {e.status === 'failed' && (
                            <Button size="sm" variant="outline" onClick={() => rerunEvent(e)}><RotateCw className="h-3 w-3 mr-1" />Re-run</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {events.length === 0 && <p className="text-center py-8 text-muted-foreground">No automation events yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notification Log</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.slice(0, 50).map(n => (
                      <TableRow key={n.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {n.channel === 'in_app' ? <MessageSquare className="h-3 w-3 inline mr-1" /> : n.channel === 'email' ? <Mail className="h-3 w-3 inline mr-1" /> : <Smartphone className="h-3 w-3 inline mr-1" />}
                            {n.channel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{n.notification_type}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{n.subject}</TableCell>
                        <TableCell>
                          <Badge variant={n.status === 'sent' ? 'default' : n.status === 'failed' ? 'destructive' : n.status === 'skipped' ? 'secondary' : 'outline'}>{n.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{new Date(n.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {notifications.length === 0 && <p className="text-center py-8 text-muted-foreground">No notifications sent yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader><CardTitle>Activity Timeline (Admin View)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeline.slice(0, 50).map(t => (
                  <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="rounded-full p-1.5 bg-primary/10 text-primary mt-0.5">
                      <Activity className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{t.title}</p>
                        {!t.visible_to_client && <Badge variant="outline" className="text-[9px]">Admin Only</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{getClientName(t.client_id)}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && <p className="text-center py-8 text-muted-foreground">No activity entries yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader><CardTitle>Notification Templates</CardTitle><CardDescription>Edit message templates for automated notifications</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map(tpl => (
                  <div key={tpl.id} className="p-4 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{tpl.event_type}</Badge>
                      <Switch checked={tpl.is_active} onCheckedChange={() => toggleTemplate(tpl)} />
                    </div>
                    <Input
                      defaultValue={tpl.subject_template}
                      placeholder="Subject"
                      className="text-sm"
                      onBlur={(e) => { if (e.target.value !== tpl.subject_template) updateTemplate(tpl, 'subject_template', e.target.value); }}
                    />
                    <Textarea
                      defaultValue={tpl.message_template}
                      placeholder="Message"
                      className="text-sm"
                      rows={2}
                      onBlur={(e) => { if (e.target.value !== tpl.message_template) updateTemplate(tpl, 'message_template', e.target.value); }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Score Predictions</CardTitle>
              <CardDescription>AI-estimated score ranges per client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                {clients.slice(0, 10).map(c => (
                  <Button key={c.id} size="sm" variant="outline" onClick={() => generatePrediction(c.id)}>
                    <TrendingUp className="h-3 w-3 mr-1" />{c.full_name}
                  </Button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Predicted Range</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{getClientName(p.client_id)}</TableCell>
                        <TableCell className="text-xs">
                          E:{p.current_experian || '—'} Q:{p.current_equifax || '—'} T:{p.current_transunion || '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          E:{p.predicted_experian_min || '—'}–{p.predicted_experian_max || '—'} 
                          Q:{p.predicted_equifax_min || '—'}–{p.predicted_equifax_max || '—'} 
                          T:{p.predicted_transunion_min || '—'}–{p.predicted_transunion_max || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.confidence_level >= 0.7 ? 'default' : 'secondary'}>{Math.round((p.confidence_level || 0) * 100)}%</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {predictions.length === 0 && <p className="text-center py-8 text-muted-foreground">No predictions generated yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
