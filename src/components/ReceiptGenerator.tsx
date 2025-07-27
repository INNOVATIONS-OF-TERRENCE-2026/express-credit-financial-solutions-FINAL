import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentReceipt {
  id: string;
  receipt_id: string;
  client_name: string;
  membership_level: string;
  amount_paid: number;
  payment_date: string;
  card_last_four?: string;
}

interface ReceiptGeneratorProps {
  receipts: PaymentReceipt[];
}

export function ReceiptGenerator({ receipts }: ReceiptGeneratorProps) {
  const { toast } = useToast();

  const generateReceiptPDF = (receipt: PaymentReceipt) => {
    const receiptContent = `
RECEIPT
Express Credit & Financial Solutions

Receipt ID: ${receipt.receipt_id}
Date: ${new Date(receipt.payment_date).toLocaleDateString()}

Client Information:
Name: ${receipt.client_name}
Membership Plan: ${receipt.membership_level}

Payment Details:
Amount Paid: $${receipt.amount_paid.toFixed(2)}
Payment Method: Card ending in ${receipt.card_last_four || '****'}
Payment Date: ${new Date(receipt.payment_date).toLocaleString()}

Thank you for your business!

Express Credit & Financial Solutions
Secure Payment Processing by Stripe
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${receipt.receipt_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Receipt Downloaded',
      description: 'Your payment receipt has been downloaded.',
    });
  };

  if (receipts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No payment receipts available. Receipts will appear here after successful payments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Payment Receipts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Receipt #{receipt.receipt_id}</p>
              <p className="text-sm text-muted-foreground">
                {receipt.membership_level} Plan - ${receipt.amount_paid.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(receipt.payment_date).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateReceiptPDF(receipt)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}