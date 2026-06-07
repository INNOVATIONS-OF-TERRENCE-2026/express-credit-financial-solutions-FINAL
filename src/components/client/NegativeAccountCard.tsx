import { LuxuryCard, StatusBadge } from '@/components/luxury';
import { Landmark } from 'lucide-react';
import { caseStatusKind, type CaseNegativeAccount } from '@/hooks/useClientCaseFile';

/**
 * Premium account-level card for a negative account being worked.
 * Displays only client-safe fields (account number is pre-masked).
 */
export function NegativeAccountCard({ account }: { account: CaseNegativeAccount }) {
  return (
    <LuxuryCard className="p-5 transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-midnight text-ivory border border-gold-soft/20">
            <Landmark className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{account.creditorName}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {[account.accountType, account.accountNumberMasked].filter(Boolean).join(' · ') || 'Account on file'}
            </p>
          </div>
        </div>
        <StatusBadge status={caseStatusKind(account.status)} label={account.status ? titleize(account.status) : 'Queued'} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        <Field label="Bureau" value={account.bureau || 'Multi-bureau'} />
        <Field label="Action" value={account.actionType || 'Under review'} />
        <div className="col-span-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">Issue Identified</p>
          {account.issueLabel ? (
            <span className="inline-flex items-center rounded-md border border-gold-soft/30 bg-gold-soft/10 px-2 py-0.5 text-[11px] font-medium text-gold-deep">
              {account.issueLabel}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">Under review</span>
          )}
        </div>
      </div>
    </LuxuryCard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{label}</p>
      <p className="text-foreground font-medium truncate">{value}</p>
    </div>
  );
}

function titleize(s: string) {
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
