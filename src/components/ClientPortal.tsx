import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Upload, FileText, CreditCard, Shield, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';
import { ClientDocumentManager } from '@/components/ClientDocumentManager';
import { ClientAgreementModal } from '@/components/ClientAgreementModal';
import { useClientAgreement } from '@/hooks/useClientAgreement';
import { DemoUserBanner } from '@/components/DemoUserBanner';
import { ReceiptGenerator } from '@/components/ReceiptGenerator';

interface ClientData {
  id: string;
  full_name: string;
  email_address: string;
  membership_plan: string;
  date_of_birth?: string;
  ssn_last4?: string;
  address?: string;
}

interface ClientPortalProps {
  clientName: string;
}

export function ClientPortal({ clientName }: ClientPortalProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const { hasSignedAgreement, loading: agreementLoading, refetchAgreementStatus } = useClientAgreement();
  
  // Show agreement modal if user hasn't signed yet
  useEffect(() => {
    if (!agreementLoading && hasSignedAgreement === false) {
      setShowAgreementModal(true);
    }
  }, [hasSignedAgreement, agreementLoading]);

  useEffect(() => {
    if (user) {
      fetchClientData();
      fetchReceipts();
    }
  }, [user]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching client data:', error);
        return;
      }

      setClientData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching receipts:', error);
        return;
      }

      setReceipts(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  if (loading || agreementLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
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

  return (
    <>
      {/* Agreement Modal */}
      <ClientAgreementModal
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        onAgreementSigned={() => {
          refetchAgreementStatus();
          setShowAgreementModal(false);
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
        <div className="container mx-auto p-6">
          {/* Demo User Banner */}
          <DemoUserBanner userEmail={clientData.email_address} />
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome, {clientData.full_name}!
                </h1>
                <p className="text-yellow-400 font-medium">
                  {clientData.membership_plan} Plan Member
                  {hasSignedAgreement && <span className="ml-2 text-green-400">✓ Agreement Signed</span>}
                </p>
                <p className="text-slate-400 text-sm">
                  Here's your credit restoration dashboard
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="documents">Upload Documents</TabsTrigger>
            <TabsTrigger value="credit-reports">Credit Reports</TabsTrigger>
            <TabsTrigger value="dispute-letters">Dispute Letters</TabsTrigger>
            <TabsTrigger value="agreement">Signed Agreement</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Name:</strong> {clientData.full_name}</p>
                  <p><strong>Email:</strong> {clientData.email_address}</p>
                  <p><strong>Plan:</strong> {clientData.membership_plan}</p>
                  {clientData.date_of_birth && (
                    <p><strong>DOB:</strong> {new Date(clientData.date_of_birth).toLocaleDateString()}</p>
                  )}
                  {clientData.ssn_last4 && (
                    <p><strong>SSN:</strong> ***-**-{clientData.ssn_last4}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Document Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track your uploaded documents and their verification status.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Credit Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    View your credit report analysis and dispute progress.
                  </p>
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
                <CardDescription>
                  Your credit reports from all three bureaus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Experian', 'Equifax', 'TransUnion'].map((bureau) => (
                    <Card key={bureau}>
                      <CardHeader>
                        <CardTitle className="text-lg">{bureau}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">
                          No report uploaded yet
                        </p>
                        <Button variant="outline" size="sm">
                          Upload Report
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispute-letters">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Letters</CardTitle>
                <CardDescription>
                  Generated dispute letters for credit repair
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No dispute letters generated yet. Upload your credit reports to get started.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agreement">
            <Card>
              <CardHeader>
                <CardTitle>Client Agreement</CardTitle>
                <CardDescription>
                  View and sign your service agreement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No agreement signed yet. Please review and sign your service agreement.
                </p>
                <Button className="mt-4">
                  Review Agreement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membership">
            <Card>
              <CardHeader>
                <CardTitle>Membership Plan</CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-white">Current Plan: {clientData.membership_plan}</h3>
                    <p className="text-sm text-slate-400">
                      {clientData.membership_plan === 'Basic' 
                        ? '$99.99/month - Entry-level credit restoration'
                        : clientData.membership_plan === 'Pro' 
                        ? '$179.99/month - Full service with coaching' 
                        : clientData.membership_plan === 'Elite'
                        ? '$249.99/month - Premium unlimited service'
                        : '$599.99 one-time - Complete audit package'}
                    </p>
                    
                    {/* Package Details */}
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <h4 className="font-medium text-slate-200 mb-2">Your Plan Includes:</h4>
                      <ul className="text-sm text-slate-300 space-y-1">
                        {clientData.membership_plan === 'Basic' && (
                          <>
                            <li>• Disputes for up to 4 accounts/month (1 bureau)</li>
                            <li>• Monthly Credit Report Review & Analysis</li>
                            <li>• Credit Monitoring Setup Guidance</li>
                            <li>• Custom Onboarding Email with action checklist</li>
                            <li>• Access to Client Document Portal</li>
                            <li>• Limited Email Support</li>
                          </>
                        )}
                        {clientData.membership_plan === 'Pro' && (
                          <>
                            <li>• Disputes for up to 10 accounts/month across 3 bureaus</li>
                            <li>• Custom Dispute Letter Generation</li>
                            <li>• Monthly Credit Coaching Call with expert</li>
                            <li>• Priority Email & Chat Support</li>
                            <li>• Soft Inquiry Removal Assistance</li>
                            <li>• Monthly Progress Tracking Report</li>
                          </>
                        )}
                        {clientData.membership_plan === 'Elite' && (
                          <>
                            <li>• Unlimited Disputes with advanced bureau tactics</li>
                            <li>• Direct Assigned Credit Coach</li>
                            <li>• 24–48 Hour Dispute Prep Turnaround</li>
                            <li>• Rebuilding Strategy Session (tradelines, AU options)</li>
                            <li>• Cease & Desist & Debt Validation Letters</li>
                            <li>• Data Freeze Setup Support</li>
                          </>
                        )}
                        {clientData.membership_plan === 'All Exclusive' && (
                          <>
                            <li>• Full Credit Report Audit + Violation Flagging</li>
                            <li>• Unlimited Disputes across all accounts</li>
                            <li>• Custom Dispute Strategy Playbook</li>
                            <li>• Upload & Review of All Supporting Documents</li>
                            <li>• VIP Concierge Priority Service</li>
                            <li>• 60-Day Post Audit Follow-Up</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  {clientData.membership_plan !== 'Elite' && clientData.membership_plan !== 'All Exclusive' && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-200">Available Upgrades:</h4>
                      {clientData.membership_plan === 'Basic' && (
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start bg-slate-800 border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                            <CreditCard className="w-4 h-4 mr-2" />
                            🔵 Upgrade to Pro - $179.99/month
                          </Button>
                          <Button variant="outline" className="w-full justify-start bg-slate-800 border-red-500/30 text-red-400 hover:bg-red-500/10">
                            <CreditCard className="w-4 h-4 mr-2" />
                            🔴 Upgrade to Elite - $249.99/month
                          </Button>
                        </div>
                      )}
                      {clientData.membership_plan === 'Pro' && (
                        <Button variant="outline" className="w-full justify-start bg-slate-800 border-red-500/30 text-red-400 hover:bg-red-500/10">
                          <CreditCard className="w-4 h-4 mr-2" />
                          🔴 Upgrade to Elite - $249.99/month
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Payment Receipts */}
                  <div className="pt-4 border-t">
                    <ReceiptGenerator receipts={receipts} />
                  </div>
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