import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminMetrics {
  totalClients: number;
  activeClients: number;
  onboardingClients: number;
  clientsNeedingReview: number;
  reportsUploaded: number;
  disputesInProgress: number;
  documentsPending: number;
  paymentsPending: number;
  agreementsPending: number;
  totalDebtRemoved: number;
  totalAccountsDeleted: number;
  mortgageReadyClients: number;
  monthlyRevenue: number;
  loading: boolean;
  error: string | null;
}

const empty: Omit<AdminMetrics, 'loading' | 'error'> = {
  totalClients: 0,
  activeClients: 0,
  onboardingClients: 0,
  clientsNeedingReview: 0,
  reportsUploaded: 0,
  disputesInProgress: 0,
  documentsPending: 0,
  paymentsPending: 0,
  agreementsPending: 0,
  totalDebtRemoved: 0,
  totalAccountsDeleted: 0,
  mortgageReadyClients: 0,
  monthlyRevenue: 0,
};

const countHead = async (q: any): Promise<number> => {
  try {
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

      const [
        totalClients,
        activeClients,
        onboardingClients,
        flaggedDisputes,
        disputesNeedReview,
        paymentsNeedsReview,
        reportsUploaded,
        disputesInProgress,
        documentsPending,
        paymentsPending,
        agreementsPending,
        mortgageReady,
      ] = await Promise.all([
        countHead(supabase.from('clients').select('id', { count: 'exact', head: true })),
        countHead(supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active')),
        countHead(supabase.from('clients').select('id', { count: 'exact', head: true }).neq('onboarding_status', 'complete')),
        countHead(supabase.from('flagged_disputes').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
        countHead(supabase.from('dispute_letters').select('id', { count: 'exact', head: true }).eq('case_status', 'needs_admin_review')),
        countHead(supabase.from('payment_records').select('id', { count: 'exact', head: true }).eq('payment_status', 'needs_review')),
        countHead(supabase.from('credit_report_uploads').select('id', { count: 'exact', head: true })),
        countHead(supabase.from('dispute_cases').select('id', { count: 'exact', head: true }).in('status', ['intake_received','documents_missing','extracted','validation_passed','draft_generated','needs_admin_review','approved'])),
        countHead(supabase.from('document_uploads').select('id', { count: 'exact', head: true }).eq('review_status', 'pending')),
        countHead(supabase.from('payment_records').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending')),
        countHead(supabase.from('client_agreements').select('id', { count: 'exact', head: true }).is('signed_at', null)),
        countHead(supabase.from('clients').select('id', { count: 'exact', head: true }).eq('mortgage_readiness_status', 'ready')),
      ]);

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
        reportsUploaded,
        disputesInProgress,
        documentsPending,
        paymentsPending,
        agreementsPending,
        totalDebtRemoved,
        totalAccountsDeleted,
        mortgageReadyClients: mortgageReady,
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