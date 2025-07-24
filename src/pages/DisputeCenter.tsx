import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

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

  const downloadPDF = (dispute: DisputeLetter) => {
    if (!dispute.generated_letter) {
      toast({
        title: "Error",
        description: "No generated letter to download",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 6;
    
    // Split the letter into lines that fit the page width
    const splitText = doc.splitTextToSize(dispute.generated_letter, pageWidth - 2 * margin);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(splitText, margin, margin);
    
    const fileName = `Dispute_Letter_${dispute.creditor_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "Success",
      description: "PDF downloaded successfully",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading disputes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto p-6">
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dispute Center</h1>
        <p className="text-muted-foreground mt-2">
          Manage your credit disputes and generate FCRA-compliant letters
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dispute Letters Table
          </CardTitle>
          <CardDescription>
            Your credit dispute letters and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No disputes found. Create your first dispute to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creditor Name</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Additional Notes</TableHead>
                  <TableHead>Letter Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">{dispute.creditor_name}</TableCell>
                    <TableCell>****{dispute.account_number.slice(-4)}</TableCell>
                    <TableCell>{getIssueTypeBadge(dispute.issue_type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {dispute.additional_notes || 'None'}
                    </TableCell>
                    <TableCell>
                      {dispute.generated_letter ? (
                        <Badge className="bg-green-100 text-green-800">Generated</Badge>
                      ) : (
                        <Badge variant="outline">Not Generated</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => generateLetter(dispute.id)}
                          disabled={generatingId === dispute.id}
                          size="sm"
                          variant="outline"
                        >
                          {generatingId === dispute.id ? 'Generating...' : 'Generate Letter'}
                        </Button>
                        {dispute.generated_letter && (
                          <Button
                            onClick={() => downloadPDF(dispute)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download PDF
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}