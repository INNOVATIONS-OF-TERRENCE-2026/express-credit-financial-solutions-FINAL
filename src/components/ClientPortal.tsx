import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Upload, FileText, CreditCard, Shield, User, Brain, Clock, Copy, Bell, Activity, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ClientActivityTimeline } from '@/components/ClientActivityTimeline';
import { ScorePredictionCard } from '@/components/ScorePredictionCard';
import { ClientNotificationsPanel, useUnreadNotificationCount } from '@/components/ClientNotificationsPanel';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';
import { ClientDocumentManager } from '@/components/ClientDocumentManager';
import { ClientAgreementModal } from '@/components/ClientAgreementModal';
import { useClientAgreement } from '@/hooks/useClientAgreement';
import { DemoUserBanner } from '@/components/DemoUserBanner';
import { ReceiptGenerator } from '@/components/ReceiptGenerator';
import { AIAnalysisViewer } from '@/components/AIAnalysisViewer';
import { downloadAsPdf } from '@/lib/documentUtils';

interface ClientData {
  id: string;
  full_name: string;
  email: string;
  membership_plan: string;
  dob?: string;
  ssn_last4?: string;
  address?: string;
  user_id?: string;
  progress_status?: number;
  agreement_signed?: boolean;
  documents_uploaded?: number;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

interface ClientPortalProps { 
  clientName: string;
  /** When set (admin viewing a client), fetch data by clients.id instead of user_id */
  resolvedClientId?: string | null;
  /** When true, disables client-only auth assumptions (agreement modals, sign-out, realtime subs) */
  isAdminPreview?: boolean;
}

interface CreditReportUpload {
  id: string;
  file_name: string;
  file_path?: string;
  analysis_status: string;
  flagged_accounts_count: number;
  ai_analysis_summary: string | null;
  created_at: string;
}

interface DisputeLetter {
  id: string;
  creditor_name: string;
  account_number: string;
  issue_type: string;
  case_status: string;
  generated_letter: string;
  letter_type: string | null;
  created_at: string;
}

export function ClientPortal({ clientName, resolvedClientId, isAdminPreview = false }: ClientPortalProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [creditReports, setCreditReports] = useState<CreditReportUpload[]>([]);
  const [disputeLetters, setDisputeLetters] = useState<DisputeLetter[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [creditScores, setCreditScores] = useState<{ experian_score: number | null; equifax_score: number | null; transunion_score: number | null } | null>(null);
  const [previousScores, setPreviousScores] = useState<{ experian_score: number | null; equifax_score: number | null; transunion_score: number | null } | null>(null);
  const { hasSignedAgreement, loading: agreementLoading, refetchAgreementStatus } = useClientAgreement();

  const handleDownloadReport = async (report: CreditReportUpload) => {
    if (!report.file_path) {
      toast({ title: 'No file', description: 'This report has no attached file.', variant: 'destructive' });
      return;
    }
    try {
      await downloadAsPdf('credit-reports', report.file_path, report.file_name);
      toast({ title: 'Downloaded', description: 'Report saved as PDF.' });
    } catch (err: any) {
      toast({ title: 'Download failed', description: err?.message || 'Try again', variant: 'destructive' });
    }
  };

  const handleDownloadLetter = (letter: DisputeLetter) => {
    import('jspdf').then(({ jsPDF }) => {
      const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
      const margin = 54;
      const maxW = pdf.internal.pageSize.getWidth() - margin * 2;
      pdf.setFont('Times', 'Normal');
      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(letter.generated_letter || '', maxW);
      let y = margin;
      const lineH = 14;
      const pageH = pdf.internal.pageSize.getHeight();
      lines.forEach((ln: string) => {
        if (y > pageH - margin) { pdf.addPage(); y = margin; }
        pdf.text(ln, margin, y);
        y += lineH;
      });
      pdf.save(`Dispute-${letter.creditor_name || 'Letter'}.pdf`);
    });
  };
  
  useEffect(() => {
    if (!isAdminPreview && !agreementLoading && hasSignedAgreement === false) setShowAgreementModal(true);
  }, [hasSignedAgreement, agreementLoading, isAdminPreview]);

  useEffect(() => {
    if (user) { fetchClientData(); fetchReceipts(); fetchCreditReports(); fetchDisputeLetters(); fetchCreditScores(); }
  }, [user, resolvedClientId]);

  useEffect(() => {
    if (!user) return;
    // Determine whose data to subscribe to for realtime updates
    const targetUserId = resolvedClientId ? null : user.id; // Only subscribe via user_id filter for own portal
    if (!targetUserId) return; // Admin viewing — skip realtime subscriptions (data is fetched on load)

    const reportChannel = supabase.channel('client-credit-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_report_uploads', filter: `user_id=eq.${targetUserId}` }, () => { fetchCreditReports(); })
      .subscribe();
    const disputeChannel = supabase.channel('client-disputes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispute_letters', filter: `user_id=eq.${targetUserId}` }, () => { fetchDisputeLetters(); })
      .subscribe();
    const scoresChannel = supabase.channel('client-credit-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_credit_scores', filter: `user_id=eq.${targetUserId}` }, () => { fetchCreditScores(); })
      .subscribe();
    const clientChannel = supabase.channel('client-data-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `user_id=eq.${targetUserId}` }, () => { fetchClientData(); })
      .subscribe();
    const disputeCasesChannel = supabase.channel('client-dispute-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispute_cases', filter: `user_id=eq.${targetUserId}` }, () => { })
      .subscribe();
    const cipChannel = supabase.channel('client-cip-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_intelligence_packets' }, () => { fetchClientData(); })
      .subscribe();
    return () => { supabase.removeChannel(reportChannel); supabase.removeChannel(disputeChannel); supabase.removeChannel(scoresChannel); supabase.removeChannel(clientChannel); supabase.removeChannel(disputeCasesChannel); supabase.removeChannel(cipChannel); };
  }, [user, resolvedClientId]);

  const fetchClientData = async () => {
    try {
      let data, error;
      if (resolvedClientId) {
        // Admin viewing a specific client — query by clients.id
        ({ data, error } = await supabase.from('clients').select('*').eq('id', resolvedClientId).single());
      } else {
        // Regular user viewing own portal — query by user_id
        ({ data, error } = await supabase.from('clients').select('*').eq('user_id', user?.id).single());
      }
      if (!error) setClientData(data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };
  const fetchReceipts = async () => { 
    const userId = resolvedClientId ? (clientData?.user_id || '') : user?.id;
    if (!userId) return;
    const { data } = await supabase.from('payment_receipts').select('*').eq('user_id', userId).order('created_at', { ascending: false }); 
    setReceipts(data || []); 
  };
  const fetchCreditReports = async () => { 
    if (resolvedClientId) {
      // For admin: try client_id first, fallback to user_id
      const { data } = await supabase.from('credit_report_uploads').select('*').eq('client_id', resolvedClientId).order('created_at', { ascending: false });
      if (data && data.length > 0) { setCreditReports(data as CreditReportUpload[]); return; }
      // Fallback: query by user_id if client has one
      if (clientData?.user_id) {
        const { data: byUser } = await supabase.from('credit_report_uploads').select('*').eq('user_id', clientData.user_id).order('created_at', { ascending: false });
        setCreditReports((byUser || []) as CreditReportUpload[]);
      } else {
        setCreditReports([]);
      }
    } else {
      const { data } = await supabase.from('credit_report_uploads').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }); 
      setCreditReports((data || []) as CreditReportUpload[]); 
    }
  };
  const fetchDisputeLetters = async () => { 
    if (resolvedClientId) {
      const { data } = await supabase.from('dispute_letters').select('*').eq('client_id', resolvedClientId).order('created_at', { ascending: false });
      if (data && data.length > 0) { setDisputeLetters(data as DisputeLetter[]); return; }
      if (clientData?.user_id) {
        const { data: byUser } = await supabase.from('dispute_letters').select('*').eq('user_id', clientData.user_id).order('created_at', { ascending: false });
        setDisputeLetters((byUser || []) as DisputeLetter[]);
      } else {
        setDisputeLetters([]);
      }
    } else {
      const { data } = await supabase.from('dispute_letters').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }); 
      setDisputeLetters((data || []) as DisputeLetter[]); 
    }
  };
  const fetchCreditScores = async () => {
    if (resolvedClientId) {
      const { data } = await supabase.from('client_credit_scores' as any).select('*').eq('client_id', resolvedClientId).single();
      if (data) { setCreditScores(data as any); return; }
      if (clientData?.user_id) {
        const { data: byUser } = await supabase.from('client_credit_scores' as any).select('*').eq('user_id', clientData.user_id).single();
        if (byUser) setCreditScores(byUser as any);
      }
    } else {
      if (!user) return;
      const { data } = await supabase.from('client_credit_scores' as any).select('*').eq('user_id', user.id).single();
      if (data) setCreditScores(data as any);
    }
  };

  const handleSignOut = async () => { await signOut(); toast({ title: 'Signed out', description: 'You have been successfully signed out.' }); };

  if (loading || (!isAdminPreview && agreementLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <div className="grid grid-cols-2 gap-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center"><Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><CardTitle>Client data not found</CardTitle><CardDescription>Please contact support.</CardDescription></CardHeader>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      analyzing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return <Badge className={variants[status] || 'bg-muted text-muted-foreground'}>{status}</Badge>;
  };

  const clientUserId = isAdminPreview ? (clientData?.user_id || null) : user?.id || null;
  const unreadCount = useUnreadNotificationCount(clientUserId);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'documents', label: 'Documents', icon: Upload },
    { id: 'credit-reports', label: 'Reports', icon: FileText },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Brain },
    { id: 'dispute-letters', label: 'Disputes', icon: Shield },
    { id: 'timeline', label: 'Timeline', icon: Activity },
    { id: 'notifications', label: `Messages${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell },
    { id: 'agreement', label: 'Agreement', icon: CreditCard },
    { id: 'membership', label: 'Membership', icon: Clock },
  ];

  return (
    <>
      {!isAdminPreview && <ClientAgreementModal isOpen={showAgreementModal} onClose={() => setShowAgreementModal(false)} onAgreementSigned={() => { refetchAgreementStatus(); setShowAgreementModal(false); }} />}
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6">
          {!isAdminPreview && <DemoUserBanner userEmail={clientData.email} />}
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Welcome, {clientData.full_name}!</h1>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-medium text-sm">{clientData.membership_plan} Plan</span>
                  {clientData.membership_plan === 'active' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-500 border border-green-500/30">ACTIVE</span>
                  )}
                  {!isAdminPreview && hasSignedAgreement && <span className="text-green-500 text-sm">✓ Agreement Signed</span>}
                </div>
              </div>
            </div>
            {!isAdminPreview && <Button variant="outline" onClick={handleSignOut} size="sm"><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>}
          </div>

          {/* Tab Navigation - responsive */}
          <div className="mb-6">
            {/* Desktop: horizontal scrollable */}
            <div className="hidden md:flex items-center gap-1 overflow-x-auto pb-2 border-b border-border">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            {/* Mobile: Select dropdown */}
            <div className="md:hidden">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tabs.map(tab => (
                    <SelectItem key={tab.id} value={tab.id}>{tab.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Profile', icon: User, content: <><p className="text-sm"><strong>Name:</strong> {clientData.full_name}</p><p className="text-sm"><strong>Plan:</strong> {clientData.membership_plan}</p></> },
                  { label: 'Credit Reports', icon: FileText, content: <><div className="stat-number">{creditReports.length}</div><p className="text-xs text-muted-foreground">Reports uploaded</p></> },
                  { label: 'Disputes', icon: Brain, content: <><div className="stat-number">{disputeLetters.length}</div><p className="text-xs text-muted-foreground">Total dispute letters</p></> },
                  { label: 'Flagged Items', icon: Shield, content: <><div className="stat-number">{creditReports.reduce((sum, r) => sum + (r.flagged_accounts_count || 0), 0)}</div><p className="text-xs text-muted-foreground">AI-flagged accounts</p></> },
                ].map(card => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.label} className="glass-card-hover">
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{card.label}</CardTitle></CardHeader>
                      <CardContent>{card.content}</CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Credit Scores - Live Sync */}
              {creditScores && (creditScores.experian_score || creditScores.equifax_score || creditScores.transunion_score) && (
                <Card className="glass-card">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />Credit Scores</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground">Experian</p>
                        <p className="text-2xl font-bold text-foreground">{creditScores.experian_score ?? '—'}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground">Equifax</p>
                        <p className="text-2xl font-bold text-foreground">{creditScores.equifax_score ?? '—'}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground">TransUnion</p>
                        <p className="text-2xl font-bold text-foreground">{creditScores.transunion_score ?? '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Score Predictions */}
              <ScorePredictionCard clientId={clientData.id} userId={isAdminPreview ? undefined : user?.id} />
            </div>
          )}

          {/* Documents */}
          {activeTab === 'documents' && <div className="animate-fade-in"><ClientDocumentManager clientId={clientData.id} /></div>}

          {/* Credit Reports */}
          {activeTab === 'credit-reports' && (
            <Card className="glass-card animate-fade-in">
              <CardHeader><CardTitle>Credit Reports</CardTitle><CardDescription>Your uploaded credit reports and analysis results</CardDescription></CardHeader>
              <CardContent>
                {creditReports.length === 0 ? (
                  <div className="text-center py-8"><Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" /><p className="text-muted-foreground">No credit reports uploaded yet.</p></div>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader><TableRow><TableHead>File</TableHead><TableHead>Status</TableHead><TableHead>Flagged</TableHead><TableHead>Summary</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {creditReports.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">{r.file_name}</TableCell>
                              <TableCell>{getStatusBadge(r.analysis_status || 'pending')}</TableCell>
                              <TableCell>{r.flagged_accounts_count || 0}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{r.ai_analysis_summary || '-'}</TableCell>
                              <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile */}
                    <div className="md:hidden space-y-3">
                      {creditReports.map(r => (
                        <Card key={r.id} className="glass-card-hover">
                          <CardContent className="pt-4">
                            <p className="font-medium text-sm">{r.file_name}</p>
                            <div className="flex gap-2 mt-2">
                              {getStatusBadge(r.analysis_status || 'pending')}
                              <Badge variant="outline">{r.flagged_accounts_count || 0} flagged</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          {activeTab === 'ai-analysis' && <div className="animate-fade-in"><AIAnalysisViewer isAdmin={isAdminPreview} /></div>}

          {/* Dispute Letters - using Accordion */}
          {activeTab === 'dispute-letters' && (
            <Card className="glass-card animate-fade-in">
              <CardHeader><CardTitle>Dispute Letters</CardTitle><CardDescription>Generated dispute letters and their status</CardDescription></CardHeader>
              <CardContent>
                {disputeLetters.length === 0 ? (
                  <div className="text-center py-8"><FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" /><p className="text-muted-foreground">No dispute letters generated yet.</p></div>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {disputeLetters.map((letter) => (
                      <AccordionItem key={letter.id} value={letter.id} className="border border-border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <div>
                              <p className="font-medium text-sm">{letter.creditor_name}</p>
                              <p className="text-xs text-muted-foreground">{letter.account_number ? `****${letter.account_number.slice(-4)}` : 'N/A'}</p>
                            </div>
                            <Badge variant="outline" className="ml-auto mr-2">{letter.letter_type || letter.issue_type || 'Standard'}</Badge>
                            <Badge variant="secondary">{letter.case_status || 'intake_received'}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-muted/50 rounded-lg p-4 mt-2 border border-border">
                            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground">{letter.generated_letter}</pre>
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(letter.generated_letter); toast({ title: 'Copied!' }); }}>
                                <Copy className="h-4 w-4 mr-2" />Copy
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="animate-fade-in">
              <ClientActivityTimeline userId={isAdminPreview ? undefined : user?.id} clientId={clientData.id} />
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <ClientNotificationsPanel overrideUserId={isAdminPreview ? clientUserId : undefined} />
            </div>
          )}

          {/* Agreement */}
          {activeTab === 'agreement' && (
            <Card className="glass-card animate-fade-in">
              <CardHeader><CardTitle>Client Agreement</CardTitle><CardDescription>View and sign your service agreement</CardDescription></CardHeader>
              <CardContent>
                {hasSignedAgreement ? (
                  <p className="text-green-500 font-medium">✓ Agreement signed</p>
                ) : (
                  <><p className="text-muted-foreground">Please review and sign your service agreement.</p><Button className="mt-4" onClick={() => setShowAgreementModal(true)}>Review Agreement</Button></>
                )}
              </CardContent>
            </Card>
          )}

          {/* Membership */}
          {activeTab === 'membership' && (
            <Card className="glass-card animate-fade-in">
              <CardHeader><CardTitle>Membership Plan</CardTitle><CardDescription>Your current membership details</CardDescription></CardHeader>
              <CardContent>
                <h3 className="font-medium">Current Plan: {clientData.membership_plan}</h3>
                <p className="text-sm text-muted-foreground mt-1">Contact admin to change your membership tier.</p>
                <div className="pt-4 border-t border-border mt-4"><ReceiptGenerator receipts={receipts} /></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
