import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scan, AlertTriangle, FileText, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CreditScanSummary {
  id: string;
  file_name: string;
  ai_summary: string;
  flagged_accounts: any; // Use any for JSON type from Supabase
  dispute_opportunities: number;
  created_at: string;
}

export function CreditScanSummary() {
  const [summaries, setSummaries] = useState<CreditScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('credit_scan_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      toast({
        title: "Error",
        description: "Failed to load credit scan summaries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDispute = async (account: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to create disputes');

      const { error } = await supabase
        .from('dispute_letters')
        .insert({
          user_id: user.id,
          creditor_name: account.creditorName,
          account_number: account.accountNumber,
          issue_type: account.issueType,
          additional_notes: `AI Flagged: ${account.reason}`,
          generated_letter: null,
          dispute_reason: 'Account dispute',
          letter_title: `Dispute for ${account.creditorName}`
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Dispute created from AI analysis",
      });
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast({
        title: "Error",
        description: "Failed to create dispute",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading credit scan summaries...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Credit Scan Summary
        </CardTitle>
        <CardDescription>
          AI-powered analysis of your uploaded credit reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <div className="text-center py-8">
            <Scan className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No credit scan summaries found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload a credit report to get AI-powered analysis and dispute recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {summaries.map((summary) => (
              <div key={summary.id} className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {summary.file_name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Analyzed on {format(new Date(summary.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={summary.dispute_opportunities > 0 ? 'destructive' : 'default'}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {summary.dispute_opportunities} Opportunities
                    </Badge>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI Analysis Summary:</strong> {summary.ai_summary}
                  </AlertDescription>
                </Alert>

                {summary.flagged_accounts && Array.isArray(summary.flagged_accounts) && summary.flagged_accounts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Flagged Accounts for Dispute
                    </h4>
                    <div className="grid gap-3">
                      {summary.flagged_accounts.map((account, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{account.creditorName}</p>
                              <p className="text-sm text-muted-foreground">Account: {account.accountNumber}</p>
                            </div>
                            <Badge variant="outline">{account.issueType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            <strong>Reason:</strong> {account.reason}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => createDispute(account)}
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Create Dispute
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}