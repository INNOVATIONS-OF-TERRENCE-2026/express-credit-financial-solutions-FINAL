import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function Inner() {
  const { fullName, email } = useClient();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Profile</CardTitle><CardDescription>Contact support to update sensitive fields.</CardDescription></CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p><span className="text-muted-foreground">Name:</span> {fullName || '—'}</p>
        <p><span className="text-muted-foreground">Email:</span> {email || '—'}</p>
      </CardContent>
    </Card>
  );
}
export default function ClientSettingsPage() {
  return <ClientPortalLayout title="Settings"><Inner /></ClientPortalLayout>;
}