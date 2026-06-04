import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { ClientPaymentWidget } from '@/components/payments/ClientPaymentWidget';
import { PaymentHistoryList } from '@/components/payments/PaymentHistoryList';
import { usePayments } from '@/hooks/usePayments';

function Inner() {
  const { records, replaceProof } = usePayments();
  return (
    <div className="space-y-4">
      <ClientPaymentWidget />
      <PaymentHistoryList records={records} onReplace={replaceProof} />
    </div>
  );
}

export default function ClientPaymentsPage() {
  return <ClientPortalLayout title="Payment Center"><Inner /></ClientPortalLayout>;
}