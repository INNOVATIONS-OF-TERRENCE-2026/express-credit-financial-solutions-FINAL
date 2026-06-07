import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { useClient } from '@/contexts/ClientContext';
import { useClientCaseFile } from '@/hooks/useClientCaseFile';
import { NegativeAccountCard } from '@/components/client/NegativeAccountCard';
import { InquiryStatusCard } from '@/components/client/InquiryStatusCard';
import { PersonalInfoVariationCard } from '@/components/client/PersonalInfoVariationCard';
import { LuxuryCard, LuxurySection, EyebrowLabel, EmptyState } from '@/components/luxury';
import { Landmark, Search, UserCog, Loader2, Info, ShieldCheck } from 'lucide-react';

function StatTile({ icon: Icon, label, value, hint }: { icon: any; label: string; value: number; hint: string }) {
  return (
    <LuxuryCard className="p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-midnight text-ivory border border-gold-soft/20">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="lux-display text-2xl text-foreground leading-none tabular-nums">{value}</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mt-1">{label}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{hint}</p>
    </LuxuryCard>
  );
}

function Explainer({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <Info className="h-4 w-4 text-gold-deep shrink-0 mt-0.5" />
      <div>
        <p className="text-[12px] font-semibold text-foreground">{title}</p>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function CaseFileInner() {
  const { clientId, userId } = useClient();
  const { loading, negativeAccounts, inquiries, personalInfo, summary } = useClientCaseFile(clientId, userId);

  if (loading) {
    return (
      <LuxuryCard className="p-10 flex items-center justify-center text-muted-foreground gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your case file…
      </LuxuryCard>
    );
  }

  return (
    <div className="space-y-10 md:space-y-14">
      <LuxuryCard variant="midnight" elevated accent className="p-8 md:p-10">
        <EyebrowLabel withRule>Your Case File</EyebrowLabel>
        <h2 className="lux-display text-3xl md:text-4xl text-ivory mt-3 leading-tight">
          Everything we are actively working on your file
        </h2>
        <p className="text-sm md:text-base text-ivory/75 mt-3 max-w-2xl">
          A precise, organized view of the negative accounts, hard inquiries, and personal-information
          variations our team is targeting across the bureaus. Outcomes depend on investigation results
          and are never guaranteed.
        </p>
        <span className="inline-flex items-center gap-2 text-[11px] text-ivory/65 mt-6">
          <ShieldCheck className="h-3.5 w-3.5" /> Private &amp; confidential to your account
        </span>
      </LuxuryCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile icon={Landmark} label="Negative Accounts" value={summary.negativeCount} hint="Accounts targeted for deletion or correction." />
        <StatTile icon={Search} label="Hard Inquiries" value={summary.inquiryCount} hint="Inquiries targeted for removal or review." />
        <StatTile icon={UserCog} label="Personal Info" value={summary.personalInfoCount} hint="Identity variations targeted for correction." />
      </div>

      <LuxurySection
        eyebrow="Accounts"
        title="Negative accounts targeted"
        description="Each account below is being reviewed and disputed where reporting issues are identified."
      >
        {negativeAccounts.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No accounts in active dispute yet"
            description="Once your specialist reviews your report and opens disputes, the targeted accounts will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {negativeAccounts.map((a) => <NegativeAccountCard key={a.id} account={a} />)}
          </div>
        )}
      </LuxurySection>

      <LuxurySection
        eyebrow="Inquiries"
        title="Hard inquiries targeted"
        description="Unauthorized or questionable inquiries we are working to address."
      >
        {inquiries.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No inquiries on the work queue yet"
            description="Targeted hard inquiries will be listed here as your specialist adds them to your case."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {inquiries.map((i) => <InquiryStatusCard key={i.id} inquiry={i} />)}
          </div>
        )}
      </LuxurySection>

      <LuxurySection
        eyebrow="Identity"
        title="Personal information corrections"
        description="Outdated or inaccurate identity details being corrected across your credit file."
      >
        {personalInfo.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No personal-info variations queued yet"
            description="Name, address, or phone variations targeted for correction will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {personalInfo.map((p) => <PersonalInfoVariationCard key={p.id} item={p} />)}
          </div>
        )}
      </LuxurySection>

      <LuxurySection eyebrow="Guide" title="Understanding your case file" divider={false}>
        <LuxuryCard className="p-6 space-y-4">
          <Explainer title="Negative accounts targeted" body="Accounts with reporting issues we are disputing for accuracy — these may be targeted for deletion, correction, or verification." />
          <Explainer title="Hard inquiries targeted" body="Inquiries that may be unauthorized or inaccurate, which we review and address with the bureaus." />
          <Explainer title="Personal information corrections" body="Old names, addresses, or phone numbers reporting on your file that we work to correct or remove." />
          <Explainer title="Status & progress" body="Each item moves through stages such as queued, under review, submitted, bureau pending, and updated, corrected, or deleted." />
        </LuxuryCard>
      </LuxurySection>
    </div>
  );
}

export default function ClientCaseFilePage() {
  return (
    <ClientPortalLayout title="Case File">
      <CaseFileInner />
    </ClientPortalLayout>
  );
}
