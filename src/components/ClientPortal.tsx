import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Upload, FileText, CreditCard, Shield, User, Brain, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';
import { ClientDocumentManager } from '@/components/ClientDocumentManager';
import { ClientAgreementModal } from '@/components/ClientAgreementModal';
import { useClientAgreement } from '@/hooks/useClientAgreement';
import { DemoUserBanner } from '@/components/DemoUserBanner';
import { ReceiptGenerator } from '@/components/ReceiptGenerator';
import { AIAnalysisViewer } from '@/components/AIAnalysisViewer';

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
}

interface CreditReportUpload {
  id: string;
  file_name: string;
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

export function ClientPortal({ clientName }: ClientPortalProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [creditReports, setCreditReports] = useState<CreditReportUpload[]>([]);
  const [disputeLetters, setDisputeLetters] = useState<DisputeLetter[]>([]);
  const { hasSignedAgreement, loading: agreementLoading, refetchAgreementStatus } = useClientAgreement();
  
  useEffect(() => {
    if (!agreementLoading && hasSignedAgreement === false) {
      setShowAgreementModal(true);
    }
  }, [hasSignedAgreement, agreementLoading]);

  useEffect(() => {
    if (user) {
      fetchClientData();
      fetchReceipts();
      fetchCreditReports();
      fetchDisputeLetters();
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const reportChannel = supabase
      .channel('client-credit-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_report_uploads', filter: `user_id=eq.${user.id}` }, () => { fetchCreditReports(); })
      .subscribe();

    const disputeChannel = supabase
      .channel('client-disputes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispute_letters', filter: `user_id=eq.${user.id}` }, () => { fetchDisputeLetters(); })
      .subscribe();

    return () => {
      supabase.removeChannel(reportChannel);
      supabase.removeChannel(disputeChannel);
    };
  }, [user]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').eq('user_id', user?.id).single();
      if (!error) setClientData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    const { data } = await supabase.from('payment_receipts').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setReceipts(data || []);
  };

  const fetchCreditReports = async () => {
    const { data } = await supabase.from('credit_report_uploads').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setCreditReports((data || []) as CreditReportUpload[]);
  };

  const fetchDisputeLetters = async () => {
    const { data } = await supabase.from('dispute_letters').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setDisputeLetters((data || []) as DisputeLetter[]);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out', description: 'You have been successfully signed out.' });
  };

  if (loading || agreementLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center">Loading...</div></div>;
  }

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Client data not found</h2>
          <p className="text-muted-foreground">Please contact support.</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      analyzing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
    };
    return <Badge className={variants[status] || 'bg-muted text-muted-foreground'}>{status}</Badge>;
  };

  return (
    <>
      <ClientAgreementModal
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        onAgreementSigned={() => { refetchAgreementStatus(); setShowAgreementModal(false); }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
        <div className="container mx-auto p-6">
          <DemoUserBanner userEmail={clientData.email} />
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Welcome, {clientData.full_name}!</h1>
                <p className="text-primary font-medium">
                  {clientData.membership_plan} Plan Member
                  {hasSignedAgreement && <span className="ml-2 text-green-500">✓ Agreement Signed</span>}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="credit-reports">Credit Reports</TabsTrigger>
              <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="dispute-letters">Disputes</TabsTrigger>
              <TabsTrigger value="agreement">Agreement</TabsTrigger>
              <TabsTrigger value="membership">Membership</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4" /> Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm"><strong>Name:</strong> {clientData.full_name}</p>
                    <p className="text-sm"><strong>Plan:</strong> {clientData.membership_plan}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Credit Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{creditReports.length}</div>
                    <p className="text-xs text-muted-foreground">Reports uploaded</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2"><Brain className="w-4 h-4" /> Disputes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{disputeLetters.length}</div>
                    <p className="text-xs text-muted-foreground">Total dispute letters</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2"><Shield className="w-4 h-4" /> Flagged Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {creditReports.reduce((sum, r) => sum + (r.flagged_accounts_count || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">AI-flagged accounts</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <ClientDocumentManager clientId={clientData.id} />
            </TabsContent>

            <TabsContent value="credit-reports">
              <Card>
                <CardHeader>
                  <CardTitle>Credit Reports</CardTitle>
                  <CardDescription>Your uploaded credit reports and analysis results</CardDescription>
                </CardHeader>
                <CardContent>
                  {creditReports.length === 0 ? (
                    <div className="text-center py-8">
                      <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No credit reports uploaded yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Flagged</TableHead>
                          <TableHead>Summary</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">{report.file_name}</TableCell>
                            <TableCell>{getStatusBadge(report.analysis_status || 'pending')}</TableCell>
                            <TableCell>{report.flagged_accounts_count || 0}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{report.ai_analysis_summary || '-'}</TableCell>
                            <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-analysis">
              <AIAnalysisViewer />
            </TabsContent>

            <TabsContent value="dispute-letters">
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Letters</CardTitle>
                  <CardDescription>Generated dispute letters and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {disputeLetters.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No dispute letters generated yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Creditor</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disputeLetters.map((letter) => (
                          <TableRow key={letter.id}>
                            <TableCell className="font-medium">{letter.creditor_name}</TableCell>
                            <TableCell>{letter.account_number ? `****${letter.account_number.slice(-4)}` : 'N/A'}</TableCell>
                            <TableCell><Badge variant="outline">{letter.letter_type || letter.issue_type || 'Standard'}</Badge></TableCell>
                            <TableCell><Badge variant="secondary">{letter.case_status || 'intake_received'}</Badge></TableCell>
                            <TableCell>{new Date(letter.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agreement">
              <Card>
                <CardHeader>
                  <CardTitle>Client Agreement</CardTitle>
                  <CardDescription>View and sign your service agreement</CardDescription>
                </CardHeader>
                <CardContent>
                  {hasSignedAgreement ? (
                    <p className="text-green-500 font-medium">✓ Agreement signed</p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">Please review and sign your service agreement.</p>
                      <Button className="mt-4" onClick={() => setShowAgreementModal(true)}>Review Agreement</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="membership">
              <Card>
                <CardHeader>
                  <CardTitle>Membership Plan</CardTitle>
                  <CardDescription>Your current membership details</CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium">Current Plan: {clientData.membership_plan}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact admin to change your membership tier.
                  </p>
                  <div className="pt-4 border-t mt-4">
                    <ReceiptGenerator receipts={receipts} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
