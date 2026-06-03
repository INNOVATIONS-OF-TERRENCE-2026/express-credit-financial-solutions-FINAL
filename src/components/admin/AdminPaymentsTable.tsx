import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { AdminPaymentRow } from "@/hooks/useAdminPayments";
import { formatCurrency, formatDateTime, methodLabel } from "@/lib/payments";
import { Eye } from "lucide-react";

export function AdminPaymentsTable({ rows, onOpen }: { rows: AdminPaymentRow[]; onOpen: (p: AdminPaymentRow) => void }) {
  if (rows.length === 0) {
    return <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">No payments match these filters.</div>;
  }
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead>
            <TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r)}>
              <TableCell>
                <div className="font-medium">
                  {[r.profile_first_name, r.profile_last_name].filter(Boolean).join(" ") || "—"}
                </div>
                <div className="text-xs text-muted-foreground">{r.profile_email ?? "—"}</div>
              </TableCell>
              <TableCell className="font-semibold">{formatCurrency(r.payment_amount)}</TableCell>
              <TableCell>{methodLabel(r.payment_method)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(r.submitted_at)}</TableCell>
              <TableCell><PaymentStatusBadge status={r.payment_status} /></TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onOpen(r); }}>
                  <Eye className="h-4 w-4 mr-1" /> Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}