import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminMetrics {
  totalClients: number;
  activeClients: number;
  onboardingClients: number;
  clientsNeedingReview: number;
  portalLinkedClients: number;
  portalUnlinkedClients: number;
  reportsUploaded: number;
  disputesInProgress: number;
  documentsPending: number;
  paymentsPending: number;
  agreementsPending: number;
  totalDebtRemoved: number;
  totalAccountsDeleted: number;
  mortgageReadyClients: number;
  ftcReadyClients: number;
  monthlyRevenue: number;
  loading: boolean;
  error: string | null;
}

const empty: Omit<AdminMetrics, 'loading' | 'error'> = {
  totalClients: 0,
  activeClients: 0,
  onboardingClients: 0,
  clientsNeedingReview: 0,
  portalLinkedClients: 0,
  portalUnlinkedClients: 0,
  reportsUploaded: 0,
  disputesInProgress: 0,
  documentsPending: 0,
  paymentsPending: 0,
  agreementsPending: 0,
  totalDebtRemoved: 0,
  totalAccountsDeleted: 0,
  mortgageReadyClients: 0,
  ftcReadyClients: 0,
  monthlyRevenue: 0,
};

const countHead = async (table: string, build?: (q: any) => any): Promise<number> => {
  try {
    const client: any = supabase;
    let q = client.from(table).select('id', { count: 'exact', head: true });
    if (build) q = build(q);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
};

export function useAdminMetrics(): AdminMetrics & { refresh: () => Promise<void> } {
  const [m, setM] = useState<AdminMetrics>({ ...empty, loading: true, error: null });

  const load = async () => {
    setM((p) => ({ ...p, loading: true, error: null }));
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const tasks: Promise<number>[] = [
        countHead('clients'),
        countHead('clients', (q) => q.eq('status', 'active')),
        countHead('clients', (q) => q.neq('onboarding_status', 'complete')),
        countHead('flagged_disputes', (q) => q.eq('status', 'pending')),
        countHead('dispute_letters', (q) => q.eq('case_status', 'needs_admin_review')),
        countHead('payment_records', (q) => q.eq('payment_status', 'needs_review')),
        countHead('credit_report_uploads'),
        countHead('dispute_cases', (q) => q.in('status', ['intake_received','documents_missing','extracted','validation_passed','draft_generated','needs_admin_review','approved'])),
        countHead('documents'),
        countHead('payment_records', (q) => q.eq('payment_status', 'pending')),
        countHead('client_agreements', (q) => q.is('signed_at', null)),
        countHead('clients', (q) => q.eq('mortgage_readiness_status', 'ready')),
        countHead('clients', (q) => q.eq('ftc_readiness_status', 'ready')),
        countHead('clients', (q) => q.not('user_id', 'is', null)),
        countHead('clients', (q) => q.is('user_id', null)),
      ];
      const r = await Promise.all(tasks);
      const [
        totalClients, activeClients, onboardingClients, flaggedDisputes, disputesNeedReview,
        paymentsNeedsReview, reportsUploaded, disputesInProgress, documentsPending,
        paymentsPending, agreementsPending, mortgageReady, ftcReady,
        portalLinkedClients, portalUnlinkedClients,
      ] = r;

      // Aggregates from clients override fields
      const { data: aggRows } = await supabase
        .from('clients')
        .select('debt_removed_total, accounts_deleted_count');
      const totalDebtRemoved = (aggRows || []).reduce((s: number, r: any) => s + Number(r.debt_removed_total || 0), 0);
      const totalAccountsDeleted = (aggRows || []).reduce((s: number, r: any) => s + Number(r.accounts_deleted_count || 0), 0);

      // Monthly revenue from approved payments
      const { data: paymentsThisMonth } = await supabase
        .from('payment_records')
        .select('payment_amount, approved_at, payment_status')
        .eq('payment_status', 'approved')
        .gte('approved_at', monthStart.toISOString());
      const monthlyRevenue = (paymentsThisMonth || []).reduce((s: number, r: any) => s + Number(r.payment_amount || 0), 0);

      setM({
        ...empty,
        totalClients,
        activeClients,
        onboardingClients,
        clientsNeedingReview: flaggedDisputes + disputesNeedReview + paymentsNeedsReview,
        portalLinkedClients,
        portalUnlinkedClients,
        reportsUploaded,
        disputesInProgress,
        documentsPending,
        paymentsPending,
        agreementsPending,
        totalDebtRemoved,
        totalAccountsDeleted,
        mortgageReadyClients: mortgageReady,
        ftcReadyClients: ftcReady,
        monthlyRevenue,
        loading: false,
        error: null,
      });
    } catch (e: any) {
      setM((p) => ({ ...p, loading: false, error: e?.message ?? 'Failed to load metrics' }));
    }
  };

  useEffect(() => { load(); }, []);

  return { ...m, refresh: load };
}