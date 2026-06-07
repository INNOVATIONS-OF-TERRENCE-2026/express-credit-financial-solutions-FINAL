import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Client-facing case file: negative accounts in active dispute, hard
 * inquiries targeted, and personal-information variations being corrected.
 *
 * Data sources (all client-readable under existing RLS):
 *  - negative accounts  -> dispute_letters (RLS: user owns by user_id)
 *  - hard inquiries      -> client_inquiries_public view (auth.uid()-scoped)
 *  - personal info       -> client_personal_info_public view (auth.uid()-scoped)
 *
 * Nothing here exposes admin-only sources (flagged_disputes is admin-only)
 * or internal notes. No data is invented; empty arrays drive empty states.
 */

export interface CaseNegativeAccount {
  id: string;
  creditorName: string;
  accountType: string | null;
  accountNumberMasked: string | null;
  bureau: string | null;
  status: string | null;
  issueLabel: string | null;
  actionType: string | null;
}

export interface CaseInquiry {
  id: string;
  inquiryName: string;
  bureau: string | null;
  inquiryDate: string | null;
  inquiryType: string | null;
  status: string | null;
  actionState: string | null;
  result: string | null;
  clientNote: string | null;
}

export interface CasePersonalInfo {
  id: string;
  variationType: string;
  reportedValue: string | null;
  bureau: string | null;
  status: string | null;
  correctionState: string | null;
  clientNote: string | null;
}

export interface ClientCaseFile {
  loading: boolean;
  negativeAccounts: CaseNegativeAccount[];
  inquiries: CaseInquiry[];
  personalInfo: CasePersonalInfo[];
  summary: {
    negativeCount: number;
    inquiryCount: number;
    personalInfoCount: number;
  };
  refresh: () => Promise<void>;
}

const maskAccount = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const digits = String(raw).replace(/\s/g, '');
  if (digits.length <= 4) return `••••${digits}`;
  return `••••${digits.slice(-4)}`;
};

const titleize = (s: string | null | undefined): string | null =>
  s ? s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null;

export function useClientCaseFile(clientId: string | null, userId: string | null): ClientCaseFile {
  const [state, setState] = useState<Omit<ClientCaseFile, 'refresh'>>({
    loading: true,
    negativeAccounts: [],
    inquiries: [],
    personalInfo: [],
    summary: { negativeCount: 0, inquiryCount: 0, personalInfoCount: 0 },
  });

  const load = async () => {
    if (!clientId && !userId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    try {
      const sb: any = supabase;

      // 1. Negative accounts — from the client's own dispute letters.
      let negativeAccounts: CaseNegativeAccount[] = [];
      if (userId) {
        const { data } = await sb
          .from('dispute_letters')
          .select('id, creditor_name, account_name, account_number, bureau, issue_type, dispute_reason, case_status, letter_type')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        negativeAccounts = (data || []).map((r: any) => ({
          id: r.id,
          creditorName: r.creditor_name || r.account_name || 'Account',
          accountType: titleize(r.letter_type),
          accountNumberMasked: maskAccount(r.account_number),
          bureau: r.bureau || null,
          status: r.case_status || null,
          issueLabel: titleize(r.issue_type || r.dispute_reason) || null,
          actionType: 'Targeted for correction',
        }));
      }

      // 2. Hard inquiries — auth.uid()-scoped client-safe view.
      const { data: inqRows } = await sb
        .from('client_inquiries_public')
        .select('*')
        .order('inquiry_date', { ascending: false, nullsFirst: false });
      const inquiries: CaseInquiry[] = (inqRows || []).map((r: any) => ({
        id: r.id,
        inquiryName: r.inquiry_name,
        bureau: r.bureau || null,
        inquiryDate: r.inquiry_date || null,
        inquiryType: titleize(r.inquiry_type),
        status: r.status || null,
        actionState: titleize(r.action_state),
        result: r.result || null,
        clientNote: r.client_note || null,
      }));

      // 3. Personal-info variations — auth.uid()-scoped client-safe view.
      const { data: piRows } = await sb
        .from('client_personal_info_public')
        .select('*')
        .order('created_at', { ascending: false });
      const personalInfo: CasePersonalInfo[] = (piRows || []).map((r: any) => ({
        id: r.id,
        variationType: r.variation_type,
        reportedValue: r.reported_value || null,
        bureau: r.bureau || null,
        status: r.status || null,
        correctionState: titleize(r.correction_state),
        clientNote: r.client_note || null,
      }));

      setState({
        loading: false,
        negativeAccounts,
        inquiries,
        personalInfo,
        summary: {
          negativeCount: negativeAccounts.length,
          inquiryCount: inquiries.length,
          personalInfoCount: personalInfo.length,
        },
      });
    } catch (e) {
      console.error('Unable to load client case file:', e);
      setState((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, userId]);

  return { ...state, refresh: load };
}

/** Maps an arbitrary case/progress state to the portal StatusBadge palette. */
export function caseStatusKind(raw: string | null | undefined):
  | 'active' | 'pending' | 'needs-review' | 'completed' | 'in-progress' | 'uploaded' {
  const s = (raw || '').toLowerCase();
  if (/(delete|correct|updat|complete|resolved|removed)/.test(s)) return 'completed';
  if (/(submit|progress|sent)/.test(s)) return 'in-progress';
  if (/(review|escalat|investigat)/.test(s)) return 'needs-review';
  if (/(queue|pending|await|bureau)/.test(s)) return 'pending';
  if (/active/.test(s)) return 'active';
  return 'pending';
}
