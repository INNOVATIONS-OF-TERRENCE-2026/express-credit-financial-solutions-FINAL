import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRoles } from '@/hooks/useRoles';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface FlaggedDispute {
  id: string;
  creditor_name: string;
  account_number: string;
  account_type: string;
  balance: number;
  status: string;
  flag_reason: string;
  flag_confidence: number;
  additional_details: any;
  admin_reviewed: boolean;
  admin_approved: boolean | null;
  admin_notes: string | null;
  dispute_letter_generated: boolean;
  created_at: string;
  user_id: string;
}

export function FlaggedDisputesTable() {
  const [flaggedDisputes, setFlaggedDisputes] = useState<FlaggedDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<FlaggedDispute | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useRoles();

  useEffect(() => {
    fetchFlaggedDisputes();
  }, []);

  const fetchFlaggedDisputes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('flagged_disputes')
        .select('*')
        .order('created_at', { ascending: false });

      // If not admin, only show user's own disputes
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFlaggedDisputes(data || []);
    } catch (error) {
      console.error('Error fetching flagged disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load flagged disputes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (disputeId: string, approved: boolean) => {
    if (!isAdmin) return;

    setProcessing(disputeId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('flagged_disputes')
        .update({
          admin_reviewed: true,
          admin_approved: approved,
          admin_notes: adminNotes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      if (error) throw error;

      // If approved, create a dispute letter entry
      if (approved) {
        const dispute = flaggedDisputes.find(d => d.id === disputeId);
        if (dispute) {
          const { error: disputeError } = await supabase
            .from('dispute_letters')
            .insert({
              user_id: dispute.user_id,
              creditor_name: dispute.creditor_name,
              account_number: dispute.account_number,
              issue_type: getIssueTypeFromFlag(dispute.flag_reason),
              additional_notes: dispute.flag_reason,
              generated_letter: null,
              dispute_reason: 'Admin approved dispute',
              letter_title: `Dispute for ${dispute.creditor_name}`
            });

          if (disputeError) {
            console.error('Error creating dispute letter:', disputeError);
          }
        }
      }

      setAdminNotes('');
      setSelectedDispute(null);
      await fetchFlaggedDisputes();

      toast({
        title: "Success",
        description: `Dispute ${approved ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Error updating dispute:', error);
      toast({
        title: "Error",
        description: "Failed to update dispute",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getIssueTypeFromFlag = (flagReason: string): string => {
    if (flagReason.toLowerCase().includes('collection')) return 'Not Mine';
    if (flagReason.toLowerCase().includes('charge-off') || flagReason.toLowerCase().includes('charged off')) return 'Not Mine';
    if (flagReason.toLowerCase().includes('late payment')) return 'Incorrect Amount';
    if (flagReason.toLowerCase().includes('duplicate')) return 'Duplicate';
    if (flagReason.toLowerCase().includes('expired') || flagReason.toLowerCase().includes('statute')) return 'Outdated';
    return 'Other';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-100 text-green-800">High ({(confidence * 100).toFixed(0)}%)</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium ({(confidence * 100).toFixed(0)}%)</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Low ({(confidence * 100).toFixed(0)}%)</Badge>;
    }
  };

  const getStatusBadge = (dispute: FlaggedDispute) => {
    if (!dispute.admin_reviewed) {
      return <Badge className="bg-gray-100 text-gray-800">Pending Review</Badge>;
    } else if (dispute.admin_approved) {
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI-Flagged Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading flagged disputes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          AI-Flagged Disputes
        </CardTitle>
        <CardDescription>
          Accounts automatically identified by AI that may need to be disputed
        </CardDescription>
      </CardHeader>
      <CardContent>
        {flaggedDisputes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No flagged disputes found. Upload a credit report to start AI analysis.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creditor</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Flag Reason</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flaggedDisputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-medium">
                    {dispute.creditor_name}
                  </TableCell>
                  <TableCell>
                    {dispute.account_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {dispute.account_type || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {dispute.balance ? `$${dispute.balance.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={dispute.flag_reason}>
                      {dispute.flag_reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getConfidenceBadge(dispute.flag_confidence)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(dispute)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDispute(dispute)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Dispute Details</DialogTitle>
                            <DialogDescription>
                              Review the AI analysis and take action if you're an admin
                            </DialogDescription>
                          </DialogHeader>
                          {selectedDispute && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Creditor:</strong> {selectedDispute.creditor_name}
                                </div>
                                <div>
                                  <strong>Account:</strong> {selectedDispute.account_number || 'N/A'}
                                </div>
                                <div>
                                  <strong>Type:</strong> {selectedDispute.account_type || 'Unknown'}
                                </div>
                                <div>
                                  <strong>Balance:</strong> {selectedDispute.balance ? `$${selectedDispute.balance.toFixed(2)}` : 'N/A'}
                                </div>
                                <div>
                                  <strong>Status:</strong> {selectedDispute.status}
                                </div>
                                <div>
                                  <strong>Confidence:</strong> {(selectedDispute.flag_confidence * 100).toFixed(0)}%
                                </div>
                              </div>
                              
                              <div>
                                <strong>Flag Reason:</strong>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {selectedDispute.flag_reason}
                                </p>
                              </div>

                              {selectedDispute.additional_details && Object.keys(selectedDispute.additional_details).length > 0 && (
                                <div>
                                  <strong>Additional Details:</strong>
                                  <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                                    {JSON.stringify(selectedDispute.additional_details, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {selectedDispute.admin_notes && (
                                <div>
                                  <strong>Admin Notes:</strong>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {selectedDispute.admin_notes}
                                  </p>
                                </div>
                              )}

                              {isAdmin && !selectedDispute.admin_reviewed && (
                                <div className="border-t pt-4 space-y-4">
                                  <div>
                                    <label htmlFor="admin-notes" className="text-sm font-medium">
                                      Admin Notes (Optional)
                                    </label>
                                    <Textarea
                                      id="admin-notes"
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add notes about your decision..."
                                      className="mt-1"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleAdminAction(selectedDispute.id, true)}
                                      disabled={processing === selectedDispute.id}
                                      className="flex items-center gap-1"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Approve & Create Dispute
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleAdminAction(selectedDispute.id, false)}
                                      disabled={processing === selectedDispute.id}
                                      className="flex items-center gap-1"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}