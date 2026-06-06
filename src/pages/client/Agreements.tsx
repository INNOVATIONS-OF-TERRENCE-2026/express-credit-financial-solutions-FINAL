import { useEffect, useState } from 'react';
import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { LuxuryCard, LuxurySection, EyebrowLabel, EmptyState, StatusBadge } from '@/components/luxury';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCheck2, FileSignature, ShieldCheck } from 'lucide-react';

type AgreementRow = {
  id: string;
  agreement_type?: string | null;
  signed_at?: string | null;
  created_at?: string | null;
  status?: string | null;
};

function getAgreementStatus(row: AgreementRow) {
  if (row.signed_at) return 'Signed';
  if (row.status) return row.status;
  return 'Pending Signature';
}

function Inner() {
  const { clientId, userId } = useClient();
  const [rows, setRows] = useState<AgreementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!clientId && !userId) {
          if (mounted) setRows([]);
          return;
        }

        let q = supabase.from('client_agreements').select('*').order('created_at', { ascending: false });
        q = clientId ? q.eq('client_id', clientId) : q.eq('user_id', userId);
        const { data, error } = await q;
        if (error) throw error;
        if (mounted) setRows((data || []) as AgreementRow[]);
      } catch (error) {
        console.error('Unable to load client agreements:', error);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [clientId, userId]);

  const signedCount = rows.filter((row) => Boolean(row.signed_at)).length;
  const pendingCount = rows.length - signedCount;

  return (
    <div className="space-y-6">
      <LuxurySection
        eyebrow="Agreement Center"
        title="Service Agreements"
        description="View signature status and keep your onboarding documents organized in your secure client portal."
      >
        <></>
      </LuxurySection>

      <div className="grid gap-4 sm:grid-cols-3">
        <LuxuryCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <FileSignature className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <EyebrowLabel>Total Agreements</EyebrowLabel>
              <p className="text-2xl font-black text-foreground">{rows.length}</p>
            </div>
          </div>
        </LuxuryCard>
        <LuxuryCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <EyebrowLabel>Signed</EyebrowLabel>
              <p className="text-2xl font-black text-foreground">{signedCount}</p>
            </div>
          </div>
        </LuxuryCard>
        <LuxuryCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <EyebrowLabel>Pending</EyebrowLabel>
              <p className="text-2xl font-black text-foreground">{pendingCount}</p>
            </div>
          </div>
        </LuxuryCard>
      </div>

      <LuxuryCard className="p-0 overflow-hidden">
        <div className="border-b border-border/60 p-5">
          <h2 className="text-lg font-bold text-foreground">Your Agreements</h2>
          <p className="text-sm text-muted-foreground">
            Signed agreements are retained for service verification and onboarding records.
          </p>
        </div>
        <div className="p-5">
          {loading ? (
            <p className="text-sm text-muted-foreground" role="status">Loading agreements…</p>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No agreements found"
              description="Your agreement records will appear here once they are assigned or signed."
              icon={FileSignature}
            />
          ) : (
            <div className="space-y-3">
              {rows.map((row) => {
                const status = getAgreementStatus(row);
                return (
                  <div key={row.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{row.agreement_type || 'Service Agreement'}</p>
                        <p className="text-sm text-muted-foreground">
                          {row.signed_at
                            ? `Signed ${new Date(row.signed_at).toLocaleDateString()}`
                            : row.created_at
                              ? `Created ${new Date(row.created_at).toLocaleDateString()}`
                              : 'Awaiting signature status'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={row.signed_at ? 'signed' : 'pending'} label={status} />
                        {row.signed_at ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600">Complete</Badge>
                        ) : (
                          <Button size="sm" variant="outline" aria-label="Contact support about pending agreement">
                            Contact Support
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </LuxuryCard>

      <LuxuryCard className="border-amber-500/25 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          Agreement records support service onboarding and compliance-focused workflow documentation. Contact support if an agreement appears missing or pending incorrectly.
        </p>
      </LuxuryCard>
    </div>
  );
}

export default function ClientAgreementsPage() {
  return <ClientPortalLayout title="Agreement Center"><Inner /></ClientPortalLayout>;
}
