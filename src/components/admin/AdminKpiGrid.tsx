import { Card } from '@/components/ui/card';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import {
  Users, UserCheck, UserPlus, AlertCircle, FileSearch, Gavel,
  FileText, Wallet, ScrollText, TrendingDown, XCircle, Home, DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const fmtMoney = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function AdminKpiGrid() {
  const m = useAdminMetrics();

  const cards = [
    { label: 'Total Clients',          value: m.totalClients,           icon: Users,        to: '/admin/clients',                     tone: 'text-amber-500' },
    { label: 'Active Clients',         value: m.activeClients,          icon: UserCheck,    to: '/admin/clients?status=active',       tone: 'text-emerald-500' },
    { label: 'Onboarding',             value: m.onboardingClients,      icon: UserPlus,     to: '/admin/clients?status=onboarding',   tone: 'text-blue-500' },
    { label: 'Needs Review',           value: m.clientsNeedingReview,   icon: AlertCircle,  to: '/admin/disputes?status=review',      tone: 'text-rose-500' },
    { label: 'Reports Uploaded',       value: m.reportsUploaded,        icon: FileSearch,   to: '/admin/reports',                     tone: 'text-cyan-500' },
    { label: 'Disputes In Progress',   value: m.disputesInProgress,     icon: Gavel,        to: '/admin/disputes',                    tone: 'text-violet-500' },
    { label: 'Documents Pending',      value: m.documentsPending,       icon: FileText,     to: '/admin/documents?status=pending',    tone: 'text-fuchsia-500' },
    { label: 'Payments Pending',       value: m.paymentsPending,        icon: Wallet,       to: '/admin/payments?status=pending',     tone: 'text-orange-500' },
    { label: 'Agreements Pending',     value: m.agreementsPending,      icon: ScrollText,   to: '/admin/agreements?status=pending',   tone: 'text-yellow-500' },
    { label: 'Debt Removed',           value: fmtMoney(m.totalDebtRemoved), icon: TrendingDown, to: '/admin/clients',                 tone: 'text-emerald-400' },
    { label: 'Accounts Deleted',       value: m.totalAccountsDeleted,   icon: XCircle,      to: '/admin/clients',                     tone: 'text-emerald-300' },
    { label: 'Mortgage Ready',         value: m.mortgageReadyClients,   icon: Home,         to: '/admin/clients?status=mortgage_ready', tone: 'text-amber-400' },
    { label: 'Revenue This Month',     value: fmtMoney(m.monthlyRevenue), icon: DollarSign, to: '/admin/payments?status=approved',    tone: 'text-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Link key={c.label} to={c.to} className="group">
          <Card className="p-4 hover:border-primary/40 hover:shadow-lg transition-all bg-gradient-to-br from-card to-card/60">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <c.icon className={`h-4 w-4 ${c.tone}`} />
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {m.loading ? '—' : c.value}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}