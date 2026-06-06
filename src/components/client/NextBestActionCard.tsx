import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileSignature, Upload, FileText, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import type { ClientPortalData } from '@/hooks/useClientPortalData';
import { cn } from '@/lib/utils';

type Action = {
  icon: typeof Upload;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  to: string;
};

/**
 * Derives the most-pressing next step purely from existing portal data.
 * Never fabricates state — if nothing is pending, falls back to the
 * concierge / education tile.
 */
export function NextBestActionCard({
  data,
  className,
}: {
  data: Pick<ClientPortalData,
    'agreementsPending' | 'agreementsSigned' | 'reportsCount' |
    'documentsPendingCount' | 'paymentSummary' | 'loading'>;
  className?: string;
}) {
  const action = useMemo<Action>(() => {
    if (data.loading) {
      return {
        icon: Sparkles,
        eyebrow: 'Loading',
        title: 'Reviewing your portal',
        body: 'One moment while we pull your latest status.',
        ctaLabel: 'View Dashboard',
        to: '/client/dashboard',
      };
    }
    // Unsigned agreement is highest priority
    if (data.agreementsPending > 0 || data.agreementsSigned === 0) {
      return {
        icon: FileSignature,
        eyebrow: 'Next best step',
        title: 'Sign your service agreement',
        body: 'Review and sign your client agreement so we can begin your credit profile review.',
        ctaLabel: 'Open Agreement',
        to: '/client/agreements',
      };
    }
    // No credit report yet
    if (data.reportsCount === 0) {
      return {
        icon: Upload,
        eyebrow: 'Next best step',
        title: 'Upload your most recent credit report',
        body: 'A full report helps us prepare a compliance-focused dispute strategy for your profile.',
        ctaLabel: 'Upload Credit Report',
        to: '/client/reports',
      };
    }
    // Verification documents missing
    if (data.documentsPendingCount === 0) {
      return {
        icon: FileText,
        eyebrow: 'Next best step',
        title: 'Submit your verification documents',
        body: 'Upload your ID, proof of SSN, and proof of address to complete your secure profile.',
        ctaLabel: 'Open Document Center',
        to: '/client/documents',
      };
    }
    // Nothing actionable
    return {
      icon: BookOpen,
      eyebrow: 'You\'re all caught up',
      title: 'Continue your credit education',
      body: 'While our team works your file, build long-term credit health with curated resources.',
      ctaLabel: 'Visit Education Center',
      to: '/client/messages',
    };
  }, [data]);

  const Icon = action.icon;
  return (
    <div className={cn('relative overflow-hidden rounded-2xl lux-midnight p-6 md:p-8 shadow-elevated', className)}>
      <span aria-hidden className="absolute inset-x-10 top-0 lux-chrome-rule" />
      <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl btn-premium-gold">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="lux-eyebrow text-ivory/60">{action.eyebrow}</p>
          <h3 className="lux-display text-xl md:text-2xl text-ivory mt-1">{action.title}</h3>
          <p className="text-sm md:text-[15px] text-ivory/75 mt-2 max-w-2xl">{action.body}</p>
        </div>
        <Link
          to={action.to}
          className="btn-premium-gold inline-flex items-center justify-center gap-2 rounded-md px-5 h-11 text-sm shrink-0"
        >
          {action.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ivory/55">
        <span className="inline-flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Concierge support</span>
        <span aria-hidden>·</span>
        <span>Secure document submission</span>
        <span aria-hidden>·</span>
        <span>Compliance-focused dispute preparation</span>
      </div>
    </div>
  );
}