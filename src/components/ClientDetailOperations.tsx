import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Brain, FileText, ArrowRight, CheckCircle, Clock, Loader2,
  StickyNote, Eye, Download, AlertTriangle, Shield
} from 'lucide-react';
import {
  autoCreateDisputesFromFlags, transitionDisputeStatus,
  adminApproveDispute, CASE_STATUS_LABELS, type CaseStatus,
} from '@/services/disputeWorkflow';
import { getNextAction, getReadiness, READINESS_CONFIG, type ClientCaseData } from '@/components/AdminBacklogTools';

interface Props {
  client: ClientCaseData | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface DisputeRow {
  id: string;
  creditor_name: string;
  account_number: string;
  case_status: string;
  letter_type: string;
  created_at: string;
  generated_letter: string;
}

interface FlagRow {
  id: string;
  creditor_name: string;
  flag_reason: string;
  dispute_letter_generated: boolean;
  recommended_dispute_type: string;
  flag_confidence: number;
}

interface NoteRow {
  id: string;
  note_text: string;
  created_at: string;
}

export function ClientDetailOperations({ client, open, onClose, onRefresh }: Props) {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [previewLetter, setPreviewLetter] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (client && open) fetchDetails();
  }, [client, open]);

  const fetchDetails = async () => {
    if (!client) return;
    setLoading(true);
    try {
      const [disputeRes, flagRes, noteRes] = await Promise.all([
        supabase.from('dispute_letters').select('id, creditor_name, account_number, case_status, letter_type, created_at, generated_letter')
          .eq('user_id', client.user_id).order('created_at', { ascending: false }),
        supabase.from('flagged_disputes').select('id, creditor_name, flag_reason, dispute_letter_generated, recommended_dispute_type, flag_confidence')
          .eq('user_id', client.user_id).order('created_at', { ascending: false }),
        supabase.from('clients').select('id').eq('user_id', client.user_id).single()
          .then(async ({ data: c }) => {
            if (!c) return { data: [] };
            return supabase.from('admin_notes').select('id, note_text, created_at')
              .eq('client_id', c.id).order('created_at', { ascending: false }).limit(10);
          }),
      ]);
      setDisputes((disputeRes.data || []) as DisputeRow[]);
      setFlags((flagRes.data || []) as FlagRow[]);
      setNotes((noteRes.data || []) as NoteRow[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  const readiness = getReadiness(client);
  const rCfg = READINESS_CONFIG[readiness];
  const nextAct = getNextAction(client);

  const runAnalysis = async () => {
    setProcessing('analyze');
    try {
      const { data: reports } = await supabase.from('credit_report_uploads').select('id, file_name')
        .eq('user_id', client.user_id).in('analysis_status', ['pending']);
      if (!reports?.length) { toast({ title: 'No pending reports' }); return; }
      for (const r of reports) {
        await supabase.functions.invoke('analyze-credit-report', {
          body: { reportId: r.id, fileName: r.file_name, creditReportPath: r.file_name },
        });
      }
      toast({ title: 'Analysis Complete', description: `${reports.length} report(s)` });
      fetchDetails(); onRefresh();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setProcessing(null); }
  };

  const generateDrafts = async () => {
    setProcessing('draft');
    try {
      const { data: reports } = await supabase.from('credit_report_uploads').select('id').eq('user_id', client.user_id);
      let total = 0;
      for (const r of reports || []) { total += (await autoCreateDisputesFromFlags(client.user_id, r.id)).created; }
      toast({ title: 'Drafts Created', description: `${total} draft(s)` });
      fetchDetails(); onRefresh();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setProcessing(null); }
  };

  const sendToReview = async () => {
    if (!user) return;
    setProcessing('review');
    try {
      const drafts = disputes.filter(d => d.case_status === 'draft_generated');
      for (const d of drafts) { await transitionDisputeStatus(d.id, 'needs_admin_review', user.id); }
      toast({ title: 'Sent to Review', description: `${drafts.length} dispute(s)` });
      fetchDetails(); onRefresh();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setProcessing(null); }
  };

  const approveAll = async () => {
    if (!user) return;
    setProcessing('approve');
    try {
      const pending = disputes.filter(d => d.case_status === 'needs_admin_review');
      for (const d of pending) { await adminApproveDispute(d.id, user.id); }
      toast({ title: 'Approved', description: `${pending.length} dispute(s)` });
      fetchDetails(); onRefresh();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setProcessing(null); }
  };

  const exportApproved = async () => {
    if (!user) return;
    setProcessing('export');
    try {
      const approved = disputes.filter(d => d.case_status === 'approved');
      for (const d of approved) { await transitionDisputeStatus(d.id, 'exported', user.id); }
      toast({ title: 'Exported', description: `${approved.length} dispute(s)` });
      fetchDetails(); onRefresh();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setProcessing(null); }
  };

  const addNote = async () => {
    if (!noteText.trim() || !user) return;
    try {
      const { data: c } = await supabase.from('clients').select('id').eq('user_id', client.user_id).single();
      if (c) {
        await supabase.from('admin_notes').insert({ client_id: c.id, admin_user_id: user.id, note_text: noteText });
        setNoteText('');
        fetchDetails();
        toast({ title: 'Note saved' });
      }
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const draftCount = disputes.filter(d => d.case_status === 'draft_generated').length;
  const reviewCount = disputes.filter(d => d.case_status === 'needs_admin_review').length;
  const approvedCount = disputes.filter(d => d.case_status === 'approved').length;
  const pendingFlags = flags.filter(f => !f.dispute_letter_generated).length;

  return (
    <>
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>{client.full_name || client.email}</span>
              <Badge variant={rCfg.variant} className="text-xs">{rCfg.label}</Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {/* Next Action Banner */}
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-0.5">Recommended Next Action</p>
                <p className="text-sm font-semibold text-foreground">{nextAct.action}</p>
              </div>

              {/* Document Readiness */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Document Readiness</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={client.has_agreement ? 'default' : 'destructive'} className="text-xs">
                    {client.has_agreement ? '✓' : '✗'} Agreement
                  </Badge>
                  <Badge variant={client.has_id ? 'default' : 'destructive'} className="text-xs">
                    {client.has_id ? '✓' : '✗'} Gov ID
                  </Badge>
                  <Badge variant={client.has_address ? 'default' : 'destructive'} className="text-xs">
                    {client.has_address ? '✓' : '✗'} Address
                  </Badge>
                  <Badge variant={client.has_credit_report ? 'default' : 'destructive'} className="text-xs">
                    {client.has_credit_report ? '✓' : '✗'} Credit Report
                  </Badge>
                </div>
              </div>

              {/* Quick Workflow Actions */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Workflow Actions</p>
                <div className="flex gap-2 flex-wrap">
                  {client.unanalyzed_reports > 0 && (
                    <Button size="sm" variant="outline" onClick={runAnalysis} disabled={!!processing}>
                      {processing === 'analyze' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />}
                      Analyze {client.unanalyzed_reports} Report(s)
                    </Button>
                  )}
                  {pendingFlags > 0 && (
                    <Button size="sm" variant="outline" onClick={generateDrafts} disabled={!!processing}>
                      {processing === 'draft' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                      Generate {pendingFlags} Draft(s)
                    </Button>
                  )}
                  {draftCount > 0 && (
                    <Button size="sm" variant="outline" onClick={sendToReview} disabled={!!processing}>
                      {processing === 'review' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
                      Send {draftCount} to Review
                    </Button>
                  )}
                  {reviewCount > 0 && (
                    <Button size="sm" onClick={approveAll} disabled={!!processing}>
                      {processing === 'approve' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      Approve {reviewCount}
                    </Button>
                  )}
                  {approvedCount > 0 && (
                    <Button size="sm" variant="outline" onClick={exportApproved} disabled={!!processing}>
                      {processing === 'export' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                      Export {approvedCount}
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Flagged Items */}
              {flags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                    Flagged Items ({flags.length})
                  </p>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Creditor</TableHead>
                          <TableHead className="text-xs">Reason</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Conf.</TableHead>
                          <TableHead className="text-xs">Drafted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flags.slice(0, 10).map(f => (
                          <TableRow key={f.id}>
                            <TableCell className="text-xs font-medium">{f.creditor_name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{f.flag_reason}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[9px]">{f.recommended_dispute_type || '—'}</Badge></TableCell>
                            <TableCell className="text-xs">{f.flag_confidence ? `${Math.round(f.flag_confidence * 100)}%` : '—'}</TableCell>
                            <TableCell>{f.dispute_letter_generated ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Disputes */}
              {disputes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                    Dispute Letters ({disputes.length})
                  </p>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Creditor</TableHead>
                          <TableHead className="text-xs">Account</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Preview</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disputes.map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="text-xs font-medium">{d.creditor_name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{d.account_number || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px]">
                                {CASE_STATUS_LABELS[d.case_status as CaseStatus] || d.case_status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{d.letter_type || '—'}</TableCell>
                            <TableCell>
                              {d.generated_letter && (
                                <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setPreviewLetter(d.generated_letter)}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <Separator />

              {/* Admin Notes */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Admin Notes</p>
                <div className="flex gap-2">
                  <Textarea placeholder="Add a note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} className="text-sm" />
                  <Button size="sm" onClick={addNote} disabled={!noteText.trim()} className="self-end">
                    <StickyNote className="h-3 w-3 mr-1" />Save
                  </Button>
                </div>
                {notes.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {notes.map(n => (
                      <div key={n.id} className="text-xs p-2 rounded bg-muted">
                        <span className="text-muted-foreground">{new Date(n.created_at).toLocaleDateString()} — </span>
                        {n.note_text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Letter Preview Sub-Dialog */}
      <Dialog open={!!previewLetter} onOpenChange={() => setPreviewLetter(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader><DialogTitle>Letter Preview</DialogTitle></DialogHeader>
          <ScrollArea className="h-[400px] border rounded-md p-4 bg-muted/30">
            <pre className="whitespace-pre-wrap text-sm font-mono">{previewLetter}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
