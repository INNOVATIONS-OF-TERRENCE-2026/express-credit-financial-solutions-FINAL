import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  getAdminReviewQueue,
  adminApproveDispute,
  adminRejectDispute,
  type DisputeLetterRow,
} from '@/services/disputeWorkflow';
import { CheckCircle, XCircle, Clock, Eye, Loader2, RefreshCw } from 'lucide-react';

export function AdminReviewQueue() {
  const [queue, setQueue] = useState<DisputeLetterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewLetter, setPreviewLetter] = useState<DisputeLetterRow | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
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

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === queue.length) setSelected(new Set());
    else setSelected(new Set(queue.map(d => d.id)));
  };

  const handleBulkApprove = async () => {
    if (!user) return;
    setBulkProcessing(true);
    let count = 0;
    for (const id of selected) {
      try {
        await adminApproveDispute(id, user.id, notes[id]);
        count++;
      } catch {}
    }
    toast({ title: 'Bulk Approved', description: `${count} dispute(s) approved` });
    setSelected(new Set());
    setBulkProcessing(false);
    fetchQueue();
  };

  const handleBulkReject = async () => {
    if (!user) return;
    setBulkProcessing(true);
    let count = 0;
    for (const id of selected) {
      try {
        await adminRejectDispute(id, user.id, notes[id]);
        count++;
      } catch {}
    }
    toast({ title: 'Bulk Returned', description: `${count} dispute(s) returned` });
    setSelected(new Set());
    setBulkProcessing(false);
    fetchQueue();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Admin Review Queue
              </CardTitle>
              <CardDescription>
                {queue.length} dispute{queue.length !== 1 ? 's' : ''} awaiting review
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchQueue}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="secondary">{selected.size} selected</Badge>
              <Button size="sm" onClick={handleBulkApprove} disabled={bulkProcessing}>
                <CheckCircle className="h-3 w-3 mr-1" />Approve All
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkReject} disabled={bulkProcessing}>
                <XCircle className="h-3 w-3 mr-1" />Return All
              </Button>
              {bulkProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
              <p>No disputes pending review</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox checked={selected.size === queue.length && queue.length > 0} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Creditor</TableHead>
                    <TableHead>Dispute Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell>
                        <Checkbox checked={selected.has(dispute.id)} onCheckedChange={() => toggleSelect(dispute.id)} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{dispute.client_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{dispute.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{dispute.creditor_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{dispute.letter_type || dispute.issue_type || 'Standard'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{(dispute.case_status || '').replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(dispute.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setPreviewLetter(dispute)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          placeholder="Review notes..."
                          value={notes[dispute.id] || ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [dispute.id]: e.target.value }))}
                          rows={2}
                          className="min-w-[180px] text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleApprove(dispute.id)} disabled={processing === dispute.id}>
                            {processing === dispute.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3 mr-0.5" />Approve</>}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(dispute.id)} disabled={processing === dispute.id}>
                            <XCircle className="h-3 w-3 mr-0.5" />Return
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Letter Preview Modal */}
      <Dialog open={!!previewLetter} onOpenChange={() => setPreviewLetter(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Letter Preview — {previewLetter?.creditor_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div><span className="text-muted-foreground">Client:</span> {previewLetter?.user_email}</div>
              <div><span className="text-muted-foreground">Account:</span> {previewLetter?.account_number || '—'}</div>
              <div><span className="text-muted-foreground">Type:</span> {previewLetter?.letter_type || previewLetter?.issue_type}</div>
            </div>
            <ScrollArea className="h-[400px] border rounded-md p-4 bg-muted/30">
              <pre className="whitespace-pre-wrap text-sm font-mono">{previewLetter?.generated_letter || 'No letter content generated yet.'}</pre>
            </ScrollArea>
            {previewLetter?.admin_review_notes && (
              <div className="p-3 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Previous Review Notes:</p>
                <p className="text-sm">{previewLetter.admin_review_notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
