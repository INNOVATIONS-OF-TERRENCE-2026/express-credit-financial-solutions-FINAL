import { FileText, IdCard, Receipt, Home, Briefcase, ScrollText, Clock } from 'lucide-react';
import { LuxuryCard, EyebrowLabel } from '@/components/luxury';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { key: 'credit-reports',  label: 'Credit Reports',    icon: FileText,   to: '/client/reports',    hint: 'Tri-bureau credit files' },
  { key: 'identity',        label: 'Identity Documents',icon: IdCard,     to: '/client/documents',  hint: 'ID, SSN, photo verification' },
  { key: 'utility',         label: 'Utility Bills',     icon: Receipt,    to: '/client/documents',  hint: 'Proof of address' },
  { key: 'mortgage',        label: 'Mortgage Documents',icon: Home,       to: '/client/documents',  hint: 'Pre-approval & funding' },
  { key: 'funding',         label: 'Funding Documents', icon: Briefcase,  to: '/client/documents',  hint: 'Business & SBA prep' },
  { key: 'agreements',      label: 'Signed Agreements', icon: ScrollText, to: '/client/agreements', hint: 'Engagement & disclosures' },
  { key: 'recent',          label: 'Recent Uploads',    icon: Clock,      to: '/client/documents',  hint: 'Latest activity in vault' },
];

/**
 * Private banking style category grid for the Secure Client Vault.
 * Acts as the visual entrypoint; the existing browser still handles search.
 */
export function VaultCategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {CATEGORIES.map((c) => (
        <Link key={c.key} to={c.to} className="group">
          <LuxuryCard className="p-5 h-full flex flex-col gap-3 transition-all group-hover:border-gold-deep/40 group-hover:shadow-elevated">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-champagne/60 to-ivory-2 text-midnight border border-gold-deep/20">
              <c.icon className="h-5 w-5" />
            </span>
            <div>
              <EyebrowLabel>{c.key === 'recent' ? 'Latest' : 'Category'}</EyebrowLabel>
              <p className="lux-display text-base text-foreground leading-tight mt-1">{c.label}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{c.hint}</p>
            </div>
          </LuxuryCard>
        </Link>
      ))}
    </div>
  );
}