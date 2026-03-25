import { useEffect, useState, useCallback } from 'react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Zap, AlertTriangle, FileText, Clock, CheckCircle, Users,
  Brain, Loader2, RefreshCw, FileSearch, Upload, Send,
  ArrowRight, Eye, StickyNote
} from 'lucide-react';
import {
  getBacklogCounts, autoCreateDisputesFromFlags,
  transitionDisputeStatus, CASE_STATUS_LABELS,
  type BacklogCounts, type CaseStatus
} from '@/services/disputeWorkflow';

// --- Shared next-action engine ---
export interface ClientCaseData {
  user_id: string;
  email: string;
  full_name: string;
  report_count: number;
  unanalyzed_reports: number;
  dispute_count: number;
  flagged_count: number;
  pending_flags: number;
  review_count: number;
  approved_count: number;
  exported_count: number;
  followup_count: number;
  has_id: boolean;
  has_address: boolean;
  has_credit_report: boolean;
  has_agreement: boolean;
  latest_status: string | null;
  last_updated: string | null;
}

export function getNextAction(c: ClientCaseData): { action: string; priority: number; category: string } {
  if (!c.has_agreement) return { action: 'Client needs to sign agreement', priority: 10, category: 'intake' };
  if (!c.has_id) return { action: 'Upload government ID', priority: 9, category: 'docs' };
  if (!c.has_address) return { action: 'Upload proof of address', priority: 8, category: 'docs' };
  if (!c.has_credit_report) return { action: 'Upload credit report', priority: 7, category: 'docs' };
  if (c.unanalyzed_reports > 0) return { action: `Run AI analysis on ${c.unanalyzed_reports} report(s)`, priority: 6, category: 'analysis' };
  if (c.pending_flags > 0) return { action: `Generate drafts from ${c.pending_flags} flagged item(s)`, priority: 5, category: 'drafting' };
  if (c.review_count > 0) return { action: `Review ${c.review_count} dispute letter(s)`, priority: 4, category: 'review' };
  if (c.approved_count > 0) return { action: `Export ${c.approved_count} approved letter(s)`, priority: 3, category: 'export' };
  if (c.followup_count > 0) return { action: `Follow up on ${c.followup_count} case(s)`, priority: 2, category: 'followup' };
  if (c.dispute_count > 0) return { action: 'Monitor active disputes', priority: 1, category: 'monitor' };
  return { action: 'No action needed', priority: 0, category: 'none' };
}

export type ReadinessLevel = 'incomplete' | 'partial' | 'ready_for_analysis' | 'ready_for_drafting';

export function getReadiness(c: ClientCaseData): ReadinessLevel {
  if (!c.has_agreement || !c.has_id) return 'incomplete';
  if (!c.has_credit_report) return 'partial';
  if (c.pending_flags > 0) return 'ready_for_drafting';
  return 'ready_for_analysis';
}

export const READINESS_CONFIG: Record<ReadinessLevel, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  incomplete: { label: 'Incomplete', variant: 'destructive' },
  partial: { label: 'Partial', variant: 'secondary' },
  ready_for_analysis: { label: 'Ready for Analysis', variant: 'outline' },
  ready_for_drafting: { label: 'Ready for Drafting', variant: 'default' },
};

// --- Shared data fetcher ---
export async function fetchAllClientCases(): Promise<ClientCaseData[]> {
  const [profilesRes, clientsRes, reportsRes, flagsRes, disputesRes, agreementsRes, docsRes] = await Promise.all([
    supabase.from('profiles').select('user_id, email, first_name, middle_name, last_name, created_at'),
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

  return profiles.map(p => {
    const uid = p.user_id;
    const userReports = (reportsRes.data || []).filter(r => r.user_id === uid);
    const userFlags = (flagsRes.data || []).filter(f => f.user_id === uid);
    const userDisputes = (disputesRes.data || []).filter(d => d.user_id === uid);
    const userDocs = (docsRes.data || []).filter(d => d.user_id === uid);

    const fullName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ') || clientMap.get(uid) || '';
    const latestDispute = userDisputes.sort((a, b) =>
      (b.status_updated_at || '').localeCompare(a.status_updated_at || '')
    )[0];

    return {
      user_id: uid,
      email: p.email,
      full_name: fullName,
      report_count: userReports.length,
      unanalyzed_reports: userReports.filter(r => r.analysis_status === 'pending' || !r.analysis_status).length,
      dispute_count: userDisputes.length,
      flagged_count: userFlags.length,
      pending_flags: userFlags.filter(f => !f.dispute_letter_generated).length,
      review_count: userDisputes.filter(d => d.case_status === 'needs_admin_review').length,
      approved_count: userDisputes.filter(d => d.case_status === 'approved').length,
      exported_count: userDisputes.filter(d => d.case_status === 'exported').length,
      followup_count: userDisputes.filter(d => d.case_status === 'followup_due').length,
      has_id: userDocs.some(d => d.document_type === 'government_id'),
      has_address: userDocs.some(d => d.document_type === 'proof_of_address' || d.document_type === 'address'),
      has_credit_report: userReports.length > 0,
      has_agreement: agreementSet.has(uid),
      latest_status: latestDispute?.case_status || null,
      last_updated: latestDispute?.status_updated_at || null,
    };
  });
}

// --- Component ---
export function AdminBacklogTools() {
  const [cases, setCases] = useState<ClientCaseData[]>([]);
  const [counts, setCounts] = useState<BacklogCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [countsResult, clientCases] = await Promise.all([
        getBacklogCounts(),
        fetchAllClientCases(),
      ]);
      setCounts(countsResult);
      setCases(clientCases);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load backlog data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAnalyze = async (userId: string) => {
    setProcessing(userId);
    try {
      const { data: reports } = await supabase
        .from('credit_report_uploads')
        .select('id, file_name')
        .eq('user_id', userId)
        .eq('analysis_status', 'pending');
      if (!reports?.length) { toast({ title: 'No pending reports' }); return; }
      for (const r of reports) {
        await supabase.functions.invoke('analyze-credit-report', {
          body: { reportId: r.id, fileName: r.file_name, creditReportPath: r.file_name },
        });
      }
      toast({ title: 'Analysis Complete', description: `Analyzed ${reports.length} report(s)` });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setProcessing(null); }
  };

  const handleGenerateDrafts = async (userId: string) => {
    setProcessing(userId);
    try {
      const { data: reports } = await supabase.from('credit_report_uploads').select('id').eq('user_id', userId);
      let total = 0;
      for (const r of reports || []) {
        const result = await autoCreateDisputesFromFlags(userId, r.id);
        total += result.created;
      }
      toast({ title: 'Drafts Created', description: `Created ${total} dispute draft(s)` });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setProcessing(null); }
  };

  const handleSendToReview = async (userId: string) => {
    if (!user) return;
    setProcessing(userId);
    try {
      const { data: disputes } = await supabase
        .from('dispute_letters').select('id')
        .eq('user_id', userId).eq('case_status', 'draft_generated');
      let moved = 0;
      for (const d of disputes || []) {
        await transitionDisputeStatus(d.id, 'needs_admin_review', user.id);
        moved++;
      }
      toast({ title: 'Sent to Review', description: `${moved} dispute(s)` });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setProcessing(null); }
  };

  // Queue filters
  const todayQueue = cases
    .map(c => ({ ...c, nextAction: getNextAction(c) }))
    .filter(c => c.nextAction.priority > 0)
    .sort((a, b) => b.nextAction.priority - a.nextAction.priority);

  const missingDocs = cases.filter(c => !c.has_id || !c.has_address || !c.has_credit_report || !c.has_agreement);
  const readyAnalysis = cases.filter(c => c.unanalyzed_reports > 0);
  const readyDraft = cases.filter(c => c.pending_flags > 0);
  const needsReview = cases.filter(c => c.review_count > 0);
  const approvedExport = cases.filter(c => c.approved_count > 0);
  const followupDue = cases.filter(c => c.followup_count > 0);

  if (loading) {
    return (
      <Card><CardContent className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Loading backlog...</p>
      </CardContent></Card>
    );
  }

  const QueueRow = ({ c, showAction = true }: { c: ClientCaseData & { nextAction?: ReturnType<typeof getNextAction> }; showAction?: boolean }) => {
    const readiness = getReadiness(c);
    const rCfg = READINESS_CONFIG[readiness];
    const isProc = processing === c.user_id;
    return (
      <TableRow>
        <TableCell>
          <div>
            <p className="font-medium text-sm">{c.full_name || '—'}</p>
            <p className="text-xs text-muted-foreground truncate max-w-36">{c.email}</p>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={rCfg.variant} className="text-[10px]">{rCfg.label}</Badge>
          <div className="flex gap-1 mt-0.5">
            <span className={`text-[9px] ${c.has_agreement ? 'text-emerald-600' : 'text-destructive'}`}>{c.has_agreement ? '✓' : '✗'}Agr</span>
            <span className={`text-[9px] ${c.has_id ? 'text-emerald-600' : 'text-destructive'}`}>{c.has_id ? '✓' : '✗'}ID</span>
            <span className={`text-[9px] ${c.has_address ? 'text-emerald-600' : 'text-destructive'}`}>{c.has_address ? '✓' : '✗'}Addr</span>
            <span className={`text-[9px] ${c.has_credit_report ? 'text-emerald-600' : 'text-destructive'}`}>{c.has_credit_report ? '✓' : '✗'}CR</span>
          </div>
        </TableCell>
        <TableCell className="text-center text-sm">{c.report_count}</TableCell>
        <TableCell className="text-center text-sm">{c.pending_flags > 0 ? <Badge className="text-[10px]">{c.pending_flags}</Badge> : '—'}</TableCell>
        <TableCell className="text-center text-sm">{c.dispute_count || '—'}</TableCell>
        {showAction && c.nextAction && (
          <TableCell><span className="text-xs text-muted-foreground">{c.nextAction.action}</span></TableCell>
        )}
        <TableCell>
          <div className="flex gap-1">
            {c.unanalyzed_reports > 0 && (
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleAnalyze(c.user_id)} disabled={isProc}>
                {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Brain className="h-3 w-3 mr-0.5" />Analyze</>}
              </Button>
            )}
            {c.pending_flags > 0 && (
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleGenerateDrafts(c.user_id)} disabled={isProc}>
                {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileText className="h-3 w-3 mr-0.5" />Draft</>}
              </Button>
            )}
            {c.latest_status === 'draft_generated' && (
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handleSendToReview(c.user_id)} disabled={isProc}>
                <ArrowRight className="h-3 w-3 mr-0.5" />Review
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const QueueTable = ({ data, showAction = true }: { data: (ClientCaseData & { nextAction?: ReturnType<typeof getNextAction> })[]; showAction?: boolean }) => (
    data.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
        <p className="text-sm">Queue is clear!</p>
      </div>
    ) : (
      <ScrollArea className="h-[420px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Readiness</TableHead>
              <TableHead className="text-center">Reports</TableHead>
              <TableHead className="text-center">Flags</TableHead>
              <TableHead className="text-center">Disputes</TableHead>
              {showAction && <TableHead>Next Action</TableHead>}
              <TableHead>Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(c => <QueueRow key={c.user_id} c={c} showAction={showAction} />)}
          </TableBody>
        </Table>
      </ScrollArea>
    )
  );

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {[
          { label: "Today's Queue", count: todayQueue.length, icon: Zap, tab: 'today', color: 'text-primary' },
          { label: 'Missing Docs', count: missingDocs.length, icon: Upload, tab: 'missing', color: 'text-destructive' },
          { label: 'Ready to Analyze', count: readyAnalysis.length, icon: Brain, tab: 'analyze', color: 'text-cyan-500' },
          { label: 'Ready to Draft', count: readyDraft.length, icon: FileText, tab: 'draft', color: 'text-amber-500' },
          { label: 'Needs Review', count: needsReview.length, icon: Eye, tab: 'review', color: 'text-orange-500' },
          { label: 'Approved', count: approvedExport.length, icon: CheckCircle, tab: 'approved', color: 'text-emerald-500' },
          { label: 'Follow-Up', count: followupDue.length, icon: Clock, tab: 'followup', color: 'text-violet-500' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card
              key={s.tab}
              className={`cursor-pointer transition-all hover:border-primary/30 ${activeTab === s.tab ? 'border-primary/50 bg-accent/5' : ''}`}
              onClick={() => setActiveTab(s.tab)}
            >
              <CardContent className="pt-3 pb-2 px-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                  <span className="text-[10px] text-muted-foreground leading-tight">{s.label}</span>
                </div>
                <p className="text-xl font-bold">{s.count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Queue Content */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {activeTab === 'today' && "Today's Processing Queue"}
              {activeTab === 'missing' && 'Missing Documents Queue'}
              {activeTab === 'analyze' && 'Ready for AI Analysis'}
              {activeTab === 'draft' && 'Ready for Draft Generation'}
              {activeTab === 'review' && 'Needs Admin Review'}
              {activeTab === 'approved' && 'Approved / Export Ready'}
              {activeTab === 'followup' && 'Follow-Up Due'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchAll}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'today' && <QueueTable data={todayQueue} showAction />}
          {activeTab === 'missing' && <QueueTable data={missingDocs} showAction={false} />}
          {activeTab === 'analyze' && <QueueTable data={readyAnalysis} showAction={false} />}
          {activeTab === 'draft' && <QueueTable data={readyDraft} showAction={false} />}
          {activeTab === 'review' && <QueueTable data={needsReview} showAction={false} />}
          {activeTab === 'approved' && <QueueTable data={approvedExport} showAction={false} />}
          {activeTab === 'followup' && <QueueTable data={followupDue} showAction={false} />}
        </CardContent>
      </Card>
    </div>
  );
}
