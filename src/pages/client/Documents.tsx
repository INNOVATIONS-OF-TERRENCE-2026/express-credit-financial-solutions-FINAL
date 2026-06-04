import { useEffect, useState } from 'react';
import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { SecureVerificationUpload } from '@/components/SecureVerificationUpload';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, ShieldCheck } from 'lucide-react';

interface VerificationStatus {
  id_document_url: string | null;
  ssn_document_url: string | null;
  address_document_url: string | null;
  updated_at: string | null;
}

function VerificationStatusCard({ userId }: { userId: string }) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as any)
        .from('client_verification_secure')
        .select('id_document_url, ssn_document_url, address_document_url, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (alive) {
        setStatus(data ?? { id_document_url: null, ssn_document_url: null, address_document_url: null, updated_at: null });
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  const items = [
    { label: 'Photo ID', received: !!status?.id_document_url },
    { label: 'Social Security Card', received: !!status?.ssn_document_url },
    { label: 'Proof of Address', received: !!status?.address_document_url },
  ];
  const receivedCount = items.filter((i) => i.received).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Verification Documents
            </CardTitle>
            <CardDescription>
              {loading
                ? 'Loading…'
                : receivedCount === 3
                ? 'All verification documents received.'
                : `${receivedCount} of 3 received — upload remaining items below.`}
            </CardDescription>
          </div>
          {status?.updated_at && (
            <span className="text-[10px] text-muted-foreground">
              Last update {new Date(status.updated_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.label} className="flex items-center gap-2 text-sm">
              {it.received
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={it.received ? 'text-foreground' : 'text-muted-foreground'}>{it.label}</span>
              {it.received && <span className="ml-auto text-[10px] uppercase tracking-wide text-emerald-500 font-semibold">Received</span>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Inner() {
  const { user } = useAuth();
  useClient();
  if (!user) return null;
  return (
    <div className="space-y-6">
      <VerificationStatusCard userId={user.id} />
      <SecureVerificationUpload userId={user.id} />
    </div>
  );
}

export default function ClientDocumentsPage() {
  return <ClientPortalLayout title="Document Vault"><Inner /></ClientPortalLayout>;
}