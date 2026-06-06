import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ClipboardCheck,
  FileSearch,
  FileText,
  Gavel,
  ListChecks,
  LucideIcon,
  ScrollText,
  Wallet,
} from 'lucide-react';
import type { AdminMetrics } from '@/hooks/useAdminMetrics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type QueueItem = {
  label: string;
  count: number;
  to: string;
  icon: LucideIcon;
  tone: 'gold' | 'blue' | 'amber' | 'red' | 'green';
  description: string;
};

const toneClasses: Record<QueueItem['tone'], string> = {
  gold: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  blue: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  amber: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200',
  red: 'border-red-400/30 bg-red-500/10 text-red-200',
  green: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
};

function safeCount(value: number | undefined | null) {
  return Number.isFinite(value || 0) ? value || 0 : 0;
}

export function AdminPriorityActionQueue({ metrics }: { metrics: AdminMetrics }) {
  const items: QueueItem[] = [
    {
      label: 'Payment Issues',
      count: safeCount(metrics.paymentsPending),
      to: '/admin/payments',
      icon: Wallet,
      tone: 'red',
      description: 'Clients with inactive, failed, or pending payment status.',
    },
    {
      label: 'Agreements Pending',
      count: safeCount(metrics.agreementsPending),
      to: '/admin/agreements',
      icon: ScrollText,
      tone: 'amber',
      description: 'Clients who need agreement review or signature completion.',
    },
    {
      label: 'Documents Pending Review',
      count: safeCount(metrics.documentsPending),
      to: '/admin/documents',
      icon: ClipboardCheck,
      tone: 'blue',
      description: 'Identity, address, or support documents awaiting admin action.',
    },
    {
      label: 'Reports Uploaded',
      count: safeCount(metrics.reportsUploaded),
      to: '/admin/reports',
      icon: FileSearch,
      tone: 'gold',
      description: 'Recently uploaded credit reports ready for review.',
    },
    {
      label: 'Disputes In Progress',
      count: safeCount(metrics.disputesInProgress),
      to: '/admin/disputes',
      icon: Gavel,
      tone: 'green',
      description: 'Open dispute workflows that need tracking or next steps.',
    },
  ];

  return (
    <Card className="border-white/10 bg-slate-950/70 shadow-2xl shadow-black/30">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-white">Priority Action Queue</CardTitle>
            <CardDescription className="text-slate-300">
              Daily operational workload across clients, documents, reports, payments, and disputes.
            </CardDescription>
          </div>
          <Badge className="w-fit border-amber-400/40 bg-amber-500/10 text-amber-200">Command Center</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                'group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400',
                toneClasses[item.tone],
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-2xl font-black text-white">{item.count}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-xs text-slate-300">{item.description}</p>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function AdminLifecyclePipeline({ metrics }: { metrics: AdminMetrics }) {
  const stages = [
    { label: 'Registered', count: safeCount(metrics.totalClients), tone: 'bg-slate-700' },
    { label: 'Active', count: safeCount(metrics.activeClients), tone: 'bg-emerald-500' },
    { label: 'Payment Issues', count: safeCount(metrics.paymentsPending), tone: 'bg-red-500' },
    { label: 'Agreement Pending', count: safeCount(metrics.agreementsPending), tone: 'bg-yellow-500' },
    { label: 'Documents Review', count: safeCount(metrics.documentsPending), tone: 'bg-sky-500' },
    { label: 'Disputes Active', count: safeCount(metrics.disputesInProgress), tone: 'bg-amber-500' },
  ];

  return (
    <Card className="border-white/10 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="text-white">Client Pipeline</CardTitle>
        <CardDescription className="text-slate-300">
          Operational stage visibility for the current client book.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {stages.map((stage) => (
            <div key={stage.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', stage.tone)} aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{stage.label}</p>
              </div>
              <p className="mt-3 text-3xl font-black text-white">{stage.count}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminRecentActivityCard() {
  return (
    <Card className="border-white/10 bg-slate-950/70">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
        <CardDescription className="text-slate-300">
          A live activity feed can be wired to your audit/activity tables here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-white">No recent activity source connected yet</p>
          <p className="mt-1 text-sm text-slate-300">
            Connect client activity timeline rows to display uploads, agreements, payments, and dispute changes.
          </p>
          <Button asChild variant="outline" className="mt-4 border-amber-400/40 text-amber-100 hover:bg-amber-500/10">
            <Link to="/admin/activity">
              <ListChecks className="mr-2 h-4 w-4" aria-hidden="true" />
              Open Activity
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminComplianceNotice() {
  return (
    <Card className="border-amber-400/25 bg-amber-500/10">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <FileText className="h-5 w-5 shrink-0 text-amber-200" aria-hidden="true" />
        <div>
          <p className="font-semibold text-amber-100">Compliance-focused workflow</p>
          <p className="text-sm text-amber-50/80">
            Keep client-facing updates focused on credit profile review, document verification, dispute workflow status, and education. Results are not guaranteed and investigation outcomes vary.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Aliases for command center page imports
export const AdminActionQueue = AdminPriorityActionQueue;
export const AdminClientPipeline = AdminLifecyclePipeline;

export function AdminQuickActionCard({
  to,
  label,
  description,
  icon: Icon,
}: {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-400"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-amber-500/10 p-2 text-amber-500">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
    </Link>
  );
}
