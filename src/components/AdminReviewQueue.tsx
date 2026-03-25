import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  getAdminReviewQueue,
  adminApproveDispute,
  adminRejectDispute,
  type DisputeLetterRow,
} from '@/services/disputeWorkflow';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function AdminReviewQueue() {
  const [queue, setQueue] = useState<DisputeLetterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchQueue = () => {
    setLoading(true);
    getAdminReviewQueue()
      .then(setQueue)
      .catch((err) => {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load review queue', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleApprove = async (disputeId: string) => {
    if (!user) return;
    setProcessing(disputeId);
    try {
      await adminApproveDispute(disputeId, user.id, notes[disputeId]);
      toast({ title: 'Approved', description: 'Dispute approved successfully' });
      fetchQueue();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (disputeId: string) => {
    if (!user) return;
    setProcessing(disputeId);
    try {
      await adminRejectDispute(disputeId, user.id, notes[disputeId]);
      toast({ title: 'Returned', description: 'Dispute returned for rework' });
      fetchQueue();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Admin Review Queue
        </CardTitle>
        <CardDescription>
          {queue.length} dispute{queue.length !== 1 ? 's' : ''} awaiting review
        </CardDescription>
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No disputes pending review</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Creditor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-medium">{dispute.user_email}</TableCell>
                  <TableCell>{dispute.creditor_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dispute.letter_type || dispute.issue_type || 'Standard'}</Badge>
                  </TableCell>
                  <TableCell>{new Date(dispute.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Textarea
                      placeholder="Review notes..."
                      value={notes[dispute.id] || ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [dispute.id]: e.target.value }))}
                      rows={2}
                      className="min-w-[200px]"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(dispute.id)}
                        disabled={processing === dispute.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(dispute.id)}
                        disabled={processing === dispute.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Return
                      </Button>
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
