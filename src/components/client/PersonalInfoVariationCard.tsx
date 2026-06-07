import { LuxuryCard, StatusBadge } from '@/components/luxury';
import { UserCog, MapPin, Phone, Briefcase, Contact } from 'lucide-react';
import { caseStatusKind, type CasePersonalInfo } from '@/hooks/useClientCaseFile';

const ICONS: Record<string, typeof UserCog> = {
  name: UserCog,
  address: MapPin,
  phone: Phone,
  employer: Briefcase,
};

/** Premium card for a personal-information variation under correction. */
export function PersonalInfoVariationCard({ item }: { item: CasePersonalInfo }) {
  const key = (item.variationType || '').toLowerCase();
  const Icon = ICONS[key] ?? Contact;
  const typeLabel = item.variationType
    ? item.variationType.replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Identity';
  return (
    <LuxuryCard className="p-4 transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-platinum/40 text-foreground border border-platinum-2/50">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{typeLabel} Variation</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {[item.reportedValue, item.bureau].filter(Boolean).join(' · ') || 'Reported across your file'}
            </p>
          </div>
        </div>
        <StatusBadge status={caseStatusKind(item.status)} label={item.correctionState || item.status || 'Targeted'} />
      </div>
      {item.clientNote && (
        <p className="mt-3 text-[12px] text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
          {item.clientNote}
        </p>
      )}
    </LuxuryCard>
  );
}
