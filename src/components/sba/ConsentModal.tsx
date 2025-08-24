import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ConsentModalProps {
  open: boolean;
  onAccept: (types: string[]) => void;
  onClose: () => void;
}

export function ConsentModal({ open, onAccept, onClose }: ConsentModalProps) {
  const [consents, setConsents] = useState({
    tcpa: false,
    fcra: false,
    glba: false,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const allConsented = consents.tcpa && consents.fcra && consents.glba;

  const handleAccept = async () => {
    if (!allConsented) {
      toast({
        title: "Please accept all terms",
        description: "You must agree to all three consent types to proceed.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Create consent records for each type
      const consentTypes = ['TCPA', 'FCRA', 'GLBA'];
      
      // Simulate API call with delay - replace with actual API call when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log consents locally for now
      console.log('Consents accepted:', consentTypes, new Date().toISOString());
      
      onAccept(consentTypes);
      toast({
        title: "Consents Recorded",
        description: "Your consents have been saved successfully.",
      });
    } catch (error) {
      console.error('Consent error:', error);
      toast({
        title: "Error",
        description: "Failed to record consents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            Required Consents & Disclosures
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {/* TCPA Consent */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-400">TCPA Communications Consent</h3>
            <ScrollArea className="h-48 border border-slate-700 rounded p-3 bg-slate-800/50">
              <div className="text-sm text-slate-300 space-y-2">
                <p>
                  By providing your phone number, you consent to receive calls and text messages 
                  from Express Credit & Financial Solutions and our SBA lending partners regarding 
                  your loan application.
                </p>
                <p>
                  This includes automated calls, prerecorded messages, and SMS texts to the 
                  number you provided. Message and data rates may apply.
                </p>
                <p>
                  You can opt out at any time by replying STOP to text messages or requesting 
                  removal during any call.
                </p>
              </div>
            </ScrollArea>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tcpa"
                checked={consents.tcpa}
                onCheckedChange={(checked) => 
                  setConsents(prev => ({ ...prev, tcpa: !!checked }))
                }
              />
              <label htmlFor="tcpa" className="text-sm text-slate-300 cursor-pointer">
                I agree to TCPA communications consent
              </label>
            </div>
          </div>

          {/* FCRA Consent */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-400">FCRA Credit Check Authorization</h3>
            <ScrollArea className="h-48 border border-slate-700 rounded p-3 bg-slate-800/50">
              <div className="text-sm text-slate-300 space-y-2">
                <p>
                  You authorize Express Credit & Financial Solutions and our lending partners 
                  to obtain credit reports and scores from consumer reporting agencies.
                </p>
                <p>
                  This may include soft credit pulls that do not affect your credit score, 
                  and potentially hard inquiries during the underwriting process.
                </p>
                <p>
                  Information will be used solely for evaluating your SBA loan application 
                  and matching you with appropriate lenders.
                </p>
              </div>
            </ScrollArea>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fcra"
                checked={consents.fcra}
                onCheckedChange={(checked) => 
                  setConsents(prev => ({ ...prev, fcra: !!checked }))
                }
              />
              <label htmlFor="fcra" className="text-sm text-slate-300 cursor-pointer">
                I authorize credit checks per FCRA
              </label>
            </div>
          </div>

          {/* GLBA Privacy Notice */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-400">GLBA Privacy Notice</h3>
            <ScrollArea className="h-48 border border-slate-700 rounded p-3 bg-slate-800/50">
              <div className="text-sm text-slate-300 space-y-2">
                <p>
                  We collect, use, and share your personal and business financial information 
                  as described in our Privacy Policy and as permitted by the Gramm-Leach-Bliley Act.
                </p>
                <p>
                  Information may be shared with SBA-approved lenders, credit bureaus, and 
                  service providers to process your application.
                </p>
                <p>
                  We implement safeguards to protect your information and do not sell your 
                  personal data to third parties for marketing purposes.
                </p>
              </div>
            </ScrollArea>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="glba"
                checked={consents.glba}
                onCheckedChange={(checked) => 
                  setConsents(prev => ({ ...prev, glba: !!checked }))
                }
              />
              <label htmlFor="glba" className="text-sm text-slate-300 cursor-pointer">
                I acknowledge GLBA privacy notice
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!allConsented || loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              'I Agree to All Terms'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}