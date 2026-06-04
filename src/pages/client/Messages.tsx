import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { ClientNotificationsPanel } from '@/components/ClientNotificationsPanel';
import { useAuth } from '@/hooks/useAuth';

function Inner() {
  const { user } = useAuth();
  if (!user) return null;
  return <ClientNotificationsPanel userId={user.id} />;
}
export default function ClientMessagesPage() {
  return <ClientPortalLayout title="Messages"><Inner /></ClientPortalLayout>;
}