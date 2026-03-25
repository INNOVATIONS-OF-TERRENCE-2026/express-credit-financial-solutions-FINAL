import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Zap, AlertTriangle, FileText, Clock, CheckCircle, Users,
  Brain, Loader2, RefreshCw, ArrowRight, FileSearch, Upload
} from 'lucide-react';
import {
  getBacklogCounts, autoCreateDisputesFromFlags,
  transitionDisputeStatus, CASE_STATUS_LABELS,
  type BacklogCounts, type CaseStatus
} from '@/services/disputeWorkflow';

interface ClientCase {
  user_id: string;
  email: string;
  full_name?: string;
  report_count: number;
  dispute_count: number;
  flagged_count: number;
  pending_flags: number;
  has_id: boolean;
  has_address: boolean;
  has_credit_report: boolean;
  has_agreement: boolean;
  latest_status?: string;
  needs_action: string[];
}

export function AdminBacklogTools() {
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [counts, setCounts] = useState<BacklogCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<string>('priority');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [countsResult, profilesRes, clientsRes, reportsRes, flagsRes, disputesRes, agreementsRes, docsRes] = await Promise.all([
        getBacklogCounts(),
        supabase.from('profiles').select('user_id, email').order('created_at', { ascending: false }),
        supabase.from('clients').select('user_id, full_name'),
        supabase.from('credit_report_uploads').select('user_id, id, analysis_status'),
        supabase.from('flagged_disputes').select('user_id, id, dispute_letter_generated'),
        supabase.from('dispute_letters').select('user_id, id, case_status'),
        supabase.from('client_agreements').select('user_id'),
        supabase.from('client_documents').select('user_id, document_type, status'),
      ]);

      setCounts(countsResult);

      const profiles = profilesRes.data || [];
      const clientMap = new Map((clientsRes.data || []).map(c => [c.user_id, c.full_name]));
      const agreementSet = new Set((agreementsRes.data || []).map(a => a.user_id));

      const caseMap = new Map<string, ClientCase>();

      for (const p of profiles) {
        const uid = p.user_id;
        const userReports = (reportsRes.data || []).filter(r => r.user_id === uid);
        const userFlags = (flagsRes.data || []).filter(f => f.user_id === uid);
        const userDisputes = (disputesRes.data || []).filter(d => d.user_id === uid);
        const userDocs = (docsRes.data || []).filter(d => d.user_id === uid);

        const pendingFlags = userFlags.filter(f => !f.dispute_letter_generated).length;
        const hasId = userDocs.some(d => d.document_type === 'government_id');
        const hasAddress = userDocs.some(d => d.document_type === 'proof_of_address' || d.document_type === 'address');
        const hasCreditReport = userReports.length > 0;
        const hasAgreement = agreementSet.has(uid);

        const needs: string[] = [];
        if (!hasAgreement) needs.push('Agreement');
        if (!hasId) needs.push('ID');
        if (!hasCreditReport) needs.push('Credit Report');
        if (pendingFlags > 0) needs.push(`${pendingFlags} flags pending`);
        const unanalyzed = userReports.filter(r => r.analysis_status === 'pending').length;
        if (unanalyzed > 0) needs.push(`${unanalyzed} report(s) unanalyzed`);

        const latestDispute = userDisputes[0];

        caseMap.set(uid, {
          user_id: uid,
          email: p.email,
          full_name: clientMap.get(uid),
          report_count: userReports.length,
          dispute_count: userDisputes.length,
          flagged_count: userFlags.length,
          pending_flags: pendingFlags,
          has_id: hasId,
          has_address: hasAddress,
          has_credit_report: hasCreditReport,
          has_agreement: hasAgreement,
          latest_status: latestDispute?.case_status || undefined,
          needs_action: needs,
        });
      }

      setCases(Array.from(caseMap.values()));
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load backlog data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAnalyze = async (userId: string) => {
    setProcessing(userId);
    try {
      const { data: reports } = await supabase
        .from('credit_report_uploads')
        .select('id, file_name')
        .eq('user_id', userId)
        .eq('analysis_status', 'pending');

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
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkCreateDisputes = async (userId: string) => {
    setProcessing(userId);
    try {
      const { data: reports } = await supabase
        .from('credit_report_uploads')
        .select('id')
        .eq('user_id', userId);

      let totalCreated = 0;
      for (const report of reports || []) {
        const result = await autoCreateDisputesFromFlags(userId, report.id);
        totalCreated += result.created;
      }

      toast({ title: 'Disputes Created', description: `Created ${totalCreated} dispute(s)` });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const getFilteredCases = () => {
    switch (filterView) {
      case 'priority':
        return cases.filter(c => c.needs_action.length > 0).sort((a, b) => b.needs_action.length - a.needs_action.length);
      case 'missing-docs':
        return cases.filter(c => !c.has_id || !c.has_credit_report || !c.has_agreement);
      case 'ready-to-analyze':
        return cases.filter(c => c.report_count > 0 && c.needs_action.some(n => n.includes('unanalyzed')));
      case 'ready-to-generate':
        return cases.filter(c => c.pending_flags > 0);
      case 'needs-review':
        return cases.filter(c => c.latest_status === 'needs_admin_review');
      case 'all':
      default:
        return cases;
    }
  };

  const filteredCases = getFilteredCases();
  const statuses = counts ? Object.keys(CASE_STATUS_LABELS) as CaseStatus[] : [];
  const actionableCount = cases.filter(c => c.needs_action.length > 0).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Loading backlog data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Priority Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-destructive/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Need Action</span>
            </div>
            <p className="text-2xl font-bold">{actionableCount}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Ready to Analyze</span>
            </div>
            <p className="text-2xl font-bold">{cases.filter(c => c.needs_action.some(n => n.includes('unanalyzed'))).length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Ready to Generate</span>
            </div>
            <p className="text-2xl font-bold">{cases.filter(c => c.pending_flags > 0).length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Awaiting Review</span>
            </div>
            <p className="text-2xl font-bold">{counts?.needs_admin_review || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Backlog Work Queue
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 flex-wrap mb-4">
            {[
              { key: 'priority', label: `Priority (${cases.filter(c => c.needs_action.length > 0).length})` },
              { key: 'missing-docs', label: 'Missing Docs' },
              { key: 'ready-to-analyze', label: 'Ready to Analyze' },
              { key: 'ready-to-generate', label: 'Ready to Generate' },
              { key: 'needs-review', label: 'Needs Review' },
              { key: 'all', label: `All (${cases.length})` },
            ].map(f => (
              <Button
                key={f.key}
                size="sm"
                variant={filterView === f.key ? 'default' : 'outline'}
                onClick={() => setFilterView(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {filteredCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              <p>No cases match this filter. Nice work!</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>File Readiness</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Disputes</TableHead>
                    <TableHead>Needs</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map(c => (
                    <TableRow key={c.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={c.has_agreement ? 'default' : 'destructive'} className="text-xs">
                            {c.has_agreement ? '✓' : '✗'} Agree
                          </Badge>
                          <Badge variant={c.has_id ? 'default' : 'secondary'} className="text-xs">
                            {c.has_id ? '✓' : '✗'} ID
                          </Badge>
                          <Badge variant={c.has_credit_report ? 'default' : 'secondary'} className="text-xs">
                            {c.has_credit_report ? '✓' : '✗'} CR
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{c.report_count}</TableCell>
                      <TableCell>
                        {c.pending_flags > 0 ? (
                          <Badge className="text-xs">{c.pending_flags} pending</Badge>
                        ) : c.flagged_count > 0 ? (
                          <span className="text-xs text-muted-foreground">{c.flagged_count} processed</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.dispute_count}
                        {c.latest_status && (
                          <Badge variant="outline" className="text-xs ml-1">{c.latest_status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.needs_action.slice(0, 2).map((n, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{n}</Badge>
                          ))}
                          {c.needs_action.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{c.needs_action.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {c.needs_action.some(n => n.includes('unanalyzed')) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBulkAnalyze(c.user_id)}
                              disabled={processing === c.user_id}
                            >
                              {processing === c.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                            </Button>
                          )}
                          {c.pending_flags > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBulkCreateDisputes(c.user_id)}
                              disabled={processing === c.user_id}
                            >
                              {processing === c.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
