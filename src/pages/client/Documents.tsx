import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { SecureVerificationUpload } from '@/components/SecureVerificationUpload';
import { useAuth } from '@/hooks/useAuth';

function Inner() {
  const { user } = useAuth();
  useClient();
  if (!user) return null;
  return <SecureVerificationUpload userId={user.id} />;
}
export default function ClientDocumentsPage() {
  return <ClientPortalLayout title="Documents"><Inner /></ClientPortalLayout>;
}