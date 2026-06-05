import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { ClientNotificationsPanel } from '@/components/ClientNotificationsPanel';

function Inner() {
  return <ClientNotificationsPanel />;
}
export default function ClientMessagesPage() {
  return <ClientPortalLayout title="Concierge Messages"><Inner /></ClientPortalLayout>;
}