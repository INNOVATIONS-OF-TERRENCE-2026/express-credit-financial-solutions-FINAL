import { ClientPortalLayout } from '@/components/client/ClientPortalLayout';
import { LuxurySection, LuxuryCard, EyebrowLabel, StatusBadge } from '@/components/luxury';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap, Scale, ShieldCheck, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const MODULES = [
  {
    icon: TrendingUp,
    title: 'How Credit Scores Are Calculated',
    body: 'Understand the five factors that drive FICO scoring: payment history (35%), utilization (30%), length of history (15%), credit mix (10%), and new credit (10%).',
    tag: 'Foundations',
  },
  {
    icon: Scale,
    title: 'Your Rights Under the FCRA',
    body: 'The Fair Credit Reporting Act gives you the right to dispute inaccurate items and requires bureaus to investigate within 30 days.',
    tag: 'Consumer Rights',
  },
  {
    icon: ShieldCheck,
    title: 'Reading Your Credit Report',
    body: 'Learn to identify tradelines, public records, inquiries, and personal information — and what each section means for your score.',
    tag: 'Reports',
  },
  {
    icon: BookOpen,
    title: 'Dispute Strategy by Round',
    body: 'Round 1 focuses on accuracy. Round 2 addresses verification. Round 3 may escalate to method-of-verification or regulatory channels.',
    tag: 'Disputes',
  },
  {
    icon: Wallet,
    title: 'Utilization & Healthy Habits',
    body: 'Keep revolving balances under 30% (ideally under 10%) of available credit and let positive payment history compound over time.',
    tag: 'Building Credit',
  },
  {
    icon: GraduationCap,
    title: 'After the Disputes',
    body: 'Maintain progress with on-time payments, low utilization, secured cards or builder loans, and periodic monitoring.',
    tag: 'Long-Term',
  },
];

const FAQS = [
  { q: 'How long does the dispute process take?', a: 'Each round typically runs 30–45 days, allowing bureaus time to investigate and respond.' },
  { q: 'Are results guaranteed?', a: 'No. Outcomes depend on the bureau and furnisher investigation. We provide expert guidance, not guaranteed deletions.' },
  { q: 'How often should I check my credit report?', a: 'We recommend reviewing your report every 30 days during active disputes and quarterly thereafter.' },
  { q: 'Will disputing hurt my score?', a: 'Filing accurate disputes does not lower your score. Removing inaccurate negative items typically helps it.' },
];

function Inner() {
  return (
    <div className="space-y-12">
      <LuxurySection
        eyebrow="Education Center"
        title="Master your credit"
        description="Curated guides written by our credit strategy team to help you understand the system, your rights, and the work happening on your behalf."
        actions={
          <Button asChild variant="outline">
            <Link to="/client/ai-assistant">Ask the AI Concierge<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => (
            <LuxuryCard key={m.title} className="p-6 group hover:border-gold-soft transition-colors">
              <div className="flex items-start justify-between mb-4">
                <span className="h-10 w-10 rounded-xl bg-gradient-champagne grid place-items-center">
                  <m.icon className="h-5 w-5 text-gold-deep" />
                </span>
                <StatusBadge status="basic" label={m.tag} />
              </div>
              <h3 className="lux-display text-lg text-foreground mb-2">{m.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.body}</p>
            </LuxuryCard>
          ))}
        </div>
      </LuxurySection>

      <LuxurySection eyebrow="Frequently Asked" title="Common questions" divider={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FAQS.map((f) => (
            <LuxuryCard key={f.q} className="p-6">
              <EyebrowLabel>Q&amp;A</EyebrowLabel>
              <p className="lux-display text-base text-foreground mt-2">{f.q}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.a}</p>
            </LuxuryCard>
          ))}
        </div>
      </LuxurySection>

      <LuxuryCard variant="midnight" accent className="p-8 text-center">
        <EyebrowLabel className="text-ivory/60">Compliance Notice</EyebrowLabel>
        <p className="lux-display text-xl md:text-2xl text-ivory mt-3 max-w-2xl mx-auto">
          Education only. Not legal or financial advice.
        </p>
        <p className="text-sm text-ivory/70 mt-3 max-w-2xl mx-auto leading-relaxed">
          Results vary by individual and depend on the bureau and furnisher response. For personalized guidance, contact your concierge team via the Messages page.
        </p>
      </LuxuryCard>
    </div>
  );
}

export default function ClientEducationPage() {
  return <ClientPortalLayout title="Education Center"><Inner /></ClientPortalLayout>;
}