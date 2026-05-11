import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { Gavel, CheckCircle, Send, RotateCw, Eye, Zap, FileText, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisputeCase {
  id: string;
  client_id: string;
  bureau: string;
  account_name: string;
  account_number_last4: string;
  violation_type: string;
  status: string;
  source: string;
  created_at: string;
}

interface AILetter {
  id: string;
  dispute_case_id: string;
  letter_content: string;
  letter_type: string;
  bureau: string;
  confidence_score: number;
  status: string;
  generated_at: string;
}

export function DisputeCommandCenter() {
  const { toast } = useToast();
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [letters, setLetters] = useState<AILetter[]>([]);
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [previewLetter, setPreviewLetter] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    const [casesRes, lettersRes, clientsRes] = await Promise.all([
      supabase.from('dispute_cases' as any).select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('ai_dispute_letters' as any).select('*').order('generated_at', { ascending: false }).limit(200),
      supabase.from('clients').select('id, full_name'),
    ]);
    setCases((casesRes.data || []) as unknown as DisputeCase[]);
    setLetters((lettersRes.data || []) as unknown as AILetter[]);
    setClients((clientsRes.data || []) as { id: string; full_name: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeRefresh(['dispute_cases', 'ai_dispute_letters'], fetchData);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.full_name || id?.slice(0, 8);

  const filteredCases = cases.filter(c => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'generated') return c.status === 'generated';
    if (filter === 'sent') return c.status === 'sent';
    if (filter === 'completed') return c.status === 'completed';
    return true;
  });

  const stats = {
    total: cases.length,
    pending: cases.filter(c => c.status === 'pending').length,
    generated: cases.filter(c => c.status === 'generated').length,
    sent: cases.filter(c => c.status === 'sent').length,
    completed: cases.filter(c => c.status === 'completed').length,
  };

  const updateCaseStatus = async (caseId: string, status: string) => {
    const prev = cases.find(x => x.id === caseId);
    await supabase.from('dispute_cases' as any).update({ status } as any).eq('id', caseId);
    await supabase.rpc('log_security_event', {
      p_action: 'DISPUTE_STATUS_CHANGED',
      p_table_name: 'dispute_cases',
      p_record_id: caseId,
      p_details: { case_id: caseId, client_id: prev?.client_id, change: { from: prev?.status || null, to: status } },
      p_security_level: 'info',
      p_risk_score: 2,
    } as any);
    // Also update letter status if approving
    if (status === 'sent') {
      await supabase.from('ai_dispute_letters' as any).update({ status: 'sent' } as any).eq('dispute_case_id', caseId);
    }
    toast({ title: 'Status Updated', description: `Case marked as ${status}` });
    // Fire automation event
    const eventMap: Record<string, string> = { sent: 'dispute_marked_sent', completed: 'dispute_approved', generated: 'dispute_letter_generated' };
    if (eventMap[status]) {
      const c = cases.find(x => x.id === caseId);
      supabase.functions.invoke('process-automation-event', {
        body: { event_type: eventMap[status], client_id: c?.client_id, payload: { case_id: caseId, status }, source: 'dispute_command' },
      }).catch(() => {});
    }
    fetchData();
  };

  const approveLetter = async (caseId: string) => {
    await supabase.from('ai_dispute_letters' as any).update({ status: 'approved' } as any).eq('dispute_case_id', caseId);
    await supabase.from('dispute_cases' as any).update({ status: 'generated' } as any).eq('id', caseId);
    await supabase.rpc('log_security_event', {
      p_action: 'DISPUTE_LETTER_APPROVED',
      p_table_name: 'dispute_cases',
      p_record_id: caseId,
      p_details: { case_id: caseId },
      p_security_level: 'info',
      p_risk_score: 2,
    } as any);
    toast({ title: 'Letter Approved' });
    fetchData();
  };

  const regenerateLetter = async (caseId: string) => {
    const disputeCase = cases.find(c => c.id === caseId);
    if (!disputeCase) return;
    toast({ title: 'Regenerating...', description: 'AI is generating a new letter' });
    await supabase.functions.invoke('generate-dispute-ai', {
      body: {
        client_id: disputeCase.client_id,
        flagged_accounts: [{
          account_name: disputeCase.account_name,
          account_number_last4: disputeCase.account_number_last4,
          bureau: disputeCase.bureau,
          violation_type: disputeCase.violation_type,
        }],
        mode: 'manual',
      },
    });
    fetchData();
  };

  const bulkGenerate = async () => {
    setBulkGenerating(true);
    try {
      // Get all clients that have flagged disputes but no dispute_cases
      const clientsWithFlags = [...new Set(cases.map(c => c.client_id))];
      const allClients = clients.filter(c => !clientsWithFlags.includes(c.id));

      let totalCreated = 0;
      for (const client of allClients.slice(0, 20)) {
        const { data } = await supabase.functions.invoke('generate-dispute-ai', {
          body: { client_id: client.id, mode: 'auto' },
        });
        totalCreated += data?.cases_created || 0;
      }
      toast({ title: 'Bulk Generation Complete', description: `${totalCreated} new dispute cases created` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setBulkGenerating(false);
    }
  };

  const getLetterForCase = (caseId: string) => letters.find(l => l.dispute_case_id === caseId);

  if (loading) return <div className="flex items-center justify-center p-12"><Activity className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-3 bg-amber-500/10 text-amber-500"><Gavel className="h-7 w-7" /></div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dispute Command Center</h2>
          <p className="text-sm text-muted-foreground">AI-powered dispute generation and tracking</p>
        </div>
        <Button onClick={bulkGenerate} disabled={bulkGenerating} className="ml-auto" size="sm">
          <Zap className="h-4 w-4 mr-1" />{bulkGenerating ? 'Generating...' : 'Generate All Pending'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Cases', value: stats.total, icon: FileText, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Generated', value: stats.generated, icon: Zap, color: 'text-purple-500 bg-purple-500/10' },
          { label: 'Sent', value: stats.sent, icon: Send, color: 'text-cyan-500 bg-cyan-500/10' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
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

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dispute Cases</CardTitle>
          <CardDescription>Review and manage AI-generated dispute cases</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({cases.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="generated">Generated</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={filter}>
              {filteredCases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gavel className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No dispute cases in this category.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Bureau</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Violation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.map(c => {
                        const letter = getLetterForCase(c.id);
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{getClientName(c.client_id)}</TableCell>
                            <TableCell><Badge variant="outline">{c.bureau}</Badge></TableCell>
                            <TableCell>{c.account_name}<br /><span className="text-xs text-muted-foreground">****{c.account_number_last4}</span></TableCell>
                            <TableCell className="capitalize text-xs">{(c.violation_type || '').replace(/_/g, ' ')}</TableCell>
                            <TableCell>
                              <Badge variant={c.status === 'completed' ? 'default' : c.status === 'sent' ? 'secondary' : 'outline'} className="capitalize">{c.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={c.source === 'ai_auto' ? 'default' : 'outline'} className="text-[10px]">{c.source === 'ai_auto' ? 'AI Auto' : 'Manual'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {letter && (
                                  <Button size="sm" variant="outline" onClick={() => setPreviewLetter(letter.letter_content)}>
                                    <Eye className="h-3 w-3 mr-1" />Preview
                                  </Button>
                                )}
                                {c.status === 'generated' && (
                                  <>
                                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => approveLetter(c.id)}>
                                      <CheckCircle className="h-3 w-3 mr-1" />Approve
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => updateCaseStatus(c.id, 'sent')}>
                                      <Send className="h-3 w-3 mr-1" />Mark Sent
                                    </Button>
                                  </>
                                )}
                                {c.status === 'sent' && (
                                  <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateCaseStatus(c.id, 'completed')}>
                                    <CheckCircle className="h-3 w-3 mr-1" />Complete
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => regenerateLetter(c.id)}>
                                  <RotateCw className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Letter Preview Dialog */}
      <Dialog open={!!previewLetter} onOpenChange={() => setPreviewLetter(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Letter Preview</DialogTitle></DialogHeader>
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed bg-muted/50 p-4 rounded-lg border">{previewLetter}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
