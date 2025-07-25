import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to sign the agreement",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('client_agreements')
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          signature_data: signature.trim(),
          signed_at: new Date().toISOString(),
          agreement_version: 'v1.0'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Agreement Signed Successfully",
        description: "Thank you for signing the Client Service Agreement. You now have full access to our services.",
      });

      onAgreementSigned();
      onClose();
    } catch (error: any) {
      console.error('Error signing agreement:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit agreement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-primary" />
            Client Service Agreement - Signature Required
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agreement Content */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Agreement Terms</h3>
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-4 text-sm leading-relaxed">
                <div>
                  <h4 className="font-semibold text-primary">Client Service Agreement</h4>
                  <p className="text-muted-foreground text-xs">Express Credit & Financial Solutions LLC</p>
                </div>

                <Separator />

                <div>
                  <h5 className="font-semibold">1. Plan Terms & Services</h5>
                  <p>
                    By signing this agreement, you acknowledge that you have selected a membership plan and 
                    understand the services included. Our credit repair services are provided according to 
                    the specific plan terms you have chosen.
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold">2. Consent to Credit Repair Services</h5>
                  <p>
                    You hereby consent to Express Credit & Financial Solutions LLC providing credit repair 
                    services on your behalf, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Reviewing your credit reports for inaccuracies</li>
                    <li>Disputing negative items with credit bureaus</li>
                    <li>Communicating with creditors and collection agencies</li>
                    <li>Providing credit education and coaching</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold">3. Authorization to Act on Your Behalf</h5>
                  <p>
                    You authorize Express Credit & Financial Solutions LLC to act as your agent in all 
                    matters related to your credit repair process. This includes communicating with credit 
                    bureaus, creditors, and collection agencies regarding your credit profile.
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold">4. Billing & Payment Terms</h5>
                  <p>
                    You acknowledge that all membership fees are non-refundable once services have commenced. 
                    Monthly subscriptions will be billed automatically until canceled. You may cancel your 
                    service at any time through your account dashboard.
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold">5. Client Responsibilities</h5>
                  <p>
                    You agree to provide accurate information, respond to our communications in a timely 
                    manner, and forward any correspondence received from credit bureaus or creditors 
                    regarding your disputes.
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold">6. Compliance & Legal</h5>
                  <p>
                    Our services are provided in full compliance with the Credit Repair Organizations Act 
                    (CROA), Fair Credit Reporting Act (FCRA), and applicable state regulations. Results 
                    are not guaranteed and may vary based on individual circumstances.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold text-sm">
                    By signing below, you acknowledge that you have read, understood, and agree to all 
                    terms of this Client Service Agreement.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Signature Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Electronic Signature</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Type your full name as your signature"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  By typing your name above, you are creating a legally binding electronic signature.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Date: {new Date().toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your signature will be timestamped and securely stored in your client profile.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !fullName.trim() || !signature.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Sign Agreement & Continue"}
                </Button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> You cannot access our services until this agreement is signed. 
                This protects both you and Express Credit & Financial Solutions LLC.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}