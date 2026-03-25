import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Brain, FileText, AlertTriangle, Loader2 } from 'lucide-react';

const LETTER_TYPES = [
  { value: '605B_time_barred', label: '605B Time-Barred' },
  { value: '611_verification', label: '611 Verification' },
  { value: '623_furnisher_dispute', label: '623 Furnisher Dispute' },
  { value: 'validation_letter', label: 'Debt Validation' },
  { value: 'standard_dispute', label: 'Standard Dispute' },
  { value: 'goodwill_letter', label: 'Goodwill Letter' },
];

export function AdminAIControlPanel() {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const { toast } = useToast();

  const [reports, setReports] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState('');
  const [selectedDispute, setSelectedDispute] = useState('');
  const [selectedLetterType, setSelectedLetterType] = useState('standard_dispute');
  const [violationText, setViolationText] = useState('');
  const [clientName, setClientName] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [letterResult, setLetterResult] = useState('');
  const [processing, setProcessing] = useState(false);

  const isAuthorized = isAdmin() && user?.email === 'admin@expresscredit.com';

  useEffect(() => {
    if (!isAuthorized) return;
    fetchData();
  }, []);

  const fetchData = async () => {
    const [reportsRes, disputesRes] = await Promise.all([
      supabase.from('credit_report_uploads').select('*').order('created_at', { ascending: false }),
      supabase.from('dispute_letters').select('*').order('created_at', { ascending: false }),
    ]);
    setReports(reportsRes.data || []);
    setDisputes(disputesRes.data || []);
  };

  const handleAnalyzeReport = async () => {
    if (!selectedReport) return;
    setProcessing(true);
    setAnalysisResult('');
    try {
      const report = reports.find((r) => r.id === selectedReport);
      const { data, error } = await supabase.functions.invoke('analyze-credit-report', {
        body: {
          creditReportPath: report?.file_path,
          fileName: report?.file_name,
          reportId: selectedReport,
        },
      });
      if (error) throw error;
      setAnalysisResult(JSON.stringify(data, null, 2));
      toast({ title: 'Analysis Complete', description: `Found ${data?.flaggedAccountsCount || 0} flagged accounts` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyzeViolations = async () => {
    if (!violationText.trim() || !clientName.trim()) return;
    setProcessing(true);
    setAnalysisResult('');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-credit-violations', {
        body: { creditReportText: violationText, clientName },
      });
      if (error) throw error;
      setAnalysisResult(data?.analysis || 'No analysis returned');
      toast({ title: 'Violation Analysis Complete' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateLetter = async () => {
    if (!selectedDispute) return;
    setProcessing(true);
    setLetterResult('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-dispute-letter-secure', {
        body: { disputeId: selectedDispute, letterType: selectedLetterType },
      });
      if (error) throw error;
      setLetterResult(data?.generatedLetter || 'No letter generated');
      toast({ title: 'Letter Generated' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Operations Control Panel
        </CardTitle>
        <CardDescription>
          Trigger AI analysis and letter generation functions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analysis">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Credit Analysis</TabsTrigger>
            <TabsTrigger value="violations">Violation Detection</TabsTrigger>
            <TabsTrigger value="letters">Letter Generation</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Credit Report</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a report..." />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.file_name} — {r.analysis_status || 'pending'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAnalyzeReport} disabled={!selectedReport || processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Brain className="h-4 w-4 mr-1" />}
              Analyze Report
            </Button>
            {analysisResult && (
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[300px]">
                {analysisResult}
              </pre>
            )}
          </TabsContent>

          <TabsContent value="violations" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client full name"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Credit Report Text</Label>
              <Textarea
                value={violationText}
                onChange={(e) => setViolationText(e.target.value)}
                placeholder="Paste credit report text here..."
                rows={6}
                maxLength={10000}
              />
            </div>
            <Button onClick={handleAnalyzeViolations} disabled={!violationText.trim() || !clientName.trim() || processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-1" />}
              Analyze Violations
            </Button>
            {analysisResult && (
              <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-[300px]">
                {analysisResult}
              </pre>
            )}
          </TabsContent>

          <TabsContent value="letters" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Dispute</Label>
                <Select value={selectedDispute} onValueChange={setSelectedDispute}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a dispute..." />
                  </SelectTrigger>
                  <SelectContent>
                    {disputes.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.creditor_name || 'Unknown'} — {d.letter_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Letter Type</Label>
                <Select value={selectedLetterType} onValueChange={setSelectedLetterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LETTER_TYPES.map((lt) => (
                      <SelectItem key={lt.value} value={lt.value}>
                        {lt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerateLetter} disabled={!selectedDispute || processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
              Generate Letter
            </Button>
            {letterResult && (
              <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-[400px]">
                {letterResult}
              </pre>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
