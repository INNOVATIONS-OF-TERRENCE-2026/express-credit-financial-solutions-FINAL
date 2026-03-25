import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';

interface ClientAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgreementSigned: () => void;
}

export function ClientAgreementModal({ isOpen, onClose, onAgreementSigned }: ClientAgreementModalProps) {
  const [fullName, setFullName] = useState('');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !signature.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both your full name and electronic signature.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to sign the agreement.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save the signed agreement to the database
      const { error } = await supabase
        .from('client_agreements')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          signature_data: signature.trim(),
          ip_address: window.location.hostname,
          agreement_version: 'v1.0'
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Agreement Signed',
        description: 'Your service agreement has been successfully signed.',
      });

      onAgreementSigned();
      onClose();
    } catch (error) {
      console.error('Error signing agreement:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign agreement. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
    setSignature('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Express Credit & Financial Solutions - Service Agreement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
              <ScrollArea className="h-64 w-full rounded border p-4 bg-muted/50">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="signature">Electronic Signature *</Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full name as signature"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !fullName.trim() || !signature.trim()}
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