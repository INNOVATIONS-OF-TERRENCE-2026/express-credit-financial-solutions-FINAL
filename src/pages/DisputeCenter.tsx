import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface DisputeLetter {
  id: string;
  creditor_name: string;
  account_number: string;
  issue_type: string;
  additional_notes: string | null;
  generated_letter: string | null;
  created_at: string;
}

export function DisputeCenter() {
  const [disputes, setDisputes] = useState<DisputeLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dispute_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLetter = async (disputeId: string) => {
    setGeneratingId(disputeId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-dispute-letter', {
        body: { disputeId }
      });

      if (error) throw error;

      // Refresh disputes to show the generated letter
      await fetchDisputes();
      
      toast({
        title: "Success",
        description: "Dispute letter generated successfully",
      });
    } catch (error) {
      console.error('Error generating letter:', error);
      toast({
        title: "Error",
        description: "Failed to generate dispute letter",
        variant: "destructive",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const getIssueTypeBadge = (issueType: string) => {
    const colors: Record<string, string> = {
      'Not Mine': 'bg-red-100 text-red-800',
      'Paid in Full': 'bg-green-100 text-green-800',
      'Incorrect Amount': 'bg-yellow-100 text-yellow-800',
      'Outdated': 'bg-blue-100 text-blue-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    
    return (
      <Badge className={colors[issueType] || colors['Other']}>
        {issueType}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading disputes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dispute Center</h1>
        <p className="text-muted-foreground mt-2">
          Manage your credit disputes and generate FCRA-compliant letters
        </p>
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No disputes found. Create your first dispute to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{dispute.creditor_name}</CardTitle>
                    <CardDescription>
                      Account: ****{dispute.account_number.slice(-4)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getIssueTypeBadge(dispute.issue_type)}
                    <Button
                      onClick={() => generateLetter(dispute.id)}
                      disabled={generatingId === dispute.id}
                      size="sm"
                    >
                      {generatingId === dispute.id ? 'Generating...' : 'Generate Letter'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dispute.additional_notes && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Additional Notes:</h4>
                    <p className="text-sm text-muted-foreground">{dispute.additional_notes}</p>
                  </div>
                )}
                
                {dispute.generated_letter && (
                  <div>
                    <h4 className="font-medium mb-2">Generated Dispute Letter:</h4>
                    <Textarea
                      value={dispute.generated_letter}
                      readOnly
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                )}
                
                {!dispute.generated_letter && (
                  <div className="text-center py-4 border-2 border-dashed border-muted rounded-lg">
                    <p className="text-muted-foreground">
                      Click "Generate Letter" to create your dispute letter
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}