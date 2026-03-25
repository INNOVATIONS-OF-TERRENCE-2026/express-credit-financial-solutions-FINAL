import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { Bot, CheckCircle, XCircle, AlertTriangle, Activity, Users, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutonomousSettings {
  id: string;
  autonomous_enabled: boolean;
  auto_attach_threshold: number;
  review_threshold: number;
  auto_generate_disputes: boolean;
}

interface AIResult {
  id: string;
  document_id: string;
  extracted_name: string | null;
  detected_doc_type: string | null;
  confidence_score: number;
  matched_client_id: string | null;
  match_reason: string | null;
  is_verified: boolean;
  created_at: string;
}

interface Job {
  id: string;
  status: string;
  job_type: string;
  confidence_score: number;
  client_id: string | null;
  created_at: string;
  result_data: any;
}

export function AutonomousControlPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutonomousSettings | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [aiResults, setAiResults] = useState<AIResult[]>([]);
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const [stats, setStats] = useState({ processed: 0, autoMatched: 0, pendingReview: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, jobsRes, resultsRes, clientsRes] = await Promise.all([
        supabase.from('autonomous_settings' as any).select('*').limit(1).single(),
        supabase.from('autonomous_jobs' as any).select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('document_ai_results' as any).select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('clients').select('id, full_name'),
      ]);

      if (settingsRes.data) setSettings(settingsRes.data as unknown as AutonomousSettings);
      const jobsData = ((jobsRes.data || []) as unknown) as Job[];
      setJobs(jobsData);
      setAiResults(((resultsRes.data || []) as unknown) as AIResult[]);
      setClients((clientsRes.data || []) as { id: string; full_name: string }[]);

      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayJobs = jobsData.filter(j => j.created_at.startsWith(today));
      setStats({
        processed: todayJobs.length,
        autoMatched: todayJobs.filter(j => j.status === 'completed').length,
        pendingReview: todayJobs.filter(j => j.status === 'review').length,
        failed: todayJobs.filter(j => j.status === 'failed' || j.status === 'needs_manual').length,
      });
    } catch (err) {
      console.error('Error fetching autonomous data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeRefresh(['autonomous_jobs', 'document_ai_results'], fetchData);

  const toggleAutonomous = async (enabled: boolean) => {
    if (!settings) return;
    const { error } = await supabase.from('autonomous_settings' as any)
      .update({ autonomous_enabled: enabled, updated_at: new Date().toISOString() } as any)
      .eq('id', settings.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSettings({ ...settings, autonomous_enabled: enabled });
      toast({ title: enabled ? 'Autonomous Mode Enabled' : 'Autonomous Mode Disabled' });
    }
  };

  const saveThresholds = async () => {
    if (!settings) return;
    const { error } = await supabase.from('autonomous_settings' as any)
      .update({
        auto_attach_threshold: settings.auto_attach_threshold,
        review_threshold: settings.review_threshold,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', settings.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Thresholds Saved' });
  };

  const approveResult = async (result: AIResult) => {
    await supabase.from('document_ai_results' as any)
      .update({ is_verified: true, verified_at: new Date().toISOString() } as any)
      .eq('id', result.id);
    // Update corresponding job
    await supabase.from('autonomous_jobs' as any)
      .update({ status: 'completed' } as any)
      .eq('document_upload_id', result.document_id);
    toast({ title: 'Approved', description: 'Document match verified' });
    fetchData();
  };

  const rejectResult = async (result: AIResult) => {
    await supabase.from('document_ai_results' as any)
      .update({ is_verified: false, matched_client_id: null } as any)
      .eq('id', result.id);
    await supabase.from('autonomous_jobs' as any)
      .update({ status: 'failed' } as any)
      .eq('document_upload_id', result.document_id);
    toast({ title: 'Rejected', description: 'Match rejected' });
    fetchData();
  };

  const reassignResult = async (result: AIResult, newClientId: string) => {
    await supabase.from('document_ai_results' as any)
      .update({ matched_client_id: newClientId, is_verified: true, verified_at: new Date().toISOString() } as any)
      .eq('id', result.id);
    await supabase.from('autonomous_jobs' as any)
      .update({ status: 'completed', client_id: newClientId } as any)
      .eq('document_upload_id', result.document_id);
    toast({ title: 'Reassigned', description: 'Document reassigned and verified' });
    fetchData();
  };

  const filteredResults = aiResults.filter(r => {
    if (filter === 'auto-matched') return r.is_verified && r.matched_client_id;
    if (filter === 'review') return !r.is_verified && r.matched_client_id;
    if (filter === 'failed') return !r.matched_client_id;
    return true;
  });

  const getClientName = (id: string | null) => {
    if (!id) return 'Unmatched';
    return clients.find(c => c.id === id)?.full_name || id.slice(0, 8);
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Activity className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-3 bg-purple-500/10 text-purple-500">
          <Bot className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Autonomous Processing</h2>
          <p className="text-sm text-muted-foreground">AI-powered background document processing</p>
        </div>
      </div>

      {/* Control Toggle + Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Control Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Autonomous Processing</Label>
              <p className="text-sm text-muted-foreground">AI will automatically process new document uploads</p>
            </div>
            <Switch
              checked={settings?.autonomous_enabled || false}
              onCheckedChange={toggleAutonomous}
            />
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <Label>Auto-Attach Threshold: {settings?.auto_attach_threshold || 85}%</Label>
              <p className="text-xs text-muted-foreground mb-2">Documents above this score auto-attach to client</p>
              <Slider
                value={[settings?.auto_attach_threshold || 85]}
                onValueChange={([v]) => settings && setSettings({ ...settings, auto_attach_threshold: v })}
                min={50} max={100} step={5}
              />
            </div>
            <div>
              <Label>Review Threshold: {settings?.review_threshold || 60}%</Label>
              <p className="text-xs text-muted-foreground mb-2">Documents between this and auto-attach go to review queue</p>
              <Slider
                value={[settings?.review_threshold || 60]}
                onValueChange={([v]) => settings && setSettings({ ...settings, review_threshold: v })}
                min={20} max={80} step={5}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label className="text-sm font-medium">Auto-Generate Disputes</Label>
                <p className="text-xs text-muted-foreground">Automatically generate dispute letters when credit reports are analyzed</p>
              </div>
              <Switch
                checked={settings?.auto_generate_disputes || false}
                onCheckedChange={(checked) => settings && setSettings({ ...settings, auto_generate_disputes: checked })}
              />
            </div>
            <Button onClick={saveThresholds} size="sm">Save Thresholds</Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Processed Today', value: stats.processed, icon: Zap, color: 'text-purple-500 bg-purple-500/10' },
          { label: 'Auto-Matched', value: stats.autoMatched, icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
          { label: 'Pending Review', value: stats.pendingReview, icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Failed / Manual', value: stats.failed, icon: XCircle, color: 'text-red-500 bg-red-500/10' },
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

      {/* AI Decisions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Decisions</CardTitle>
          <CardDescription>Review, approve, or reassign AI document matches</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({aiResults.length})</TabsTrigger>
              <TabsTrigger value="auto-matched">Auto-Matched</TabsTrigger>
              <TabsTrigger value="review">Needs Review</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value={filter}>
              {filteredResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No AI decisions yet. Upload documents with autonomous mode enabled.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doc Type</TableHead>
                        <TableHead>Extracted Name</TableHead>
                        <TableHead>Matched Client</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map(r => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {(r.detected_doc_type || 'unknown').replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{r.extracted_name || '—'}</TableCell>
                          <TableCell>{getClientName(r.matched_client_id)}</TableCell>
                          <TableCell>
                            <Badge variant={r.confidence_score >= 85 ? 'default' : r.confidence_score >= 60 ? 'secondary' : 'destructive'}>
                              {r.confidence_score}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {r.is_verified ? (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>
                            ) : r.matched_client_id ? (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Review</Badge>
                            ) : (
                              <Badge variant="destructive">Unmatched</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!r.is_verified && r.matched_client_id && (
                                <>
                                  <Button size="sm" variant="outline" className="text-green-600" onClick={() => approveResult(r)}>
                                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => rejectResult(r)}>
                                    <XCircle className="h-3 w-3 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                              <Select onValueChange={(clientId) => reassignResult(r, clientId)}>
                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                  <SelectValue placeholder="Reassign..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {clients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
