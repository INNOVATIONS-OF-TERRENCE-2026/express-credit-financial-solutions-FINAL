import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientPortalData {
  loading: boolean;
  client: any | null;
  startingScore: number | null;
  currentScore: number | null;
  scoreChange: number | null;
  accountsDeleted: number;
  debtRemoved: number;
  inquiriesRemoved: number;
  personalInfoRemoved: number;
  remainingNegatives: number;
  currentDisputeRound: number;
  nextStep: string | null;
  reportsCount: number;
  recentReports: Array<{
    id: string;
    file_name: string;
    uploaded_at: string;
    match_status: 'matched' | 'needs_review' | 'failed' | null;
    match_score: number | null;
    match_checked_at: string | null;
    match_error: string | null;
  }>;
  disputesCount: number;
  documentsPendingCount: number;
  agreementsSigned: number;
  agreementsPending: number;
  paymentSummary: any | null;
  latestPayment: {
    id: string;
    payment_amount: number;
    payment_method: string | null;
    payment_status: string;
    submitted_at: string | null;
    reviewed_at: string | null;
  } | null;
  activity: any[];
  refresh: () => Promise<void>;
}

const avg = (...vals: (number | null | undefined)[]) => {
  const nums = vals.map((v) => Number(v)).filter((v) => !Number.isNaN(v) && v > 0);
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
};

export function useClientPortalData(clientId: string | null, userId: string | null): ClientPortalData {
  const [state, setState] = useState<Omit<ClientPortalData, 'refresh'>>({
    loading: true,
    client: null,
    startingScore: null,
    currentScore: null,
    scoreChange: null,
    accountsDeleted: 0,
    debtRemoved: 0,
    inquiriesRemoved: 0,
    personalInfoRemoved: 0,
    remainingNegatives: 0,
    currentDisputeRound: 0,
    nextStep: null,
    reportsCount: 0,
    recentReports: [],
    disputesCount: 0,
    documentsPendingCount: 0,
    agreementsSigned: 0,
    agreementsPending: 0,
    paymentSummary: null,
    latestPayment: null,
    activity: [],
  });

  const load = async () => {
    if (!clientId && !userId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    try {
      const client: any = supabase;
      const clientRow = clientId
        ? (await client.from('clients').select('*').eq('id', clientId).maybeSingle()).data
        : (await client.from('clients').select('*').eq('user_id', userId).maybeSingle()).data;

      const startingScore = avg(clientRow?.starting_score_eq, clientRow?.starting_score_tu, clientRow?.starting_score_ex);
      const currentScore = avg(clientRow?.current_score_eq, clientRow?.current_score_tu, clientRow?.current_score_ex);
      const scoreChange = startingScore != null && currentScore != null ? currentScore - startingScore : null;

      const cid = clientRow?.id ?? clientId;
      const uid = clientRow?.user_id ?? userId;

      const countBy = async (table: string, col: string, val: string | null, extra?: (q: any) => any): Promise<number> => {
        if (!val) return 0;
        try {
          let q = client.from(table).select('id', { count: 'exact', head: true }).eq(col, val);
          if (extra) q = extra(q);
          const { count } = await q;
          return count ?? 0;
        } catch { return 0; }
      };

      const [reportsCount, disputesCount, docsPending, agreementsSigned, agreementsPending] = await Promise.all([
        countBy('credit_report_uploads', 'client_id', cid).then((c) => c || countBy('credit_report_uploads', 'user_id', uid)),
        countBy('dispute_letters', 'client_id', cid).then((c) => c || countBy('dispute_letters', 'user_id', uid)),
        Promise.all([
          countBy('documents', 'client_id', cid).then((c) => c || countBy('documents', 'user_id', uid)),
          countBy('document_archive', 'client_id', cid).then((c) => c || countBy('document_archive', 'user_id', uid)),
        ]).then(([a, b]) => a + b),
        countBy('client_agreements', 'client_id', cid, (q) => q.not('signed_at', 'is', null)),
        countBy('client_agreements', 'client_id', cid, (q) => q.is('signed_at', null)),
      ]);

      const { data: recentReports } = cid
        ? await client
            .from('credit_report_uploads')
            .select('id,file_name,uploaded_at,match_status,match_score,match_checked_at,match_error')
            .eq('client_id', cid)
            .order('uploaded_at', { ascending: false })
            .limit(5)
        : { data: [] };

      let paymentSummary: any = null;
      if (cid) {
        const { data } = await client.from('client_payment_summary').select('*').eq('client_id', cid).maybeSingle();
        paymentSummary = data;
        if (!paymentSummary) {
          const ensured = await client.rpc('ensure_payment_summary', { p_client_id: cid });
          paymentSummary = ensured.data ?? null;
        }
      } else if (uid) {
        const { data } = await client.from('client_payment_summary').select('*').eq('user_id', uid).maybeSingle();
        paymentSummary = data;
      }

      const { data: latestPaymentRow } = uid
        ? await client
            .from('payment_records')
            .select('id,payment_amount,payment_method,payment_status,submitted_at,reviewed_at')
            .eq('user_id', uid)
            .eq('payment_status', 'approved')
            .order('reviewed_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle()
        : { data: null };

      const { data: activity } = cid
        ? await client.from('client_activity_timeline').select('*').eq('client_id', cid).order('created_at', { ascending: false }).limit(20)
        : { data: [] };

      setState({
        loading: false,
        client: clientRow,
        startingScore,
        currentScore,
        scoreChange,
        accountsDeleted: Number(clientRow?.accounts_deleted_count || 0),
        debtRemoved: Number(clientRow?.debt_removed_total || 0),
        inquiriesRemoved: Number(clientRow?.hard_inquiries_removed || 0),
        personalInfoRemoved: Number(clientRow?.personal_info_items_removed || 0),
        remainingNegatives: Number(clientRow?.remaining_negatives || 0),
        currentDisputeRound: Number(clientRow?.current_dispute_round || 0),
        nextStep: clientRow?.next_step_note ?? null,
        reportsCount,
        recentReports: recentReports || [],
        disputesCount,
        documentsPendingCount: docsPending,
        agreementsSigned,
        agreementsPending,
        paymentSummary,
        latestPayment: latestPaymentRow || null,
        activity: activity || [],
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId, userId]);

  return { ...state, refresh: load };
}