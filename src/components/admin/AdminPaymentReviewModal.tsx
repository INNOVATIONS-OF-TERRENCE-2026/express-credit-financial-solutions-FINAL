import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdminPaymentRow, useAdminPayments } from "@/hooks/useAdminPayments";
import { createProofSignedUrl, formatCurrency, formatDateTime, methodLabel } from "@/lib/payments";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertCircle, FileText, ExternalLink } from "lucide-react";

interface Props {
  payment: AdminPaymentRow | null;
  onClose: () => void;
  actions: ReturnType<typeof useAdminPayments>;
}

export function AdminPaymentReviewModal({ payment, onClose, actions }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!payment) { setSignedUrl(null); setEvents([]); return; }
    createProofSignedUrl(payment.payment_proof_file_path).then(setSignedUrl);
    supabase.from("payment_activity_events")
      .select("*").eq("payment_record_id", payment.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setEvents(data ?? []));
    setRejectReason(""); setReviewMsg(""); setNote("");
  }, [payment?.id]);

  if (!payment || !user) return null;

  const wrap = async (fn: () => Promise<void>, key: string, ok: string) => {
    setBusy(key);
    try { await fn(); toast({ title: ok }); onClose(); }
    catch (e: any) { toast({ title: "Action failed", description: e.message, variant: "destructive" }); }
    finally { setBusy(null); }
  };

  const ext = (payment.payment_proof_file_path ?? "").split(".").pop()?.toLowerCase();
  const isPdf = ext === "pdf";

  return (
    <Dialog open={!!payment} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>Payment Review</span>
            <PaymentStatusBadge status={payment.payment_status} />
          </DialogTitle>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Client</p>
            <p className="font-medium">
              {[payment.profile_first_name, payment.profile_last_name].filter(Boolean).join(" ") || "—"}
            </p>
            <p className="text-muted-foreground">{payment.profile_email ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount / Method</p>
            <p className="font-semibold text-lg">{formatCurrency(payment.payment_amount)}</p>
            <p>{methodLabel(payment.payment_method)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Submitted</p>
            <p>{formatDateTime(payment.submitted_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reviewed</p>
            <p>{formatDateTime(payment.reviewed_at)}</p>
          </div>
        </div>

        {payment.payment_note && (
          <div>
            <p className="text-sm text-muted-foreground">Client note</p>
            <p className="text-sm">{payment.payment_note}</p>
          </div>
        )}

        <Separator />

        <div>
          <p className="text-sm text-muted-foreground mb-2">Proof of payment</p>
          {signedUrl ? (
            isPdf ? (
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline">
                <FileText className="h-4 w-4 mr-1" /> Open PDF <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            ) : (
              <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                <img src={signedUrl} alt="Payment proof" className="max-h-80 rounded-md border border-border" />
              </a>
            )
          ) : (
            <p className="text-sm text-muted-foreground">Proof preview unavailable.</p>
          )}
        </div>

        <Separator />

        {payment.admin_notes && (
          <div>
            <p className="text-sm text-muted-foreground">Admin notes</p>
            <pre className="text-xs whitespace-pre-wrap bg-muted/40 p-3 rounded-md">{payment.admin_notes}</pre>
          </div>
        )}

        <div>
          <p className="text-sm text-muted-foreground mb-2">Status history</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {events.length === 0 && <li>No events yet.</li>}
            {events.map((e) => (
              <li key={e.id}>
                <span className="text-foreground font-medium">{e.title}</span> · {formatDateTime(e.created_at)}
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => wrap(() => actions.approve(payment.id, user.id), "approve", "Payment approved.")}
              disabled={!!busy} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
            </Button>
          </div>

          <div className="space-y-1">
            <Label>Reject (reason required)</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Tell the client why this proof could not be verified" />
            <Button variant="destructive" disabled={!!busy || !rejectReason.trim()}
              onClick={() => wrap(() => actions.reject(payment.id, user.id, rejectReason), "reject", "Payment rejected.")}>
              <XCircle className="h-4 w-4 mr-1" /> Reject
            </Button>
          </div>

          <div className="space-y-1">
            <Label>Mark needs review (message to client required)</Label>
            <Textarea value={reviewMsg} onChange={(e) => setReviewMsg(e.target.value)}
              placeholder="What does the client need to provide?" />
            <Button variant="outline" disabled={!!busy || !reviewMsg.trim()}
              onClick={() => wrap(() => actions.markNeedsReview(payment.id, user.id, reviewMsg), "review", "Marked needs review.")}>
              <AlertCircle className="h-4 w-4 mr-1" /> Needs Review
            </Button>
          </div>

          <div className="space-y-1">
            <Label>Add internal admin note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal only" />
            <Button variant="secondary" disabled={!!busy || !note.trim()}
              onClick={() => wrap(() => actions.addAdminNote(payment.id, note), "note", "Note added.")}>
              Save Admin Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}