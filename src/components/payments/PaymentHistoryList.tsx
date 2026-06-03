import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { ReplaceProofDialog } from "./ReplaceProofDialog";
import { PaymentRecord } from "@/hooks/usePayments";
import { formatCurrency, formatDateTime, methodLabel } from "@/lib/payments";
import { Upload } from "lucide-react";

interface Props { records: PaymentRecord[]; onReplace: (id: string, file: File) => Promise<void>; }

export function PaymentHistoryList({ records, onReplace }: Props) {
  const [replaceId, setReplaceId] = useState<string | null>(null);
  if (records.length === 0) {
    return <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">No payments submitted yet.</div>;
  }
  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead>
              <TableHead>Status</TableHead><TableHead>Reviewed</TableHead><TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => {
              const canReplace = r.payment_status === "rejected" || r.payment_status === "needs_review";
              return (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(r.submitted_at)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(r.payment_amount)}</TableCell>
                  <TableCell>{methodLabel(r.payment_method)}</TableCell>
                  <TableCell><PaymentStatusBadge status={r.payment_status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(r.reviewed_at)}</TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {r.payment_status === "rejected" ? r.rejection_reason
                      : r.payment_status === "needs_review" ? r.client_visible_message
                      : r.payment_note || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canReplace ? (
                      <Button size="sm" variant="outline" onClick={() => setReplaceId(r.id)}>
                        <Upload className="h-4 w-4 mr-1" /> Replace Proof
                      </Button>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <ReplaceProofDialog open={!!replaceId} onOpenChange={(v) => !v && setReplaceId(null)}
        onSubmit={async (file) => { if (replaceId) { await onReplace(replaceId, file); setReplaceId(null); } }} />
    </>
  );
}