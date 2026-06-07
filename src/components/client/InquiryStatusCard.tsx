import { LuxuryCard, StatusBadge } from '@/components/luxury';
import { Search } from 'lucide-react';
import { caseStatusKind, type CaseInquiry } from '@/hooks/useClientCaseFile';

/** Premium card for a single hard inquiry being targeted. */
export function InquiryStatusCard({ inquiry }: { inquiry: CaseInquiry }) {
  const date = inquiry.inquiryDate ? new Date(inquiry.inquiryDate).toLocaleDateString() : null;
  return (
    <LuxuryCard className="p-4 transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-champagne text-gold-deep border border-gold-soft/30">
            <Search className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{inquiry.inquiryName}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {[inquiry.bureau || 'Bureau', inquiry.inquiryType, date].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <StatusBadge status={caseStatusKind(inquiry.status)} label={inquiry.actionState || inquiry.status || 'Targeted'} />
      </div>
      {inquiry.clientNote && (
        <p className="mt-3 text-[12px] text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
          {inquiry.clientNote}
        </p>
      )}
    </LuxuryCard>
  );
}
