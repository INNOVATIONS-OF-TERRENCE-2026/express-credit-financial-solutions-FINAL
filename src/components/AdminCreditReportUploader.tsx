import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, Search, CreditCard, Save, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface ClientOption {
  id: string;
  full_name: string;
  email: string | null;
}

export function AdminCreditReportUploader() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [manualScores, setManualScores] = useState({ experian: '', equifax: '', transunion: '' });
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, full_name, email').order('full_name');
      setClients(data || []);
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleUpload = async () => {
    if (!selectedClientId || !file || !user) {
      toast({ title: 'Missing info', description: 'Select a client and choose a file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      // 1. Upload to storage
      const timestamp = Date.now();
      const storagePath = `${selectedClientId}/${timestamp}-${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('credit-reports')
        .upload(storagePath, file);

      if (storageError) throw new Error(`Storage upload failed: ${storageError.message}`);

      // 2. Create DB record
      const { data: dbRecord, error: dbError } = await supabase
        .from('credit_report_uploads')
        .insert({
          user_id: user.id,
          client_id: selectedClientId,
          file_name: file.name,
          file_path: storagePath,
          file_size: file.size,
          file_type: file.type || 'application/pdf',
          analysis_status: 'pending',
        })
        .select()
        .single();

      if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);

      // 3. Trigger AI analysis (non-blocking)
      try {
        const { data: analysisResult } = await supabase.functions.invoke('analyze-credit-report', {
          body: { reportId: dbRecord.id, clientId: selectedClientId },
        });

        if (analysisResult?.scores) {
          setUploadResult({
            success: true,
            scores: analysisResult.scores,
            message: 'Report uploaded and analyzed successfully',
          });

          // Update client credit scores
          const scoreUpdate: any = {
            client_id: selectedClientId,
            source: 'ai_extraction',
            updated_at: new Date().toISOString(),
          };
          if (analysisResult.scores.experian) scoreUpdate.experian_score = analysisResult.scores.experian;
          if (analysisResult.scores.equifax) scoreUpdate.equifax_score = analysisResult.scores.equifax;
          if (analysisResult.scores.transunion) scoreUpdate.transunion_score = analysisResult.scores.transunion;

          await supabase.from('client_credit_scores' as any).upsert(scoreUpdate, { onConflict: 'client_id' });
        } else {
          setUploadResult({
            success: true,
            message: 'Report uploaded. AI analysis did not return scores — use manual override below.',
          });
        }
      } catch {
        setUploadResult({
          success: true,
          message: 'Report uploaded successfully. AI analysis unavailable — use manual override below.',
        });
      }

      // 4. Create timeline entry
      await supabase.from('client_timeline' as any).insert({
        client_id: selectedClientId,
        event_type: 'credit_report_uploaded',
        event_label: `Credit report "${file.name}" uploaded`,
        event_meta: { file_name: file.name, report_id: dbRecord.id },
      });

      // 5. Update action tracker
      await supabase.from('client_action_tracker' as any)
        .update({ credit_report_uploaded: true, updated_at: new Date().toISOString() } as any)
        .eq('client_id', selectedClientId);

      toast({ title: 'Success', description: 'Credit report uploaded' });
      setFile(null);
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      setUploadResult({ success: false, message: error.message });
    } finally {
      setUploading(false);
    }
  };

  const saveManualScores = async () => {
    if (!selectedClientId) {
      toast({ title: 'Select a client first', variant: 'destructive' });
      return;
    }

    setSavingManual(true);
    const updates: any = { client_id: selectedClientId, source: 'manual_override', updated_at: new Date().toISOString() };
    if (manualScores.experian) updates.experian_score = parseInt(manualScores.experian);
    if (manualScores.equifax) updates.equifax_score = parseInt(manualScores.equifax);
    if (manualScores.transunion) updates.transunion_score = parseInt(manualScores.transunion);

    const { error } = await supabase.from('client_credit_scores' as any).upsert(updates, { onConflict: 'client_id' });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      // Also insert into score history
      const bureaus = ['experian', 'equifax', 'transunion'];
      for (const bureau of bureaus) {
        const score = parseInt((manualScores as any)[bureau]);
        if (score) {
          await supabase.from('credit_scores').insert({
            client_id: selectedClientId,
            bureau: bureau.charAt(0).toUpperCase() + bureau.slice(1),
            score,
            score_date: new Date().toISOString().split('T')[0],
          });
        }
      }

      await supabase.from('client_timeline' as any).insert({
        client_id: selectedClientId,
        event_type: 'score_update',
        event_label: 'Scores manually updated by admin',
        event_meta: manualScores,
      });

      toast({ title: 'Scores Saved' });
      setManualScores({ experian: '', equifax: '', transunion: '' });
    }
    setSavingManual(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Client Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />Upload Credit Report</CardTitle>
          <CardDescription>Select the exact client first, then upload their credit report PDF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">1. Select Client</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-lg">
                {filteredClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClientId(c.id); setSearchTerm(''); }}
                    className={`w-full text-left px-4 py-2 hover:bg-accent/10 text-sm ${
                      selectedClientId === c.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                    }`}
                  >
                    <span className="font-medium">{c.full_name}</span>
                    {c.email && <span className="text-muted-foreground ml-2 text-xs">{c.email}</span>}
                  </button>
                ))}
              </div>
            )}
            {selectedClient && (
              <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-medium text-sm text-primary">Selected: {selectedClient.full_name}</p>
                {selectedClient.email && <p className="text-xs text-muted-foreground">{selectedClient.email}</p>}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">2. Choose File</Label>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            {file && <p className="text-xs text-muted-foreground mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedClientId || !file || uploading}
            className="w-full"
          >
            {uploading ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Uploading & Analyzing...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Upload & Analyze Report</>
            )}
          </Button>

          {uploadResult && (
            <div className={`p-4 rounded-lg border ${uploadResult.success ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center gap-2 mb-1">
                {uploadResult.success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                <p className="text-sm font-medium">{uploadResult.success ? 'Success' : 'Error'}</p>
              </div>
              <p className="text-sm text-muted-foreground">{uploadResult.message}</p>
              {uploadResult.scores && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {['experian', 'equifax', 'transunion'].map(b => (
                    <div key={b} className="text-center p-2 rounded bg-card border border-border">
                      <p className="text-xs text-muted-foreground capitalize">{b}</p>
                      <p className="text-xl font-bold">{uploadResult.scores[b] || '—'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Override */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><CreditCard className="h-4 w-4" />Manual Score Override</CardTitle>
          <CardDescription>If AI parsing fails, manually enter scores for the selected client</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedClientId ? (
            <p className="text-sm text-muted-foreground">Select a client above first</p>
          ) : (
            <>
              <p className="text-sm text-primary mb-3 font-medium">Client: {selectedClient?.full_name}</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Experian</Label><Input type="number" min="300" max="850" placeholder="e.g. 680" value={manualScores.experian} onChange={(e) => setManualScores(p => ({ ...p, experian: e.target.value }))} /></div>
                <div><Label className="text-xs">Equifax</Label><Input type="number" min="300" max="850" placeholder="e.g. 700" value={manualScores.equifax} onChange={(e) => setManualScores(p => ({ ...p, equifax: e.target.value }))} /></div>
                <div><Label className="text-xs">TransUnion</Label><Input type="number" min="300" max="850" placeholder="e.g. 690" value={manualScores.transunion} onChange={(e) => setManualScores(p => ({ ...p, transunion: e.target.value }))} /></div>
              </div>
              <Button onClick={saveManualScores} disabled={savingManual} className="mt-3" size="sm">
                <Save className="h-4 w-4 mr-1" />{savingManual ? 'Saving...' : 'Save Manual Scores'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
