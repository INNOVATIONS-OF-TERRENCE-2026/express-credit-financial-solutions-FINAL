import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import {
  Brain, Shield, Target, Upload, Users, Zap, RefreshCw, Eye, Play,
  CheckCircle, XCircle, Clock, AlertTriangle, FileSearch, Cpu, ChevronDown
} from 'lucide-react';

interface CIP {
  id: string;
  client_id: string;
  full_name: string;
  strategy_type: string;
  strategy_confidence: number;
  negative_accounts: any[];
  violations_identified: any[];
  inquiries: any[];
  bureau_summary: any;
  status: string;
  created_at: string;
}

interface Workflow {
  id: string;
  client_id: string;
  workflow_type: string;
  current_step: string;
  status: string;
  confidence_score: number;
  results: any;
  created_at: string;
}

interface AgentRun {
  id: string;
  workflow_id: string;
  agent_name: string;
  output_payload: any;
  confidence_score: number;
  status: string;
  created_at: string;
}

interface QueueItem {
  id: string;
  client_id: string;
  item_type: string;
  queue_status: string;
  priority: number;
  created_at: string;
}

const STRATEGY_COLORS: Record<string, string> = {
  standard_dispute: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  '605b_identity_theft_block': 'bg-red-500/10 text-red-500 border-red-500/20',
  hybrid_605b_plus_dispute: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  upload_packet_preparation: 'bg-green-500/10 text-green-500 border-green-500/20',
  manual_review_required: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  pending: 'bg-muted text-muted-foreground',
};

const AGENT_ICONS: Record<string, any> = {
  audit_agent: Brain,
  identity_605b_agent: Shield,
  deletion_cascade_agent: Target,
  experian_upload_agent: Upload,
  qualification_agent: Users,
};

export function CIPExecutionCenter() {
  const { toast } = useToast();
  const [cips, setCips] = useState<CIP[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);
  const [expandedCIP, setExpandedCIP] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('cips');

  const fetchData = useCallback(async () => {
    try {
      const [cipRes, wfRes, arRes, qRes, clRes] = await Promise.all([
        supabase.from('client_intelligence_packets' as any).select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('ai_workflows' as any).select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('ai_agent_runs' as any).select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('execution_queue' as any).select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('clients').select('id, full_name, email, membership_plan'),
      ]);
      setCips((cipRes.data || []) as any);
      setWorkflows((wfRes.data || []) as any);
      setAgentRuns((arRes.data || []) as any);
      setQueueItems((qRes.data || []) as any);
      setClients(clRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeRefresh(['client_intelligence_packets', 'ai_workflows', 'ai_agent_runs', 'execution_queue'], fetchData);

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.full_name || clientId.slice(0, 8);

  const runWorkflow = async (clientId: string, mode: string = 'manual') => {
    setRunningWorkflow(clientId);
    try {
      const { data, error } = await supabase.functions.invoke('orchestrate-ai-workflow', {
        body: { client_id: clientId, mode },
      });
      if (error) throw error;
      toast({ title: 'AI Workflow Complete', description: `Strategy: ${data.strategy?.type} (${data.strategy?.confidence}% confidence)` });
      fetchData();
    } catch (e: any) {
      toast({ title: 'Workflow Error', description: e.message, variant: 'destructive' });
    } finally { setRunningWorkflow(null); }
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'processing') return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  // Stats
  const totalCIPs = cips.length;
  const activeCycles = workflows.filter(w => w.status === 'processing').length;
  const completedToday = cips.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length;
  const queuedItems = queueItems.filter(q => q.queue_status === 'queued').length;
  const failedRuns = agentRuns.filter(a => a.status === 'failed').length;

  if (loading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total CIPs', value: totalCIPs, icon: Brain, color: 'text-primary' },
          { label: 'Active Workflows', value: activeCycles, icon: Cpu, color: 'text-blue-500' },
          { label: 'Generated Today', value: completedToday, icon: Zap, color: 'text-green-500' },
          { label: 'Queued Actions', value: queuedItems, icon: Clock, color: 'text-amber-500' },
          { label: 'Failed Runs', value: failedRuns, icon: AlertTriangle, color: 'text-red-500' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="glass-card">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Run Workflow Button */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Play className="h-4 w-4 text-primary" />Run AI Analysis on Client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {clients.slice(0, 20).map(client => (
              <Button
                key={client.id}
                size="sm"
                variant="outline"
                disabled={runningWorkflow === client.id}
                onClick={() => runWorkflow(client.id)}
              >
                {runningWorkflow === client.id ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />}
                {client.full_name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="cips">CIP Center</TabsTrigger>
          <TabsTrigger value="agents">Agent Runs</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="queue">Exec Queue</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        {/* CIP Center */}
        <TabsContent value="cips" className="space-y-3">
          {cips.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-8 text-center"><Brain className="h-12 w-12 mx-auto mb-2 text-muted-foreground" /><p className="text-muted-foreground">No CIPs generated yet. Run AI analysis on a client to create one.</p></CardContent></Card>
          ) : cips.map(cip => (
            <Card key={cip.id} className="glass-card">
              <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedCIP(expandedCIP === cip.id ? null : cip.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcon(cip.status)}
                    <div>
                      <CardTitle className="text-sm">{cip.full_name || getClientName(cip.client_id)}</CardTitle>
                      <CardDescription className="text-xs">{new Date(cip.created_at).toLocaleString()}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STRATEGY_COLORS[cip.strategy_type] || STRATEGY_COLORS.pending}>
                      {cip.strategy_type?.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline">{cip.strategy_confidence}%</Badge>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedCIP === cip.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardHeader>
              {expandedCIP === cip.id && (
                <CardContent className="space-y-3 border-t border-border pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Negative Accounts</p>
                      <p className="text-xl font-bold text-foreground">{Array.isArray(cip.negative_accounts) ? cip.negative_accounts.length : 0}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Violations</p>
                      <p className="text-xl font-bold text-red-500">{Array.isArray(cip.violations_identified) ? cip.violations_identified.length : 0}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Inquiries</p>
                      <p className="text-xl font-bold text-foreground">{Array.isArray(cip.inquiries) ? cip.inquiries.length : 0}</p>
                    </div>
                  </div>
                  {Array.isArray(cip.negative_accounts) && cip.negative_accounts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Account Details</p>
                      <ScrollArea className="max-h-48">
                        <div className="space-y-1">
                          {cip.negative_accounts.slice(0, 10).map((acct: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded border border-border text-xs">
                              <span className="font-medium">{acct.creditor || 'Unknown'}</span>
                              <span className="text-muted-foreground">{acct.status || acct.account_type}</span>
                              <span>{acct.balance ? `$${acct.balance}` : '—'}</span>
                              <Badge variant="outline" className="text-[10px]">{acct.recommended_action || 'review'}</Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => runWorkflow(cip.client_id)}><RefreshCw className="h-3 w-3 mr-1" />Re-analyze</Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        await supabase.functions.invoke('generate-dispute-ai', { body: { client_id: cip.client_id, mode: 'manual' } });
                        toast({ title: 'Disputes Generated' });
                        fetchData();
                      } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
                    }}><Zap className="h-3 w-3 mr-1" />Generate Disputes</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Agent Runs */}
        <TabsContent value="agents">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentRuns.slice(0, 30).map(run => {
                    const Icon = AGENT_ICONS[run.agent_name] || Cpu;
                    return (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            {run.agent_name.replace(/_/g, ' ')}
                          </div>
                        </TableCell>
                        <TableCell>{statusIcon(run.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={run.confidence_score} className="w-16 h-2" />
                            <span className="text-xs">{run.confidence_score}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategies */}
        <TabsContent value="strategies">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['standard_dispute', '605b_identity_theft_block', 'hybrid_605b_plus_dispute', 'manual_review_required'].map(strategy => {
              const count = cips.filter(c => c.strategy_type === strategy).length;
              return (
                <Card key={strategy} className="glass-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <Badge className={STRATEGY_COLORS[strategy]}>{strategy.replace(/_/g, ' ')}</Badge>
                      <span className="text-2xl font-bold text-foreground">{count}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Execution Queue */}
        <TabsContent value="queue">
          <Card className="glass-card">
            <CardContent className="pt-4">
              {queueItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No items in execution queue</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queueItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{getClientName(item.client_id)}</TableCell>
                        <TableCell><Badge variant="outline">{item.item_type}</Badge></TableCell>
                        <TableCell>{statusIcon(item.queue_status)}</TableCell>
                        <TableCell>{item.priority}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map(wf => (
                    <TableRow key={wf.id}>
                      <TableCell className="font-medium">{getClientName(wf.client_id)}</TableCell>
                      <TableCell>{wf.workflow_type}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{wf.current_step?.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell>{statusIcon(wf.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={wf.confidence_score} className="w-16 h-2" />
                          <span className="text-xs">{wf.confidence_score}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(wf.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
