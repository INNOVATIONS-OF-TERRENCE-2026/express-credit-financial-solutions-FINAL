import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { autoCreateDisputesFromFlags } from '@/services/disputeWorkflow';
import { Brain, AlertTriangle, FileText, Shield } from 'lucide-react';

interface FlaggedItem {
  id: string;
  creditor_name: string;
  account_number: string | null;
  account_type: string | null;
  balance: number | null;
  flag_reason: string;
  flag_confidence: number | null;
  status: string;
  violation_type: string | null;
  recommended_dispute_type: string | null;
  dispute_letter_generated: boolean;
  credit_report_id: string | null;
  user_id: string;
}

interface AIAnalysisViewerProps {
  reportId?: string;
  isAdmin?: boolean;
}

export function AIAnalysisViewer({ reportId, isAdmin = false }: AIAnalysisViewerProps) {
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchItems = async () => {
    let query = supabase.from('flagged_disputes').select('*').order('flag_confidence', { ascending: false });

    if (reportId) {
      query = query.eq('credit_report_id', reportId);
    } else if (!isAdmin && user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (!error) setItems((data || []) as FlaggedItem[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();

    const filter = !isAdmin && user ? `user_id=eq.${user.id}` : undefined;
    const channel = supabase
      .channel('ai-analysis-flagged')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'flagged_disputes',
        ...(filter ? { filter } : {}),
      }, () => { fetchItems(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, reportId, isAdmin]);

  const handleCreateDisputes = async () => {
    if (!user || !reportId) return;
    setCreating(true);
    try {
      const result = await autoCreateDisputesFromFlags(user.id, reportId);
      toast({
        title: 'Disputes Created',
        description: `Created ${result.created} dispute letter(s)${result.errors.length > 0 ? `, ${result.errors.length} errors` : ''}`,
      });
      fetchItems();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return <Badge variant="secondary">N/A</Badge>;
    const pct = Math.round(confidence * 100);
    if (pct >= 80) return <Badge className="bg-green-100 text-green-800">{pct}%</Badge>;
    if (pct >= 50) return <Badge className="bg-yellow-100 text-yellow-800">{pct}%</Badge>;
    return <Badge className="bg-red-100 text-red-800">{pct}%</Badge>;
  };

  const getViolationBadge = (type: string | null) => {
    if (!type) return null;
    const colors: Record<string, string> = {
      '605b': 'bg-red-100 text-red-800',
      '611': 'bg-orange-100 text-orange-800',
      '623': 'bg-purple-100 text-purple-800',
      re_aging: 'bg-pink-100 text-pink-800',
      mixed_file: 'bg-indigo-100 text-indigo-800',
    };
    return (
      <Badge className={colors[type.toLowerCase()] || 'bg-muted text-muted-foreground'}>
        <Shield className="h-3 w-3 mr-1" />
        FCRA {type}
      </Badge>
    );
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis Results
            </CardTitle>
            <CardDescription>
              {items.length} flagged item{items.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          {reportId && items.some((i) => !i.dispute_letter_generated) && (
            <Button onClick={handleCreateDisputes} disabled={creating}>
              <FileText className="h-4 w-4 mr-1" />
              {creating ? 'Creating...' : 'Create Disputes'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No flagged items found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creditor</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Violation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.creditor_name}</TableCell>
                  <TableCell>{item.account_number ? `****${item.account_number.slice(-4)}` : 'N/A'}</TableCell>
                  <TableCell>{item.account_type || 'Unknown'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.flag_reason}</TableCell>
                  <TableCell>{getConfidenceBadge(item.flag_confidence)}</TableCell>
                  <TableCell>{getViolationBadge(item.violation_type)}</TableCell>
                  <TableCell>
                    {item.dispute_letter_generated ? (
                      <Badge className="bg-green-100 text-green-800">Dispute Created</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
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
