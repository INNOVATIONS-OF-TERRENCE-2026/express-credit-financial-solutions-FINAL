import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, PenTool, Eraser } from 'lucide-react';
import jsPDF from 'jspdf';

interface ClientAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgreementSigned: () => void;
}

export function ClientAgreementModal({ isOpen, onClose, onAgreementSigned }: ClientAgreementModalProps) {
  const [fullName, setFullName] = useState('');
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<{ stage: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const startDraw = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    drawingRef.current = true;
  };
  const moveDraw = (clientX: number, clientY: number) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };
  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) setSignatureDataUrl(canvas.toDataURL('image/png'));
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl('');
  };

  const buildPdfBlob = (clientName: string, signaturePng: string): Blob => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 48;
    let y = margin;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('EXPRESS CREDIT & FINANCIAL SOLUTIONS', margin, y); y += 22;
    doc.setFontSize(13); doc.text('Client Service Agreement', margin, y); y += 26;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const body = [
      'This Service Agreement ("Agreement") is entered into between Express Credit & Financial Solutions ("Company") and the undersigned client ("Client").',
      '',
      '1. SERVICES PROVIDED — Credit report analysis, dispute letter preparation and submission, credit monitoring and tracking, financial education and guidance.',
      '',
      '2. CLIENT RESPONSIBILITIES — Provide accurate information, respond promptly to Company requests, follow recommendations, pay all fees per the selected plan.',
      '',
      '3. FEES AND PAYMENT — Fees apply per the selected membership plan (Basic / Pro / Elite / VIP) as disclosed at enrollment.',
      '',
      '4. TERM AND TERMINATION — This agreement remains in effect until terminated by either party with 30 days written notice.',
      '',
      '5. DISCLAIMERS — Company makes no guarantee of specific credit score improvements. Results may vary based on individual circumstances.',
      '',
      '6. PRIVACY AND CONFIDENTIALITY — Company maintains strict confidentiality of all client information in accordance with applicable laws (FCRA, FDCPA, CROA).',
      '',
      'By signing below, Client acknowledges reading, understanding, and agreeing to all terms and conditions of this Agreement.',
    ];
    body.forEach(line => {
      const wrapped = doc.splitTextToSize(line, 515);
      doc.text(wrapped, margin, y); y += wrapped.length * 13 + 4;
      if (y > 720) { doc.addPage(); y = margin; }
    });
    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.text(`Client: ${clientName}`, margin, y); y += 16;
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, y); y += 16;
    doc.text('Signature:', margin, y); y += 6;
    try { doc.addImage(signaturePng, 'PNG', margin, y, 220, 70); } catch { /* ignore */ }
    y += 84;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Agreement v1.0  ·  Electronically signed and binding under ESIGN Act / UETA', margin, y);
    return doc.output('blob');
  };

  const submitAgreement = async () => {
    setLastError(null);
    setAttempt((n) => n + 1);

    if (!fullName.trim()) {
      toast({ title: 'Missing Information', description: 'Please type your full legal name.', variant: 'destructive' });
      return;
    }
    if (!signatureDataUrl && !typedSignature.trim()) {
      toast({ title: 'Signature required', description: 'Draw your signature or type it below.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to sign the agreement.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    let stage = 'init';
    try {
      // Build PNG of signature (use canvas if drawn, otherwise render typed name)
      stage = 'render_signature';
      let signaturePng = signatureDataUrl;
      if (!signaturePng) {
        const tmp = document.createElement('canvas');
        tmp.width = 500; tmp.height = 150;
        const ctx = tmp.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 500, 150);
          ctx.fillStyle = '#111827';
          ctx.font = 'italic 48px "Brush Script MT", cursive, sans-serif';
          ctx.fillText(typedSignature.trim(), 20, 90);
          signaturePng = tmp.toDataURL('image/png');
        }
      }

      // Resolve client_id
      stage = 'resolve_client';
      const { data: clientRow } = await supabase
        .from('clients').select('id').eq('user_id', user.id).maybeSingle();
      const clientId: string | null = (clientRow as any)?.id || null;

      // Build and upload signed PDF
      stage = 'upload_pdf';
      const pdfBlob = buildPdfBlob(fullName.trim(), signaturePng);
      const ts = Date.now();
      const pdfPath = `${user.id}/${ts}-service-agreement.pdf`;
      // Storage RLS requires the first folder segment to equal auth.uid() —
      // assert it locally so we never POST a path the policy will reject.
      if (pdfPath.split('/')[0] !== user.id) {
        throw new Error('Path/policy mismatch: first folder segment must equal your user id.');
      }
      const { error: uploadErr } = await supabase.storage
        .from('client-agreements')
        .upload(pdfPath, pdfBlob, { contentType: 'application/pdf', upsert: false });
      if (uploadErr) throw uploadErr;

      // Verify storage policy actually grants this user read access to the path
      stage = 'verify_storage_policy';
      const { error: verifyErr } = await supabase.storage
        .from('client-agreements')
        .createSignedUrl(pdfPath, 60);
      if (verifyErr) {
        throw new Error(`Uploaded PDF is not readable under current storage policy: ${verifyErr.message}`);
      }

      // Insert agreement record
      stage = 'insert_record';
      const { data: inserted, error: insertErr } = await supabase
        .from('client_agreements')
        .insert({
          user_id: user.id,
          client_id: clientId,
          full_name: fullName.trim(),
          signature_data: signaturePng,
          signed_pdf_path: pdfPath,
          ip_address: window.location.hostname,
          agreement_version: 'v1.0',
        } as any)
        .select('id, signed_pdf_path, user_id')
        .single();
      if (insertErr) throw insertErr;

      // Cross-check the stored record matches what we uploaded
      stage = 'verify_record';
      if ((inserted as any)?.signed_pdf_path !== pdfPath || (inserted as any)?.user_id !== user.id) {
        throw new Error('Agreement record path does not match uploaded PDF path.');
      }

      // Audit + activity timeline
      stage = 'audit_log';
      await Promise.all([
        supabase.rpc('log_security_event', {
          p_action: 'CLIENT_AGREEMENT_SIGNED',
          p_table_name: 'client_agreements',
          p_record_id: (inserted as any)?.id || null,
          p_details: { client_id: clientId, agreement_version: 'v1.0', signed_pdf_path: pdfPath },
          p_security_level: 'info',
          p_risk_score: 1,
        }),
        clientId
          ? supabase.from('client_activity_timeline').insert({
              client_id: clientId,
              user_id: user.id,
              activity_type: 'agreement',
              title: 'Service agreement signed',
              description: 'Client signed and submitted the service agreement.',
              visible_to_client: true,
              visible_to_admin: true,
              created_by_source: 'client_portal',
            } as any)
          : Promise.resolve(),
      ]);

      toast({ title: 'Agreement Signed', description: 'Your signed agreement has been saved.' });
      onAgreementSigned();
      onClose();
    } catch (error: any) {
      console.error('Error signing agreement:', error, 'stage:', stage);
      const message = error?.message || 'Failed to sign agreement. Please try again.';
      setLastError({ stage, message });
      const stageLabel: Record<string, string> = {
        render_signature: 'Rendering signature',
        resolve_client: 'Looking up your client record',
        upload_pdf: 'Uploading signed PDF',
        verify_storage_policy: 'Verifying storage permissions',
        insert_record: 'Saving agreement record',
        verify_record: 'Validating saved record',
        audit_log: 'Writing audit log',
      };
      toast({
        title: `Signature failed at: ${stageLabel[stage] || stage}`,
        description: `${message} — tap Retry to try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitAgreement();
  };

  const downloadAgreement = () => {
    const agreementText = `
EXPRESS CREDIT & FINANCIAL SOLUTIONS
CLIENT SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into between Express Credit & Financial Solutions ("Company") and the undersigned client ("Client").

1. SERVICES PROVIDED
Company agrees to provide credit restoration and financial consulting services including:
- Credit report analysis
- Dispute letter preparation and submission
- Credit monitoring and tracking
- Financial education and guidance

2. CLIENT RESPONSIBILITIES
Client agrees to:
- Provide accurate and complete information
- Respond promptly to Company requests
- Follow Company recommendations and guidance
- Pay all fees in accordance with the payment schedule

3. FEES AND PAYMENT
Client agrees to pay fees as outlined in the selected membership plan:
- Gold Basic Plan: $99.99 / 45 Days, then $49.99/month
- Pro Plan: $179.99 / 45 Days, then $79.99/month  
- Elite Plan: $249.99 / 45 Days, then $99.99/month

4. TERM AND TERMINATION
This agreement remains in effect until terminated by either party with 30 days written notice.

5. DISCLAIMERS
Company makes no guarantee of specific credit score improvements or timeline for results. Results may vary based on individual circumstances.

6. PRIVACY AND CONFIDENTIALITY
Company agrees to maintain strict confidentiality of all client information in accordance with applicable privacy laws and regulations.

By signing below, Client acknowledges reading, understanding, and agreeing to all terms and conditions of this Agreement.

Agreement Version: v1.0
Date: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([agreementText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Express_Credit_Service_Agreement.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFullName('');
    setTypedSignature('');
    setSignatureDataUrl('');
    clearCanvas();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Express Credit & Financial Solutions - Service Agreement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-6 py-4 flex-1 min-h-0">
          {/* Agreement Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={downloadAgreement}>
              <Download className="w-4 h-4 mr-2" />
              Download Agreement
            </Button>
          </div>

          {/* Agreement Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Agreement Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40 sm:h-56 w-full rounded border p-4 bg-muted/50">
                <div className="whitespace-pre-line text-sm">
                  <h3 className="font-semibold mb-4">EXPRESS CREDIT & FINANCIAL SOLUTIONS</h3>
                  <h4 className="font-semibold mb-4">CLIENT SERVICE AGREEMENT</h4>
                  
                  <p className="mb-4">This Service Agreement ("Agreement") is entered into between Express Credit & Financial Solutions ("Company") and the undersigned client ("Client").</p>
                  
                  <h4 className="font-semibold mb-2">1. SERVICES PROVIDED</h4>
                  <p className="mb-4">Company agrees to provide credit restoration and financial consulting services including:
                  • Credit report analysis
                  • Dispute letter preparation and submission
                  • Credit monitoring and tracking
                  • Financial education and guidance</p>
                  
                  <h4 className="font-semibold mb-2">2. CLIENT RESPONSIBILITIES</h4>
                  <p className="mb-4">Client agrees to:
                  • Provide accurate and complete information
                  • Respond promptly to Company requests
                  • Follow Company recommendations and guidance
                  • Pay all fees in accordance with the payment schedule</p>
                  
                  <h4 className="font-semibold mb-2">3. FEES AND PAYMENT</h4>
                  <p className="mb-4">Client agrees to pay fees as outlined in the selected membership plan:
                  • Basic Plan: $99.99/month
                  • Pro Plan: $179.99/month
                  • Elite Plan: $249.99/month</p>
                  
                  <h4 className="font-semibold mb-2">4. TERM AND TERMINATION</h4>
                  <p className="mb-4">This agreement remains in effect until terminated by either party with 30 days written notice.</p>
                  
                  <h4 className="font-semibold mb-2">5. DISCLAIMERS</h4>
                  <p className="mb-4">Company makes no guarantee of specific credit score improvements or timeline for results. Results may vary based on individual circumstances.</p>
                  
                  <h4 className="font-semibold mb-2">6. PRIVACY AND CONFIDENTIALITY</h4>
                  <p className="mb-4">Company agrees to maintain strict confidentiality of all client information in accordance with applicable privacy laws and regulations.</p>
                  
                  <p className="mt-6 font-medium">By signing below, Client acknowledges reading, understanding, and agreeing to all terms and conditions of this Agreement.</p>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Signature Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Legal Name *</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full legal name" required />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><PenTool className="h-4 w-4" /> Draw your signature *</Label>
              <div className="border rounded-lg p-3 bg-muted/30">
                <canvas
                  ref={canvasRef}
                  width={620}
                  height={160}
                  className="border-2 border-dashed border-muted-foreground/40 w-full cursor-crosshair bg-white rounded touch-none"
                  onMouseDown={(e) => startDraw(e.clientX, e.clientY)}
                  onMouseMove={(e) => moveDraw(e.clientX, e.clientY)}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={(e) => { const t = e.touches[0]; if (t) startDraw(t.clientX, t.clientY); }}
                  onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; if (t) moveDraw(t.clientX, t.clientY); }}
                  onTouchEnd={endDraw}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">Sign with mouse or finger. Or type your name below if you can't draw.</p>
                  <Button type="button" variant="outline" size="sm" onClick={clearCanvas} className="h-9">
                    <Eraser className="h-4 w-4 mr-1" /> Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="typedSignature">Or type signature (fallback)</Label>
              <Input id="typedSignature" value={typedSignature} onChange={(e) => setTypedSignature(e.target.value)} placeholder="Type your full name as a typed signature" />
            </div>

            {lastError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm space-y-2">
                <p className="font-medium text-destructive">Signature failed at: {lastError.stage.replace(/_/g, ' ')}</p>
                <p className="text-destructive/90">{lastError.message}</p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => void submitAgreement()}
                >
                  {isSubmitting ? 'Retrying…' : `Retry${attempt > 1 ? ` (attempt ${attempt + 1})` : ''}`}
                </Button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !fullName.trim() || (!signatureDataUrl && !typedSignature.trim())}
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
              >
                {isSubmitting ? 'Signing...' : 'I Agree & Sign Agreement'}
              </Button>
            </div>
          </form>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium">Important Notice:</p>
            <p>Your electronic signature has the same legal effect as a handwritten signature. Please ensure you have read and understand all terms before signing.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}