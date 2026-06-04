import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { ClientPaymentWidget } from '@/components/payments/ClientPaymentWidget';
import { PaymentHistoryList } from '@/components/payments/PaymentHistoryList';

export default function ClientPaymentsPage() {
  return (
    <ClientPortalLayout title="Payments">
      <div className="space-y-4">
        <ClientPaymentWidget />
        <PaymentHistoryList />
      </div>
    </ClientPortalLayout>
  );
}