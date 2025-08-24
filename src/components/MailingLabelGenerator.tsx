import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, Printer, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ClientData {
  id: string;
  full_name: string;
  address: string;
  email: string;
  phone: string;
}

interface MailingLabelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
}

export function MailingLabelGenerator({ open, onOpenChange, clientId }: MailingLabelProps) {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(false);
  const [returnAddress, setReturnAddress] = useState({
    name: 'Express Credit & Financial Solutions',
    address1: '123 Business Street',
    address2: 'Suite 100',
    city: 'Business City',
    state: 'BC',
    zip: '12345'
  });
  const [creditorAddress, setCreditorAddress] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: ''
  });

  useEffect(() => {
    if (open && clientId) {
      fetchClientData();
    }
  }, [open, clientId]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setClientData(data);
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const generateUSPSLabel = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [4.25, 5.5] // USPS label size
    });

    const margin = 0.25;
    let yPos = margin;

    // Return address (top left)
    doc.setFontSize(10);
    doc.text(returnAddress.name, margin, yPos);
    yPos += 0.15;
    doc.text(returnAddress.address1, margin, yPos);
    if (returnAddress.address2) {
      yPos += 0.15;
      doc.text(returnAddress.address2, margin, yPos);
    }
    yPos += 0.15;
    doc.text(`${returnAddress.city}, ${returnAddress.state} ${returnAddress.zip}`, margin, yPos);

    // Destination address (center)
    yPos = 1.5;
    doc.setFontSize(14);
    if (creditorAddress.name) {
      doc.text(creditorAddress.name, margin, yPos);
      yPos += 0.2;
    }
    if (creditorAddress.address1) {
      doc.text(creditorAddress.address1, margin, yPos);
      yPos += 0.2;
    }
    if (creditorAddress.address2) {
      doc.text(creditorAddress.address2, margin, yPos);
      yPos += 0.2;
    }
    if (creditorAddress.city && creditorAddress.state && creditorAddress.zip) {
      doc.text(`${creditorAddress.city}, ${creditorAddress.state} ${creditorAddress.zip}`, margin, yPos);
    }

    // Sender info (if client data available)
    if (clientData) {
      yPos = 4.5;
      doc.setFontSize(8);
      doc.text(`From: ${clientData.full_name}`, margin, yPos);
      yPos += 0.12;
      doc.text(`Client ID: ${clientData.id}`, margin, yPos);
    }

    const fileName = `Mailing_Label_${creditorAddress.name?.replace(/[^a-z0-9]/gi, '_') || 'Label'}.pdf`;
    doc.save(fileName);
    
    toast.success('USPS label downloaded successfully');
  };

  const generateLobAPICode = () => {
    const lobCode = `
// Lob.com API Integration (requires Lob API key)
// npm install lob

/*
const Lob = require('lob')(process.env.LOB_API_KEY);

const letterData = {
  description: 'Credit Dispute Letter',
  to: {
    name: '${creditorAddress.name}',
    address_line1: '${creditorAddress.address1}',
    address_line2: '${creditorAddress.address2}',
    address_city: '${creditorAddress.city}',
    address_state: '${creditorAddress.state}',
    address_zip: '${creditorAddress.zip}',
    address_country: 'US'
  },
  from: {
    name: '${returnAddress.name}',
    address_line1: '${returnAddress.address1}',
    address_line2: '${returnAddress.address2}',
    address_city: '${returnAddress.city}',
    address_state: '${returnAddress.state}',
    address_zip: '${returnAddress.zip}',
    address_country: 'US'
  },
  file: 'https://your-server.com/dispute-letter.pdf', // URL to your PDF
  color: false
};

// Send letter via Lob API
Lob.letters.create(letterData, function (err, res) {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log('Letter created:', res);
    // res.url contains tracking URL
    // res.expected_delivery_date contains estimated delivery
  }
});
*/

// To integrate:
// 1. Sign up at https://lob.com
// 2. Get your API key from dashboard
// 3. Install: npm install lob
// 4. Add LOB_API_KEY to your environment variables
// 5. Replace the PDF URL with your actual document
`;

    // Copy to clipboard
    navigator.clipboard.writeText(lobCode);
    toast.success('Lob.com integration code copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Mailing Label Generator
          </DialogTitle>
          <DialogDescription>
            Generate USPS mailing labels for dispute letters
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading client data...</div>
        ) : (
          <div className="space-y-6">
            {/* Return Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Return Address (Your Company)</CardTitle>
                <CardDescription>The sender information for the label</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="return-name">Company Name</Label>
                    <Input
                      id="return-name"
                      value={returnAddress.name}
                      onChange={(e) => setReturnAddress({...returnAddress, name: e.target.value})}
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return-address1">Address Line 1</Label>
                    <Input
                      id="return-address1"
                      value={returnAddress.address1}
                      onChange={(e) => setReturnAddress({...returnAddress, address1: e.target.value})}
                      placeholder="Street Address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return-address2">Address Line 2 (Optional)</Label>
                    <Input
                      id="return-address2"
                      value={returnAddress.address2}
                      onChange={(e) => setReturnAddress({...returnAddress, address2: e.target.value})}
                      placeholder="Suite, Apt, etc."
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="return-city">City</Label>
                      <Input
                        id="return-city"
                        value={returnAddress.city}
                        onChange={(e) => setReturnAddress({...returnAddress, city: e.target.value})}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="return-state">State</Label>
                      <Input
                        id="return-state"
                        value={returnAddress.state}
                        onChange={(e) => setReturnAddress({...returnAddress, state: e.target.value})}
                        placeholder="ST"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="return-zip">ZIP</Label>
                      <Input
                        id="return-zip"
                        value={returnAddress.zip}
                        onChange={(e) => setReturnAddress({...returnAddress, zip: e.target.value})}
                        placeholder="12345"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creditor Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Creditor Address (Destination)</CardTitle>
                <CardDescription>The address where the dispute letter will be sent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creditor-name">Creditor Name</Label>
                    <Input
                      id="creditor-name"
                      value={creditorAddress.name}
                      onChange={(e) => setCreditorAddress({...creditorAddress, name: e.target.value})}
                      placeholder="e.g., Capital One"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditor-address1">Address Line 1</Label>
                    <Input
                      id="creditor-address1"
                      value={creditorAddress.address1}
                      onChange={(e) => setCreditorAddress({...creditorAddress, address1: e.target.value})}
                      placeholder="Street Address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditor-address2">Address Line 2 (Optional)</Label>
                    <Input
                      id="creditor-address2"
                      value={creditorAddress.address2}
                      onChange={(e) => setCreditorAddress({...creditorAddress, address2: e.target.value})}
                      placeholder="Suite, Dept, etc."
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="creditor-city">City</Label>
                      <Input
                        id="creditor-city"
                        value={creditorAddress.city}
                        onChange={(e) => setCreditorAddress({...creditorAddress, city: e.target.value})}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="creditor-state">State</Label>
                      <Input
                        id="creditor-state"
                        value={creditorAddress.state}
                        onChange={(e) => setCreditorAddress({...creditorAddress, state: e.target.value})}
                        placeholder="ST"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="creditor-zip">ZIP</Label>
                      <Input
                        id="creditor-zip"
                        value={creditorAddress.zip}
                        onChange={(e) => setCreditorAddress({...creditorAddress, zip: e.target.value})}
                        placeholder="12345"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            {clientData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Name:</strong> {clientData.full_name}
                    </div>
                    <div>
                      <strong>Email:</strong> {clientData.email}
                    </div>
                    <div className="col-span-2">
                      <strong>Address:</strong> {clientData.address}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Labels</CardTitle>
                <CardDescription>
                  Choose how you want to create your mailing labels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={generateUSPSLabel}
                    disabled={!creditorAddress.name || !creditorAddress.address1}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download USPS Label PDF
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={generateLobAPICode}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Copy Lob.com Integration Code
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <Badge className="mb-2">Pro Tip</Badge>
                  <p className="text-sm text-muted-foreground">
                    For automated mailing, integrate with Lob.com API to send letters directly without 
                    manual printing. The integration code provides a starting template.
                  </p>
                </div>

                {/* Lob.com Integration Info */}
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Lob.com API Integration (Optional)</CardTitle>
                    <CardDescription>
                      Automate physical mail delivery through Lob's API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-2">
                      <p><strong>Benefits:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Automated printing and mailing</li>
                        <li>Tracking and delivery confirmations</li>
                        <li>Certified mail options</li>
                        <li>Address verification</li>
                        <li>Bulk mailing capabilities</li>
                      </ul>
                      <p className="mt-3">
                        <strong>Setup:</strong> Create account at{' '}
                        <a 
                          href="https://lob.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          lob.com
                        </a>{' '}
                        and get your API key
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}