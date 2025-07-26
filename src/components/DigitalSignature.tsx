import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PenTool, FileText, Download } from 'lucide-react';

interface DigitalSignatureProps {
  onSignatureComplete?: () => void;
}

export function DigitalSignature({ onSignatureComplete }: DigitalSignatureProps) {
  const [fullName, setFullName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { toast } = useToast();

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setSignatureData(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleSign = async () => {
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!signatureData) {
      toast({
        title: "Error", 
        description: "Please draw your signature",
        variant: "destructive",
      });
      return;
    }

    setIsSigning(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('client_agreements')
        .insert({
          user_id: user.id,
          full_name: fullName,
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          ip_address: await fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => data.ip)
            .catch(() => 'unknown')
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agreement signed successfully!",
      });

      onSignatureComplete?.();
    } catch (error) {
      console.error('Error signing agreement:', error);
      toast({
        title: "Error",
        description: "Failed to sign agreement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const downloadAgreement = () => {
    const agreementText = `
CLIENT SERVICE AGREEMENT
Express Credit & Financial Solutions LLC

1. PLAN TERMS
This agreement covers the credit repair services you have selected. Services will be provided according to your chosen membership plan.

2. CONSENT TO CREDIT REPAIR SERVICES  
You consent to Express Credit & Financial Solutions LLC providing credit repair services on your behalf, including but not limited to:
- Reviewing your credit reports
- Identifying inaccuracies and errors
- Drafting and sending dispute letters
- Following up with credit bureaus and creditors

3. AUTHORIZATION TO ACT ON YOUR BEHALF
You authorize Express Credit & Financial Solutions LLC to act as your representative in all credit repair matters, including:
- Communicating with credit bureaus
- Communicating with creditors and collection agencies
- Accessing your credit reports for review and analysis

4. NON-REFUNDABLE BILLING ACKNOWLEDGEMENT
You acknowledge that all payments made for services are non-refundable. Services are provided on a month-to-month basis, and you may cancel at any time to stop future billing.

5. COMPLIANCE WITH FEDERAL LAW
All services will be provided in compliance with the Fair Credit Reporting Act (FCRA), Fair Debt Collection Practices Act (FDCPA), and Credit Repair Organizations Act (CROA).

By signing below, you acknowledge that you have read, understood, and agree to all terms of this agreement.
    `;

    const blob = new Blob([agreementText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Client_Service_Agreement.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Sign Agreement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Button
            onClick={downloadAgreement}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View Agreement
          </Button>
          <Button
            onClick={downloadAgreement}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Legal Name *</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full legal name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Digital Signature *</Label>
          <div className="border rounded-lg p-4 bg-muted/50">
            <canvas
              ref={canvasRef}
              width={500}
              height={150}
              className="border-2 border-dashed border-muted-foreground/50 w-full cursor-crosshair bg-white rounded"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-muted-foreground">
                Sign above with your mouse or finger
              </p>
              <Button
                onClick={clearSignature}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSign}
          disabled={isSigning}
          className="w-full"
          size="lg"
        >
          {isSigning ? 'Signing...' : 'Sign Agreement'}
        </Button>
      </CardContent>
    </Card>
  );
}