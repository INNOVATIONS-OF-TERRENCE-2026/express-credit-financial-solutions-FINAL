import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePayments } from "@/hooks/usePayments";
import { ACCEPTED_PROOF_TYPES, PaymentMethod, paymentSubmissionSchema } from "@/lib/payments";
import { CashAppCard } from "@/components/payments/CashAppCard";
import { ApplePayCard } from "@/components/payments/ApplePayCard";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function PaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submitPayment } = usePayments();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!authLoading && !user) { navigate("/", { replace: true }); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) { toast({ title: "Choose a payment method.", variant: "destructive" }); return; }
    if (!file) { toast({ title: "Upload proof of payment.", variant: "destructive" }); return; }
    const parsed = paymentSubmissionSchema.safeParse({
      payment_method: method, payment_amount: Number(amount), payment_note: note,
    });
    if (!parsed.success) {
      toast({ title: "Check your entries", description: parsed.error.errors[0]?.message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await submitPayment({
        payment_method: parsed.data.payment_method,
        payment_amount: parsed.data.payment_amount,
        payment_note: parsed.data.payment_note,
        proofFile: file,
      });
      setSuccess(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="glass-card text-center">
            <CardContent className="py-12 space-y-4">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <h1 className="text-2xl font-bold">Payment proof submitted</h1>
              <p className="text-muted-foreground">
                Thank you. Your payment proof has been submitted and is pending review. Once approved,
                your portal payment history will update automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                <Button asChild><Link to="/payment-history">View Payment History</Link></Button>
                <Button variant="outline" onClick={() => { setSuccess(false); setMethod(null); setAmount(""); setNote(""); setFile(null); }}>
                  Submit Another Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to portal
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Make a Payment</h1>
            <p className="text-muted-foreground mt-1">
              Choose your payment method, enter your amount, send payment, then upload proof so we can update your portal.
            </p>
          </div>
          <Button variant="outline" asChild><Link to="/payment-history">Payment History</Link></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <CashAppCard selected={method === "cash_app"} onSelect={() => setMethod("cash_app")} />
            <ApplePayCard selected={method === "apple_pay"} onSelect={() => setMethod("apple_pay")} />
          </div>
          <Card>
            <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input id="amount" type="number" min="1" step="0.01" placeholder="0.00"
                    value={amount} onChange={(e) => setAmount(e.target.value)} required className="text-lg" />
                  <p className="text-xs text-muted-foreground mt-1">Minimum $1.00.</p>
                </div>
                <div>
                  <Label htmlFor="proof">Payment proof (PNG, JPG, PDF) *</Label>
                  <Input id="proof" type="file" accept={ACCEPTED_PROOF_TYPES.join(",")}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
                  <p className="text-xs text-muted-foreground mt-1">Max 8 MB.</p>
                </div>
              </div>
              <div>
                <Label htmlFor="note">Payment note (optional)</Label>
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Example: June payment, onboarding fee, dispute round payment, remaining balance" maxLength={500} />
              </div>
              <Button type="submit" disabled={submitting} className="w-full" size="lg">
                {submitting ? "Submitting…" : "Submit Payment Proof"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Submissions are reviewed manually. We do not auto-confirm Cash App or Apple Pay payments.
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}