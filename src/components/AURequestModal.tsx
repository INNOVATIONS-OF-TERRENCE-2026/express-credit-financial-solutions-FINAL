import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AURequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradelineId?: string;
}

export function AURequestModal({ isOpen, onClose, tradelineId }: AURequestModalProps) {
  const [fullName, setFullName] = useState('');
  const [selectedTradelineId, setSelectedTradelineId] = useState(tradelineId || '');
  const [creditBureau, setCreditBureau] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const availableTradelines = [
    { id: 'au1', name: '15 Years, $25,000 Limit, 5% Utilization - $899' },
    { id: 'au2', name: '12 Years, $15,000 Limit, 3% Utilization - $699' },
    { id: 'au3', name: '8 Years, $10,000 Limit, 2% Utilization - $499' }
  ];

  const creditBureaus = [
    'Experian',
    'Equifax', 
    'TransUnion',
    'All Three Bureaus'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !selectedTradelineId || !creditBureau) {
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
        description: "You must be logged in to submit an AU request",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-au-request', {
        body: {
          fullName: fullName.trim(),
          tradelineId: selectedTradelineId,
          creditBureau,
          phone: phone.trim() || null
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "AU Request Submitted",
        description: "Your authorized user request has been submitted successfully. We'll contact you within 24-48 hours with next steps.",
      });

      // Reset form
      setFullName('');
      setSelectedTradelineId('');
      setCreditBureau('');
      setPhone('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting AU request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit AU request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-primary" />
            Request Authorized User Slot
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tradeline">Select Tradeline *</Label>
            <Select value={selectedTradelineId} onValueChange={setSelectedTradelineId} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tradeline" />
              </SelectTrigger>
              <SelectContent>
                {availableTradelines.map((tradeline) => (
                  <SelectItem key={tradeline.id} value={tradeline.id}>
                    {tradeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bureau">Credit Bureau *</Label>
            <Select value={creditBureau} onValueChange={setCreditBureau} required>
              <SelectTrigger>
                <SelectValue placeholder="Select credit bureau" />
              </SelectTrigger>
              <SelectContent>
                {creditBureaus.map((bureau) => (
                  <SelectItem key={bureau} value={bureau}>
                    {bureau}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              type="tel"
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Your request will be sent to our team at{' '}
              <a 
                href="mailto:expresscreditfinancialsolution@gmail.com" 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                expresscreditfinancialsolution@gmail.com
              </a>
              . We'll contact you within 24-48 hours with pricing and next steps.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !fullName.trim() || !selectedTradelineId || !creditBureau}
              className="flex-1"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}