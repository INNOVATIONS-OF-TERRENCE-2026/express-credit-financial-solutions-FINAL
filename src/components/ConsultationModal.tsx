import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Calendar } from 'lucide-react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConsultationModal({ isOpen, onClose }: ConsultationModalProps) {
  const phone = "(903) 484-6348";
  const email = "expresscreditfinancialsolution@gmail.com";

  const handlePhoneClick = () => {
    if (navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i)) {
      window.location.href = `tel:${phone}`;
    } else {
      // For desktop, copy to clipboard and show toast
      navigator.clipboard.writeText(phone).then(() => {
        alert(`Phone number ${phone} copied to clipboard!`);
      }).catch(() => {
        alert(`Please call us at ${phone}`);
      });
    }
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent('Credit Consultation Request');
    const body = encodeURIComponent('Hello, I would like to schedule a credit consultation. Please let me know your availability.');
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule Your Consultation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Ready to take control of your credit? Our expert team is here to help you create a personalized action plan.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-semibold text-primary mb-2">Contact Us Directly</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please email us or call us directly to schedule your credit consultation:
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={handleEmailClick}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Mail className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Email Us</div>
                    <div className="text-xs text-muted-foreground">{email}</div>
                  </div>
                </Button>

                <Button
                  onClick={handlePhoneClick}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Phone className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Call Us</div>
                    <div className="text-xs text-muted-foreground">{phone}</div>
                  </div>
                </Button>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">What to Expect</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Comprehensive credit report review</li>
                <li>• Personalized dispute strategy</li>
                <li>• Credit building recommendations</li>
                <li>• Timeline and next steps discussion</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}