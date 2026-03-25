import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Brain, FileText, Loader2, RefreshCw, Eye, CheckCircle, XCircle,
  Upload, AlertTriangle, ArrowRight, StickyNote, Search, Users,
  Zap, Clock, Send
} from 'lucide-react';
import {
  autoCreateDisputesFromFlags, transitionDisputeStatus,
} from '@/services/disputeWorkflow';
import {
  fetchAllClientCases, getNextAction, getReadiness,
  READINESS_CONFIG, type ClientCaseData, type ReadinessLevel,
} from '@/components/AdminBacklogTools';
import { ClientDetailOperations } from '@/components/ClientDetailOperations';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

type FilterMode = 'all' | 'missing_docs' | 'ready_analyze' | 'ready_generate' | 'needs_review' | 'approved' | 'followup';

const FILTER_OPTIONS: { key: FilterMode; label: string; icon: any }[] = [
  { key: 'all', label: 'All Clients', icon: Users },
  { key: 'missing_docs', label: 'Missing Docs', icon: Upload },
  { key: 'ready_analyze', label: 'Ready for Analysis', icon: Brain },
  { key: 'ready_generate', label: 'Ready to Generate', icon: Zap },
  { key: 'needs_review', label: 'Needs Review', icon: Clock },
  { key: 'approved', label: 'Approved / Export', icon: CheckCircle },
  { key: 'followup', label: 'Follow-Up Due', icon: AlertTriangle },
];

export function ClientProcessingGrid() {
  const [clients, setClients] = useState<ClientCaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [noteModal, setNoteModal] = useState<{ userId: string; name: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [detailModal, setDetailModal] = useState<ClientCaseData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchAllClientCases();
      setClients(rows);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load client data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time auto-refresh
  useRealtimeRefresh(['dispute_letters', 'flagged_disputes', 'credit_report_uploads'], fetchData);

  const addProc = (id: string) => setProcessing(p => new Set(p).add(id));
  const delProc = (id: string) => setProcessing(p => { const n = new Set(p); n.delete(id); return n; });

  const handleAnalyze = async (userId: string) => {
    addProc(userId);
    try {
      const { data: reports } = await supabase.from('credit_report_uploads').select('id, file_name')
        .eq('user_id', userId).in('analysis_status', ['pending']);
      if (!reports?.length) { toast({ title: 'No pending reports' }); return; }
      for (const r of reports) {
        await supabase.functions.invoke('analyze-credit-report', {
          body: { reportId: r.id, fileName: r.file_name, creditReportPath: r.file_name },
        });
      }
      toast({ title: 'Analysis Complete', description: `${reports.length} report(s)` });
      fetchData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { delProc(userId); }
  };

  const handleDrafts = async (userId: string) => {
    addProc(userId);
    try {
      const { data: reports } = await supabase.from('credit_report_uploads').select('id').eq('user_id', userId);
      let total = 0;
      for (const r of reports || []) { total += (await autoCreateDisputesFromFlags(userId, r.id)).created; }
      toast({ title: 'Drafts Created', description: `${total} draft(s)` });
      fetchData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { delProc(userId); }
  };

  const handleReview = async (userId: string) => {
    if (!user) return;
    addProc(userId);
    try {
      const { data: disputes } = await supabase.from('dispute_letters').select('id')
        .eq('user_id', userId).eq('case_status', 'draft_generated');
      let moved = 0;
      for (const d of disputes || []) { await transitionDisputeStatus(d.id, 'needs_admin_review', user.id); moved++; }
      toast({ title: 'Sent to Review', description: `${moved} dispute(s)` });
      fetchData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { delProc(userId); }
  };

  const handleFollowup = async (userId: string) => {
    if (!user) return;
    addProc(userId);
    try {
      const { data: disputes } = await supabase.from('dispute_letters').select('id')
        .eq('user_id', userId).eq('case_status', 'exported');
      let moved = 0;
      for (const d of disputes || []) { await transitionDisputeStatus(d.id, 'followup_due', user.id); moved++; }
      toast({ title: 'Marked Follow-Up', description: `${moved} case(s)` });
      fetchData();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { delProc(userId); }
  };

  const handleNote = async () => {
    if (!noteModal || !noteText.trim()) return;
    try {
      const { data: client } = await supabase.from('clients').select('id').eq('user_id', noteModal.userId).single();
      if (client) {
        await supabase.from('admin_notes').insert({ client_id: client.id, admin_user_id: user!.id, note_text: noteText });
      }
      toast({ title: 'Note Added' });
      setNoteModal(null); setNoteText('');
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  // Bulk actions
  const bulkAction = async (fn: (uid: string) => Promise<void>) => {
    setBulkProcessing(true);
    for (const uid of selected) { try { await fn(uid); } catch {} }
    setSelected(new Set());
    setBulkProcessing(false);
    fetchData();
  };

  const toggleSelect = (uid: string) => setSelected(prev => {
    const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n;
  });

  // Filtering
  const filtered = clients
    .filter(c => {
      if (filter === 'missing_docs') return !c.has_id || !c.has_credit_report || !c.has_agreement;
      if (filter === 'ready_analyze') return c.unanalyzed_reports > 0;
      if (filter === 'ready_generate') return c.pending_flags > 0;
      if (filter === 'needs_review') return c.review_count > 0;
      if (filter === 'approved') return c.approved_count > 0;
      if (filter === 'followup') return c.followup_count > 0;
      return true;
    })
    .filter(c => {
      if (!searchTerm) return true;
      const t = searchTerm.toLowerCase();
      return c.full_name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t);
    })
    .sort((a, b) => getNextAction(b).priority - getNextAction(a).priority);

  const counts: Record<FilterMode, number> = {
    all: clients.length,
    missing_docs: clients.filter(c => !c.has_id || !c.has_credit_report || !c.has_agreement).length,
    ready_analyze: clients.filter(c => c.unanalyzed_reports > 0).length,
    ready_generate: clients.filter(c => c.pending_flags > 0).length,
    needs_review: clients.filter(c => c.review_count > 0).length,
    approved: clients.filter(c => c.approved_count > 0).length,
    followup: clients.filter(c => c.followup_count > 0).length,
  };

  if (loading) {
    return <Card><CardContent className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground mt-2">Loading...</p></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {FILTER_OPTIONS.map(f => {
          const Icon = f.icon;
          const active = filter === f.key;
          return (
            <Button key={f.key} variant={active ? 'default' : 'outline'} size="sm"
              className="flex flex-col h-auto py-2 gap-0.5" onClick={() => setFilter(f.key)}>
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{counts[f.key]}</span>
              <span className="text-[10px] leading-tight">{f.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Grid */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />Client Processing Grid
              <Badge variant="outline">{filtered.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 w-44 h-9" />
              </div>
              <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <Badge variant="secondary">{selected.size} selected</Badge>
              <Button size="sm" variant="outline" onClick={() => bulkAction(handleAnalyze)} disabled={bulkProcessing}>
                <Brain className="h-3 w-3 mr-1" />Analyze
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction(handleDrafts)} disabled={bulkProcessing}>
                <FileText className="h-3 w-3 mr-1" />Draft
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction(handleReview)} disabled={bulkProcessing}>
                <ArrowRight className="h-3 w-3 mr-1" />To Review
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction(handleFollowup)} disabled={bulkProcessing}>
                <Clock className="h-3 w-3 mr-1" />Follow-Up
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              {bulkProcessing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[540px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={() => selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map(c => c.user_id)))} />
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead className="text-center">Reports</TableHead>
                  <TableHead className="text-center">Flags</TableHead>
                  <TableHead className="text-center">Disputes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Action</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const isProc = processing.has(c.user_id);
                  const readiness = getReadiness(c);
                  const rCfg = READINESS_CONFIG[readiness];
                  const nextAct = getNextAction(c);
                  return (
                    <TableRow key={c.user_id} className={selected.has(c.user_id) ? 'bg-accent/5' : ''}>
                      <TableCell><Checkbox checked={selected.has(c.user_id)} onCheckedChange={() => toggleSelect(c.user_id)} /></TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-36">{c.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rCfg.variant} className="text-[10px]">{rCfg.label}</Badge>
                        <div className="flex gap-0.5 mt-0.5">
                          <span className={`text-[9px] ${c.has_agreement ? 'text-emerald-600' : 'text-destructive'}`}>{c.has_agreement ? '✓' : '✗'}Agr</span>
                          <span className={`text-[9px] ${c.has_id ? 'text-emerald-600' : 'text-destructive'}`}>{c.has_id ? '✓' : '✗'}ID</span>
                          <span className={`text-[9px] ${c.has_address ? 'text-emerald-600' : 'text-destructive'}`}>{c.has_address ? '✓' : '✗'}Addr</span>
                          <span className={`text-[9px] ${c.has_credit_report ? 'text-emerald-600' : 'text-destructive'}`}>{c.has_credit_report ? '✓' : '✗'}CR</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {c.report_count}
                        {c.unanalyzed_reports > 0 && <Badge variant="secondary" className="text-[9px] ml-1">{c.unanalyzed_reports}new</Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.pending_flags > 0 ? <Badge className="text-[10px]">{c.pending_flags}</Badge> : <span className="text-xs text-muted-foreground">{c.flagged_count || '—'}</span>}
                      </TableCell>
                      <TableCell className="text-center text-sm">{c.dispute_count || '—'}</TableCell>
                      <TableCell>
                        {c.latest_status ? <Badge variant="outline" className="text-[10px]">{c.latest_status.replace(/_/g, ' ')}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><span className="text-xs text-muted-foreground leading-tight">{nextAct.action}</span></TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {c.unanalyzed_reports > 0 && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleAnalyze(c.user_id)} disabled={isProc}>
                              {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Brain className="h-3 w-3 mr-0.5" />Analyze</>}
                            </Button>
                          )}
                          {c.pending_flags > 0 && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleDrafts(c.user_id)} disabled={isProc}>
                              {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileText className="h-3 w-3 mr-0.5" />Draft</>}
                            </Button>
                          )}
                          {c.latest_status === 'draft_generated' && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleReview(c.user_id)} disabled={isProc}>
                              <ArrowRight className="h-3 w-3 mr-0.5" />Review
                            </Button>
                          )}
                          {c.approved_count > 0 && c.latest_status === 'exported' && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleFollowup(c.user_id)} disabled={isProc}>
                              <Clock className="h-3 w-3 mr-0.5" />F/U
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => setDetailModal(c)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => setNoteModal({ userId: c.user_id, name: c.full_name || c.email })}>
                            <StickyNote className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Client Detail Operations Modal */}
      <ClientDetailOperations
        client={detailModal}
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        onRefresh={fetchData}
      />

      {/* Note Modal */}
      <Dialog open={!!noteModal} onOpenChange={() => { setNoteModal(null); setNoteText(''); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Admin Note — {noteModal?.name}</DialogTitle></DialogHeader>
          <Textarea placeholder="Type note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} />
          <Button onClick={handleNote} disabled={!noteText.trim()}>Save Note</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
