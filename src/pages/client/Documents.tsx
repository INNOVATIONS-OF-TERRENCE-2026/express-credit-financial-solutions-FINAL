import { useEffect, useState } from 'react';
import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { SecureVerificationUpload } from '@/components/SecureVerificationUpload';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, ShieldCheck, FileText, Image as ImageIcon, FileType2, Lock, UploadCloud } from 'lucide-react';
import { LuxuryCard, LuxurySection, EyebrowLabel } from '@/components/luxury';
import { Progress } from '@/components/ui/progress';

interface VerificationStatus {
  id_document_url: string | null;
  ssn_document_url: string | null;
  address_document_url: string | null;
  updated_at: string | null;
}

function VerificationStatusCard({ userId }: { userId: string }) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [otherCount, setOtherCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [verRes, otherRes] = await Promise.all([
        (supabase as any)
          .from('client_verification_secure')
          .select('id_document_url, ssn_document_url, address_document_url, updated_at')
          .eq('user_id', userId)
          .maybeSingle(),
        (supabase as any)
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('doc_type', 'other_supporting'),
      ]);
      if (alive) {
        setStatus(verRes.data ?? { id_document_url: null, ssn_document_url: null, address_document_url: null, updated_at: null });
        setOtherCount(otherRes.count ?? 0);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  const items = [
    { label: 'Government Photo ID', received: !!status?.id_document_url, required: true },
    { label: 'Social Security Card', received: !!status?.ssn_document_url, required: true },
    { label: 'Proof of Current Address', received: !!status?.address_document_url, required: true },
    { label: `Other Supporting Documents${otherCount > 0 ? ` (${otherCount})` : ''}`, received: otherCount > 0, required: false },
  ];
  const requiredReceived = items.filter((i) => i.required && i.received).length;
  const pct = Math.round((requiredReceived / 3) * 100);
  const complete = requiredReceived === 3;

  return (
    <LuxuryCard variant={complete ? 'champagne' : 'default'} elevated accent={complete} className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <EyebrowLabel withRule>
            <ShieldCheck className="h-3 w-3" /> Verification Status
          </EyebrowLabel>
          <h3 className="lux-display text-xl md:text-2xl mt-2 text-foreground">
            {loading
              ? 'Loading vault status…'
              : complete
              ? 'Your vault is fully verified.'
              : `${requiredReceived} of 3 required documents on file`}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {complete
              ? 'All required identity verification documents have been securely received.'
              : 'Complete the remaining uploads below to begin processing your case.'}
          </p>
        </div>
        {status?.updated_at && (
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground whitespace-nowrap">
            Updated · {new Date(status.updated_at).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Verification Progress</span>
          <span className="tabular-nums font-semibold text-foreground">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((it) => (
          <li
            key={it.label}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/60 px-3 py-2.5"
          >
            {it.received
              ? <CheckCircle2 className="h-4 w-4 text-emerald-deep shrink-0" />
              : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
            <span className={`text-sm ${it.received ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {it.label}
            </span>
            <span className="ml-auto text-[10px] uppercase tracking-[0.14em] font-bold">
              {it.received
                ? <span className="text-emerald-deep">Received</span>
                : it.required
                ? <span className="text-amber-600">Required</span>
                : <span className="text-muted-foreground">Optional</span>}
            </span>
          </li>
        ))}
      </ul>
    </LuxuryCard>
  );
}

function FileTypeBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function UploadFlowGuide() {
  const steps = [
    { n: 1, title: 'Choose Document', desc: 'Select the category below: ID, SSN, address, or supporting.' },
    { n: 2, title: 'Drop or Browse', desc: 'Drag your file into the tile or click to pick from your device.' },
    { n: 3, title: 'Secure Encryption', desc: 'Each file is encrypted in transit and at rest before storage.' },
    { n: 4, title: 'Specialist Review', desc: 'Your specialist is notified the moment a new document arrives.' },
  ];
  return (
    <LuxuryCard className="p-6 md:p-7">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <EyebrowLabel withRule>
            <UploadCloud className="h-3 w-3" /> Upload Flow
          </EyebrowLabel>
          <h3 className="lux-display text-xl mt-2 text-foreground">How your documents move through the vault</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FileTypeBadge icon={FileType2} label="PDF" />
          <FileTypeBadge icon={ImageIcon} label="JPG" />
          <FileTypeBadge icon={ImageIcon} label="PNG" />
          <FileTypeBadge icon={Lock} label="Encrypted" />
        </div>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-lg border border-border/50 bg-background/60 p-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-gold text-midnight text-xs font-bold tabular-nums">
              {s.n}
            </span>
            <p className="lux-display text-sm font-semibold mt-3 text-foreground">{s.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
          </li>
        ))}
      </ol>
    </LuxuryCard>
  );
}

function Inner() {
  const { user } = useAuth();
  useClient();
  if (!user) return null;
  return (
    <div className="space-y-10 md:space-y-14">
      <LuxurySection
        eyebrow="Vault Status"
        title="Secure Document Vault"
        description="A private repository for your identity and authorization documents. Bank-grade encryption, specialist-only access."
        divider={false}
      >
        <VerificationStatusCard userId={user.id} />
      </LuxurySection>

      <UploadFlowGuide />

      <LuxurySection
        eyebrow="Upload Center"
        title="Add documents to your vault"
        description="Drag and drop or browse to upload. Files are encrypted before they leave your device."
      >
        <SecureVerificationUpload userId={user.id} />
      </LuxurySection>
    </div>
  );
}

export default function ClientDocumentsPage() {
  return <ClientPortalLayout title="Secure Document Vault"><Inner /></ClientPortalLayout>;
}