import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, Brain, FileText, AlertTriangle, Loader2, Eye, CheckCircle,
  Zap, RefreshCw, User, FileSearch, ArrowRight
} from 'lucide-react';
import { autoCreateDisputesFromFlags, transitionDisputeStatus } from '@/services/disputeWorkflow';

const LETTER_TYPES = [
  { value: '605B_time_barred', label: '605B Time-Barred' },
  { value: '611_verification', label: '611 Verification' },
  { value: '623_furnisher_dispute', label: '623 Furnisher Dispute' },
  { value: 'validation_letter', label: 'Debt Validation' },
  { value: 'standard_dispute', label: 'Standard Dispute' },
  { value: 'goodwill_letter', label: 'Goodwill Letter' },
];

interface ClientOption {
  user_id: string;
  email: string;
  full_name?: string;
}

interface ReportOption {
  id: string;
  file_name: string;
  analysis_status: string;
  uploaded_at: string;
  user_id: string;
  flagged_accounts_count: number;
  ai_analysis_summary: string | null;
}

interface FlaggedItem {
  id: string;
  creditor_name: string;
  account_number: string | null;
  flag_reason: string;
  flag_confidence: number | null;
  violation_type: string | null;
  recommended_dispute_type: string | null;
  dispute_letter_generated: boolean;
  status: string;
  balance: number | null;
  user_id: string;
  credit_report_id: string | null;
}

interface DisputeOption {
  id: string;
  creditor_name: string;
  letter_title: string;
  case_status: string;
  letter_type: string | null;
  generated_letter: string | null;
}

export function AdminAIControlPanel() {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const { toast } = useToast();

  // Client selection
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState('');

  // Reports
  const [reports, setReports] = useState<ReportOption[]>([]);
  const [selectedReport, setSelectedReport] = useState('');

  // Flagged items from analysis
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);

  // Disputes for letter gen
  const [disputes, setDisputes] = useState<DisputeOption[]>([]);
  const [selectedDispute, setSelectedDispute] = useState('');
  const [selectedLetterType, setSelectedLetterType] = useState('standard_dispute');

  // Violation text analysis
  const [violationText, setViolationText] = useState('');

  // Results
  const [analysisResult, setAnalysisResult] = useState('');
  const [letterResult, setLetterResult] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');

  const isAuthorized = isAdmin() && user?.email === 'admin@expresscredit.com';

  useEffect(() => {
    if (!isAuthorized) return;
    fetchClients();
  }, [isAuthorized]);

  useEffect(() => {
    if (selectedClient) {
      fetchReportsForClient(selectedClient);
      fetchDisputesForClient(selectedClient);
      fetchFlaggedForClient(selectedClient);
    } else {
      setReports([]);
      setDisputes([]);
      setFlaggedItems([]);
      setSelectedReport('');
      setSelectedDispute('');
    }
  }, [selectedClient]);

  useEffect(() => {
    if (selectedReport) {
      fetchFlaggedForReport(selectedReport);
    }
  }, [selectedReport]);

  const fetchClients = async () => {
    const { data: profiles } = await supabase.from('profiles').select('user_id, email').order('created_at', { ascending: false });
    const { data: clientsData } = await supabase.from('clients').select('user_id, full_name');
    const clientMap = new Map((clientsData || []).map(c => [c.user_id, c.full_name]));
    setClients((profiles || []).map(p => ({
      user_id: p.user_id,
      email: p.email,
      full_name: clientMap.get(p.user_id) || undefined,
    })));
  };

  const fetchReportsForClient = async (userId: string) => {
    const { data } = await supabase
      .from('credit_report_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setReports((data || []) as ReportOption[]);
  };

  const fetchDisputesForClient = async (userId: string) => {
    const { data } = await supabase
      .from('dispute_letters')
      .select('id, creditor_name, letter_title, case_status, letter_type, generated_letter')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setDisputes((data || []) as DisputeOption[]);
  };

  const fetchFlaggedForClient = async (userId: string) => {
    const { data } = await supabase
      .from('flagged_disputes')
      .select('*')
      .eq('user_id', userId)
      .order('flag_confidence', { ascending: false });
    setFlaggedItems((data || []) as FlaggedItem[]);
  };

  const fetchFlaggedForReport = async (reportId: string) => {
    const { data } = await supabase
      .from('flagged_disputes')
      .select('*')
      .eq('credit_report_id', reportId)
      .order('flag_confidence', { ascending: false });
    if (data && data.length > 0) {
      setFlaggedItems(data as FlaggedItem[]);
    }
  };

  const refreshAll = useCallback(() => {
    if (selectedClient) {
      fetchReportsForClient(selectedClient);
      fetchDisputesForClient(selectedClient);
      fetchFlaggedForClient(selectedClient);
    }
  }, [selectedClient]);

  if (!isAuthorized) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-2" />
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm text-muted-foreground">This panel is only available to the primary admin.</p>
        </CardContent>
      </Card>
    );
  }

  const handleAnalyzeReport = async () => {
    if (!selectedReport) return;
    setProcessing(true);
    setAnalysisResult('');
    try {
      const report = reports.find(r => r.id === selectedReport);
      const { data, error } = await supabase.functions.invoke('analyze-credit-report', {
        body: { creditReportPath: report?.file_name, fileName: report?.file_name, reportId: selectedReport },
      });
      if (error) throw error;
      setAnalysisResult(JSON.stringify(data, null, 2));
      toast({ title: 'Analysis Complete', description: `Found ${data?.flaggedAccountsCount || 0} flagged accounts` });
      refreshAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyzeViolations = async () => {
    if (!violationText.trim()) return;
    setProcessing(true);
    setAnalysisResult('');
    try {
      const client = clients.find(c => c.user_id === selectedClient);
      const { data, error } = await supabase.functions.invoke('analyze-credit-violations', {
        body: { creditReportText: violationText, clientName: client?.full_name || client?.email || 'Client' },
      });
      if (error) throw error;
      setAnalysisResult(data?.analysis || JSON.stringify(data, null, 2));
      toast({ title: 'Violation Analysis Complete' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkCreateDisputes = async () => {
    if (!selectedClient || !selectedReport) return;
    setProcessing(true);
    try {
      const result = await autoCreateDisputesFromFlags(selectedClient, selectedReport);
      toast({ title: 'Disputes Created', description: `Created ${result.created} dispute(s)${result.errors.length ? `, ${result.errors.length} errors` : ''}` });
      refreshAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateLetter = async () => {
    if (!selectedDispute) return;
    setProcessing(true);
    setLetterResult('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-dispute-letter-secure', {
        body: { disputeId: selectedDispute, letterType: selectedLetterType },
      });
      if (error) throw error;
      setLetterResult(data?.generatedLetter || data?.letter || 'Letter generated — check dispute record');
      toast({ title: 'Letter Generated' });
      refreshAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handlePreviewLetter = async () => {
    if (!selectedDispute) return;
    setProcessing(true);
    setLetterResult('');
    try {
      const dispute = disputes.find(d => d.id === selectedDispute);
      const { data, error } = await supabase.functions.invoke('preview-dispute-letter', {
        body: {
          creditorName: dispute?.creditor_name || '',
          accountNumber: '',
          issueType: dispute?.letter_type || 'standard_dispute',
          additionalNotes: '',
        },
      });
      if (error) throw error;
      setLetterResult(data?.letter || data?.preview || JSON.stringify(data, null, 2));
      toast({ title: 'Preview Generated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handlePushToReview = async (disputeId: string) => {
    if (!user) return;
    setProcessing(true);
    try {
      await transitionDisputeStatus(disputeId, 'needs_admin_review', user.id, { source: 'ai_ops_panel' });
      toast({ title: 'Moved to Review Queue' });
      refreshAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const selectedClientLabel = clients.find(c => c.user_id === selectedClient);
  const pendingFlags = flaggedItems.filter(f => !f.dispute_letter_generated);

  return (
    <div className="space-y-4">
      {/* Client Selector */}
      <Card className="glass-card border-primary/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground font-medium">SELECT CLIENT</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client to work on..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {c.full_name ? `${c.full_name} (${c.email})` : c.email}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClient && (
              <div className="flex gap-2 flex-shrink-0">
                <Badge variant="outline">{reports.length} report{reports.length !== 1 ? 's' : ''}</Badge>
                <Badge variant="outline">{disputes.length} dispute{disputes.length !== 1 ? 's' : ''}</Badge>
                <Badge variant={pendingFlags.length > 0 ? 'default' : 'secondary'}>
                  {pendingFlags.length} flagged
                </Badge>
                <Button variant="ghost" size="icon" onClick={refreshAll}><RefreshCw className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedClient ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select a Client to Begin</h3>
            <p className="text-sm text-muted-foreground">Choose a client above to access AI analysis, dispute generation, and workflow tools</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Operations — {selectedClientLabel?.full_name || selectedClientLabel?.email}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analysis">Analyze Report</TabsTrigger>
                <TabsTrigger value="flagged">Flagged Items ({flaggedItems.length})</TabsTrigger>
                <TabsTrigger value="letters">Generate Letters</TabsTrigger>
                <TabsTrigger value="violations">Violations</TabsTrigger>
              </TabsList>

              {/* ANALYSIS TAB */}
              <TabsContent value="analysis" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Credit Report</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger><SelectValue placeholder="Choose a report..." /></SelectTrigger>
                    <SelectContent>
                      {reports.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          <span className="flex items-center gap-2">
                            <FileSearch className="h-3 w-3" />
                            {r.file_name}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {r.analysis_status || 'pending'}
                            </Badge>
                            {r.flagged_accounts_count > 0 && (
                              <Badge className="ml-1 text-xs">{r.flagged_accounts_count} flagged</Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAnalyzeReport} disabled={!selectedReport || processing}>
                    {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Brain className="h-4 w-4 mr-1" />}
                    Run AI Analysis
                  </Button>
                  {selectedReport && pendingFlags.length > 0 && (
                    <Button variant="secondary" onClick={handleBulkCreateDisputes} disabled={processing}>
                      <Zap className="h-4 w-4 mr-1" />
                      Create Disputes from {pendingFlags.length} Flags
                    </Button>
                  )}
                </div>
                {analysisResult && (
                  <ScrollArea className="h-[300px] rounded-lg border">
                    <pre className="p-4 text-xs">{analysisResult}</pre>
                  </ScrollArea>
                )}
              </TabsContent>

              {/* FLAGGED ITEMS TAB */}
              <TabsContent value="flagged" className="mt-4">
                {flaggedItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No flagged items. Run analysis on a credit report to generate flags.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{pendingFlags.length} pending, {flaggedItems.length - pendingFlags.length} processed</p>
                      {pendingFlags.length > 0 && selectedReport && (
                        <Button size="sm" onClick={handleBulkCreateDisputes} disabled={processing}>
                          <Zap className="h-4 w-4 mr-1" />
                          Bulk Create Disputes
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Creditor</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Violation</TableHead>
                            <TableHead>Rec. Type</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {flaggedItems.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.creditor_name}
                                {item.balance && <span className="text-xs text-muted-foreground ml-1">(${item.balance})</span>}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-xs">{item.flag_reason}</TableCell>
                              <TableCell>
                                {item.flag_confidence ? (
                                  <Badge variant={item.flag_confidence >= 0.8 ? 'default' : 'secondary'}>
                                    {Math.round(item.flag_confidence * 100)}%
                                  </Badge>
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                {item.violation_type ? (
                                  <Badge variant="outline" className="text-xs">{item.violation_type}</Badge>
                                ) : '—'}
                              </TableCell>
                              <TableCell className="text-xs">{item.recommended_dispute_type || '—'}</TableCell>
                              <TableCell>
                                {item.dispute_letter_generated ? (
                                  <Badge className="bg-emerald-600 text-xs">Dispute Created</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>

              {/* LETTER GENERATION TAB */}
              <TabsContent value="letters" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Dispute</Label>
                    <Select value={selectedDispute} onValueChange={setSelectedDispute}>
                      <SelectTrigger><SelectValue placeholder="Choose a dispute..." /></SelectTrigger>
                      <SelectContent>
                        {disputes.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            <span className="flex items-center gap-2">
                              {d.creditor_name || 'Unknown'} — {d.letter_title}
                              <Badge variant="outline" className="text-xs ml-1">{d.case_status}</Badge>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Letter Type</Label>
                    <Select value={selectedLetterType} onValueChange={setSelectedLetterType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LETTER_TYPES.map(lt => (
                          <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleGenerateLetter} disabled={!selectedDispute || processing}>
                    {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                    Generate Secure Letter
                  </Button>
                  <Button variant="outline" onClick={handlePreviewLetter} disabled={!selectedDispute || processing}>
                    <Eye className="h-4 w-4 mr-1" />Preview
                  </Button>
                  {selectedDispute && (
                    <Button variant="secondary" onClick={() => handlePushToReview(selectedDispute)} disabled={processing}>
                      <ArrowRight className="h-4 w-4 mr-1" />Push to Review Queue
                    </Button>
                  )}
                </div>

                {/* Disputes list with quick actions */}
                {disputes.length > 0 && (
                  <div className="border rounded-lg">
                    <div className="p-3 border-b bg-muted/30">
                      <p className="text-sm font-medium">Client Disputes ({disputes.length})</p>
                    </div>
                    <ScrollArea className="h-[250px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Creditor</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Letter</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {disputes.map(d => (
                            <TableRow key={d.id} className={selectedDispute === d.id ? 'bg-primary/5' : ''}>
                              <TableCell className="font-medium text-xs">{d.creditor_name}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{d.letter_type || '—'}</Badge></TableCell>
                              <TableCell><Badge variant="secondary" className="text-xs">{d.case_status}</Badge></TableCell>
                              <TableCell>
                                {d.generated_letter ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <span className="text-xs text-muted-foreground">None</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => setSelectedDispute(d.id)}>
                                    Select
                                  </Button>
                                  {d.case_status === 'draft_generated' && (
                                    <Button size="sm" variant="ghost" onClick={() => handlePushToReview(d.id)} disabled={processing}>
                                      <ArrowRight className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}

                {letterResult && (
                  <ScrollArea className="h-[300px] rounded-lg border">
                    <pre className="p-4 text-sm whitespace-pre-wrap">{letterResult}</pre>
                  </ScrollArea>
                )}
              </TabsContent>

              {/* VIOLATIONS TAB */}
              <TabsContent value="violations" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Paste Credit Report Text for Violation Detection</Label>
                  <Textarea
                    value={violationText}
                    onChange={e => setViolationText(e.target.value)}
                    placeholder="Paste credit report text here for FCRA/FDCPA violation analysis..."
                    rows={8}
                    maxLength={15000}
                  />
                  <p className="text-xs text-muted-foreground">{violationText.length}/15000</p>
                </div>
                <Button onClick={handleAnalyzeViolations} disabled={!violationText.trim() || processing}>
                  {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-1" />}
                  Detect Violations
                </Button>
                {analysisResult && activeTab === 'violations' && (
                  <ScrollArea className="h-[300px] rounded-lg border">
                    <pre className="p-4 text-sm whitespace-pre-wrap">{analysisResult}</pre>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
