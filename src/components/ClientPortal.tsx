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

  useEffect(() => {
    if (user) {
      fetchClientData();
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

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold">Welcome, {clientData.full_name}</h1>
              <p className="text-muted-foreground">
                {clientData.membership_plan} Plan Member
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
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
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Current Plan: {clientData.membership_plan}</h3>
                    <p className="text-sm text-muted-foreground">
                      {clientData.membership_plan === 'Basic' 
                        ? '$99.99/month' 
                        : clientData.membership_plan === 'Pro' 
                        ? '$179.99/month' 
                        : '$249.99/month'}
                    </p>
                  </div>
                  
                  {clientData.membership_plan !== 'Elite' && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Available Upgrades:</h4>
                      {clientData.membership_plan === 'Basic' && (
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Upgrade to Pro - $179.99/month
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Upgrade to Elite - $249.99/month
                          </Button>
                        </div>
                      )}
                      {clientData.membership_plan === 'Pro' && (
                        <Button variant="outline" className="w-full justify-start">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Upgrade to Elite - $249.99/month
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}