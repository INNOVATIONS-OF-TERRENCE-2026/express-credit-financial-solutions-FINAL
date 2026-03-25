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
  Zap, Clock, Filter
} from 'lucide-react';
import {
  autoCreateDisputesFromFlags,
  transitionDisputeStatus,
  type CaseStatus,
} from '@/services/disputeWorkflow';

interface ClientRow {
  user_id: string;
  email: string;
  full_name: string;
  active_services: string[];
  created_at: string;
  // readiness
  has_agreement: boolean;
  has_id: boolean;
  has_address: boolean;
  has_credit_report: boolean;
  // counts
  report_count: number;
  unanalyzed_reports: number;
  flagged_count: number;
  pending_flags: number;
  dispute_count: number;
  review_count: number;
  approved_count: number;
  // derived
  latest_status: string | null;
  last_updated: string | null;
  next_action: string;
  readiness: 'incomplete' | 'partial' | 'ready_for_analysis' | 'ready_for_drafting';
}

type SortField = 'name' | 'created' | 'readiness' | 'flags' | 'disputes' | 'action';
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

function getNextAction(c: ClientRow): string {
  if (!c.has_agreement) return 'Needs client agreement';
  if (!c.has_id) return 'Upload government ID';
  if (!c.has_credit_report) return 'Upload credit report';
  if (c.unanalyzed_reports > 0) return `Run AI analysis (${c.unanalyzed_reports} report${c.unanalyzed_reports > 1 ? 's' : ''})`;
  if (c.pending_flags > 0) return `Generate drafts from ${c.pending_flags} flagged item${c.pending_flags > 1 ? 's' : ''}`;
  if (c.review_count > 0) return 'Admin review required';
  if (c.approved_count > 0) return 'Export approved letters';
  if (c.latest_status === 'followup_due') return 'Follow-up action needed';
  if (c.dispute_count > 0) return 'Monitor active disputes';
  return 'No action needed';
}

function getReadiness(c: ClientRow): ClientRow['readiness'] {
  if (!c.has_agreement || !c.has_id) return 'incomplete';
  if (!c.has_credit_report) return 'partial';
  if (c.pending_flags > 0) return 'ready_for_drafting';
  if (c.has_credit_report) return 'ready_for_analysis';
  return 'partial';
}

const READINESS_BADGE: Record<ClientRow['readiness'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  incomplete: { label: 'Incomplete', variant: 'destructive' },
  partial: { label: 'Partial', variant: 'secondary' },
  ready_for_analysis: { label: 'Ready for Analysis', variant: 'outline' },
  ready_for_drafting: { label: 'Ready for Drafting', variant: 'default' },
};

export function ClientProcessingGrid() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('action');
  const [sortAsc, setSortAsc] = useState(true);
  const [noteModal, setNoteModal] = useState<{ userId: string; name: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, clientsRes, reportsRes, flagsRes, disputesRes, agreementsRes, docsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, email, first_name, middle_name, last_name, active_services, created_at'),
        supabase.from('clients').select('user_id, full_name'),
        supabase.from('credit_report_uploads').select('user_id, id, analysis_status'),
        supabase.from('flagged_disputes').select('user_id, id, dispute_letter_generated'),
        supabase.from('dispute_letters').select('user_id, id, case_status, status_updated_at'),
        supabase.from('client_agreements').select('user_id'),
        supabase.from('client_documents').select('user_id, document_type'),
      ]);

      const profiles = profilesRes.data || [];
      const clientMap = new Map((clientsRes.data || []).map(c => [c.user_id, c.full_name]));
      const agreementSet = new Set((agreementsRes.data || []).map(a => a.user_id));

      const rows: ClientRow[] = profiles.map(p => {
        const uid = p.user_id;
        const userReports = (reportsRes.data || []).filter(r => r.user_id === uid);
        const userFlags = (flagsRes.data || []).filter(f => f.user_id === uid);
        const userDisputes = (disputesRes.data || []).filter(d => d.user_id === uid);
        const userDocs = (docsRes.data || []).filter(d => d.user_id === uid);

        const pendingFlags = userFlags.filter(f => !f.dispute_letter_generated).length;
        const reviewCount = userDisputes.filter(d => d.case_status === 'needs_admin_review').length;
        const approvedCount = userDisputes.filter(d => d.case_status === 'approved').length;
        const unanalyzed = userReports.filter(r => r.analysis_status === 'pending' || !r.analysis_status).length;

        const fullName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ') || clientMap.get(uid) || '';
        const latestDispute = userDisputes.sort((a, b) => 
          (b.status_updated_at || '').localeCompare(a.status_updated_at || '')
        )[0];

        const row: ClientRow = {
          user_id: uid,
          email: p.email,
          full_name: fullName,
          active_services: (p as any).active_services || [],
          created_at: p.created_at,
          has_agreement: agreementSet.has(uid),
          has_id: userDocs.some(d => d.document_type === 'government_id'),
          has_address: userDocs.some(d => d.document_type === 'proof_of_address' || d.document_type === 'address'),
          has_credit_report: userReports.length > 0,
          report_count: userReports.length,
          unanalyzed_reports: unanalyzed,
          flagged_count: userFlags.length,
          pending_flags: pendingFlags,
          dispute_count: userDisputes.length,
          review_count: reviewCount,
          approved_count: approvedCount,
          latest_status: latestDispute?.case_status || null,
          last_updated: latestDispute?.status_updated_at || null,
          next_action: '',
          readiness: 'incomplete',
        };
        row.next_action = getNextAction(row);
        row.readiness = getReadiness(row);
        return row;
      });

      setClients(rows);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load client data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addProcessing = (id: string) => setProcessing(p => new Set(p).add(id));
  const removeProcessing = (id: string) => setProcessing(p => { const n = new Set(p); n.delete(id); return n; });

  const handleRunAnalysis = async (userId: string) => {
    addProcessing(userId);
    try {
      const { data: reports } = await supabase
        .from('credit_report_uploads')
        .select('id, file_name')
        .eq('user_id', userId)
        .in('analysis_status', ['pending']);

      if (!reports?.length) {
        toast({ title: 'No Reports', description: 'No pending reports to analyze' });
        return;
      }

      for (const report of reports) {
        await supabase.functions.invoke('analyze-credit-report', {
          body: { reportId: report.id, fileName: report.file_name, creditReportPath: report.file_name },
        });
      }
      toast({ title: 'Analysis Complete', description: `Analyzed ${reports.length} report(s)` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      removeProcessing(userId);
    }
  };

  const handleGenerateDrafts = async (userId: string) => {
    addProcessing(userId);
    try {
      const { data: reports } = await supabase
        .from('credit_report_uploads').select('id').eq('user_id', userId);

      let total = 0;
      for (const r of reports || []) {
        const result = await autoCreateDisputesFromFlags(userId, r.id);
        total += result.created;
      }
      toast({ title: 'Drafts Created', description: `Created ${total} dispute draft(s)` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      removeProcessing(userId);
    }
  };

  const handleSendToReview = async (userId: string) => {
    addProcessing(userId);
    try {
      const { data: disputes } = await supabase
        .from('dispute_letters').select('id, case_status')
        .eq('user_id', userId)
        .eq('case_status', 'draft_generated');

      let moved = 0;
      for (const d of disputes || []) {
        await transitionDisputeStatus(d.id, 'needs_admin_review', user!.id);
        moved++;
      }
      toast({ title: 'Sent to Review', description: `${moved} dispute(s) moved to review queue` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      removeProcessing(userId);
    }
  };

  const handleAddNote = async () => {
    if (!noteModal || !noteText.trim()) return;
    try {
      // Find client record
      const { data: client } = await supabase
        .from('clients').select('id').eq('user_id', noteModal.userId).single();

      if (client) {
        await supabase.from('admin_notes').insert({
          client_id: client.id,
          admin_user_id: user!.id,
          note_text: noteText,
        });
      }
      toast({ title: 'Note Added' });
      setNoteModal(null);
      setNoteText('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Bulk actions
  const handleBulkAnalyze = async () => {
    setBulkProcessing(true);
    for (const uid of selected) {
      await handleRunAnalysis(uid);
    }
    setSelected(new Set());
    setBulkProcessing(false);
  };

  const handleBulkGenerateDrafts = async () => {
    setBulkProcessing(true);
    for (const uid of selected) {
      await handleGenerateDrafts(uid);
    }
    setSelected(new Set());
    setBulkProcessing(false);
  };

  const handleBulkSendToReview = async () => {
    setBulkProcessing(true);
    for (const uid of selected) {
      await handleSendToReview(uid);
    }
    setSelected(new Set());
    setBulkProcessing(false);
  };

  const toggleSelect = (uid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.user_id)));
    }
  };

  // Filter + search + sort
  const filtered = clients
    .filter(c => {
      if (filter === 'missing_docs') return !c.has_id || !c.has_credit_report || !c.has_agreement;
      if (filter === 'ready_analyze') return c.unanalyzed_reports > 0;
      if (filter === 'ready_generate') return c.pending_flags > 0;
      if (filter === 'needs_review') return c.review_count > 0;
      if (filter === 'approved') return c.approved_count > 0;
      if (filter === 'followup') return c.latest_status === 'followup_due';
      return true;
    })
    .filter(c => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return c.full_name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.full_name.localeCompare(b.full_name); break;
        case 'created': cmp = a.created_at.localeCompare(b.created_at); break;
        case 'flags': cmp = a.pending_flags - b.pending_flags; break;
        case 'disputes': cmp = a.dispute_count - b.dispute_count; break;
        default: cmp = 0;
      }
      return sortAsc ? cmp : -cmp;
    });

  const counts = {
    all: clients.length,
    missing_docs: clients.filter(c => !c.has_id || !c.has_credit_report || !c.has_agreement).length,
    ready_analyze: clients.filter(c => c.unanalyzed_reports > 0).length,
    ready_generate: clients.filter(c => c.pending_flags > 0).length,
    needs_review: clients.filter(c => c.review_count > 0).length,
    approved: clients.filter(c => c.approved_count > 0).length,
    followup: clients.filter(c => c.latest_status === 'followup_due').length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Loading client processing grid...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {FILTER_OPTIONS.map(f => {
          const Icon = f.icon;
          const count = counts[f.key];
          const active = filter === f.key;
          return (
            <Button
              key={f.key}
              variant={active ? 'default' : 'outline'}
              size="sm"
              className="flex flex-col h-auto py-2 gap-0.5"
              onClick={() => setFilter(f.key)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{count}</span>
              <span className="text-[10px] leading-tight">{f.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Search + bulk bar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Processing Grid
              <Badge variant="outline">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <Badge variant="secondary">{selected.size} selected</Badge>
              <Button size="sm" variant="outline" onClick={handleBulkAnalyze} disabled={bulkProcessing}>
                <Brain className="h-3 w-3 mr-1" />Run Analysis
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkGenerateDrafts} disabled={bulkProcessing}>
                <FileText className="h-3 w-3 mr-1" />Generate Drafts
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkSendToReview} disabled={bulkProcessing}>
                <ArrowRight className="h-3 w-3 mr-1" />Send to Review
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              {bulkProcessing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[560px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead className="text-center">Reports</TableHead>
                  <TableHead className="text-center">Flags</TableHead>
                  <TableHead className="text-center">Disputes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Action</TableHead>
                  <TableHead>Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const isProcessing = processing.has(c.user_id);
                  const readBadge = READINESS_BADGE[c.readiness];
                  return (
                    <TableRow key={c.user_id} className={selected.has(c.user_id) ? 'bg-accent/5' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(c.user_id)}
                          onCheckedChange={() => toggleSelect(c.user_id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-40">{c.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={readBadge.variant} className="text-[10px] w-fit">{readBadge.label}</Badge>
                          <div className="flex gap-0.5">
                            <span className={`text-[10px] ${c.has_agreement ? 'text-emerald-500' : 'text-destructive'}`}>
                              {c.has_agreement ? '✓' : '✗'}Agr
                            </span>
                            <span className={`text-[10px] ${c.has_id ? 'text-emerald-500' : 'text-destructive'}`}>
                              {c.has_id ? '✓' : '✗'}ID
                            </span>
                            <span className={`text-[10px] ${c.has_credit_report ? 'text-emerald-500' : 'text-destructive'}`}>
                              {c.has_credit_report ? '✓' : '✗'}CR
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {c.report_count}
                        {c.unanalyzed_reports > 0 && (
                          <Badge variant="secondary" className="text-[10px] ml-1">{c.unanalyzed_reports} new</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.pending_flags > 0 ? (
                          <Badge className="text-[10px]">{c.pending_flags}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{c.flagged_count || '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{c.dispute_count || '—'}</TableCell>
                      <TableCell>
                        {c.latest_status ? (
                          <Badge variant="outline" className="text-[10px]">{c.latest_status.replace(/_/g, ' ')}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{c.next_action}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {c.unanalyzed_reports > 0 && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                              onClick={() => handleRunAnalysis(c.user_id)} disabled={isProcessing}>
                              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Brain className="h-3 w-3 mr-0.5" />Analyze</>}
                            </Button>
                          )}
                          {c.pending_flags > 0 && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                              onClick={() => handleGenerateDrafts(c.user_id)} disabled={isProcessing}>
                              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileText className="h-3 w-3 mr-0.5" />Draft</>}
                            </Button>
                          )}
                          {c.dispute_count > 0 && c.latest_status === 'draft_generated' && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                              onClick={() => handleSendToReview(c.user_id)} disabled={isProcessing}>
                              <ArrowRight className="h-3 w-3 mr-0.5" />Review
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                            onClick={() => setNoteModal({ userId: c.user_id, name: c.full_name || c.email })}>
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

      {/* Add Note Modal */}
      <Dialog open={!!noteModal} onOpenChange={() => { setNoteModal(null); setNoteText(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note — {noteModal?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Type admin note..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={4}
          />
          <Button onClick={handleAddNote} disabled={!noteText.trim()}>
            Save Note
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
