/* eslint-disable react-refresh/only-export-components -- Context modules intentionally export provider and hook. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRoles } from './useRoles';

export type PlanType = 'basic' | 'pro' | 'elite' | 'vip';
export type AccessCategory = 'public' | 'authenticated' | 'paid_basic' | 'paid_pro' | 'paid_elite' | 'admin';

interface MembershipContextType {
  planType: PlanType | null;
  paymentStatus: string | null;
  membershipType: string | null;
  expiresAt: string | null;
  activeServices: string[];
  accessCategory: AccessCategory;
  serviceAccessActive: boolean;
  loading: boolean;
  hasAccess: (feature: string) => boolean;
  getRequiredAccess: (feature: string) => AccessCategory;
  refreshMembership: () => Promise<void>;
}

type MembershipState = Pick<
  MembershipContextType,
  'planType' | 'paymentStatus' | 'membershipType' | 'expiresAt' | 'activeServices' | 'accessCategory' | 'serviceAccessActive'
>;

type ProfileMembership = {
  plan_type: string | null;
  payment_status: string | null;
  membership_type: string | null;
  membership_plan?: string | null;
  membership?: string | null;
  expires_at: string | null;
  access_expires_at?: string | null;
  active_services?: string[] | null;
  subscription_status?: string | null;
};

type ClientMembership = {
  membership_plan: string | null;
  payment_status: string | null;
  service_status: string | null;
  access_services_enabled: boolean | null;
};

const CLOSED_STATE: MembershipState = {
  planType: null,
  paymentStatus: 'inactive',
  membershipType: null,
  expiresAt: null,
  activeServices: [],
  accessCategory: 'authenticated',
  serviceAccessActive: false,
};

const PUBLIC_FEATURES = new Set(['landing', 'pricing', 'faq', 'terms', 'privacy']);
const AUTHENTICATED_FEATURES = new Set(['education', 'settings', 'messages']);
const BASIC_FEATURES = new Set(['dashboard', 'payments', 'agreements', 'document-center', 'documents']);
const PRO_FEATURES = new Set(['credit-upload', 'reports', 'dispute-generator', 'disputes']);
const ELITE_FEATURES = new Set(['results', 'credit-building', 'score-tracker', 'data-freeze']);
const ADMIN_FEATURES = new Set(['admin', 'admin-dashboard', 'admin-clients', 'admin-reports', 'admin-documents', 'admin-disputes']);

const ACTIVE_PAYMENT_STATUSES = new Set(['active', 'paid', 'trialing', 'service_enabled', 'current']);
const INACTIVE_PAYMENT_STATUSES = new Set(['inactive', 'expired', 'canceled', 'cancelled', 'past_due', 'unpaid', 'failed']);

const planRank: Record<PlanType, number> = {
  basic: 1,
  pro: 2,
  elite: 3,
  vip: 3,
};

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

function normalizePlanType(...values: Array<string | null | undefined>): PlanType | null {
  const combined = values.map(normalize).filter(Boolean).join(' ');
  if (!combined) return null;
  if (combined.includes('vip') || combined.includes('all exclusive')) return 'vip';
  if (combined.includes('elite') || combined.includes('premium')) return 'elite';
  if (combined.includes('pro') || combined.includes('fast-5') || combined.includes('fast5') || combined.includes('unlimited')) return 'pro';
  if (combined.includes('basic') || combined.includes('gold')) return 'basic';
  return null;
}

function normalizePaymentStatus(...values: Array<string | null | undefined>): string {
  const statuses = values.map(normalize).filter(Boolean);
  const active = statuses.find((status) => ACTIVE_PAYMENT_STATUSES.has(status));
  if (active) return active;
  const inactive = statuses.find((status) => INACTIVE_PAYMENT_STATUSES.has(status));
  if (inactive) return inactive;
  return statuses[0] || 'inactive';
}

function isExpired(expiresAt?: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

function getRequiredAccessForFeature(feature: string): AccessCategory {
  if (PUBLIC_FEATURES.has(feature)) return 'public';
  if (AUTHENTICATED_FEATURES.has(feature)) return 'authenticated';
  if (BASIC_FEATURES.has(feature)) return 'paid_basic';
  if (PRO_FEATURES.has(feature)) return 'paid_pro';
  if (ELITE_FEATURES.has(feature)) return 'paid_elite';
  if (ADMIN_FEATURES.has(feature)) return 'admin';
  return 'paid_basic';
}

function buildMembershipState(profile: ProfileMembership | null, client: ClientMembership | null): MembershipState {
  if (!profile && !client) return CLOSED_STATE;

  const planType = normalizePlanType(
    profile?.plan_type,
    profile?.membership_type,
    profile?.membership_plan,
    profile?.membership,
    client?.membership_plan,
  );

  const paymentStatus = normalizePaymentStatus(
    profile?.payment_status,
    profile?.subscription_status,
    client?.payment_status,
    client?.service_status,
  );

  const membershipType = profile?.membership_type || client?.membership_plan || profile?.membership_plan || profile?.membership || planType;
  const expiresAt = profile?.expires_at || profile?.access_expires_at || null;
  const activeServices = Array.isArray(profile?.active_services) ? profile?.active_services || [] : [];

  const explicitlyEnabled = client?.access_services_enabled === true;
  const activePayment = ACTIVE_PAYMENT_STATUSES.has(paymentStatus);
  const expired = isExpired(expiresAt);
  const serviceAccessActive = Boolean((activePayment || explicitlyEnabled) && planType && !expired);

  const accessCategory: AccessCategory = serviceAccessActive
    ? planType === 'basic'
      ? 'paid_basic'
      : planType === 'pro'
        ? 'paid_pro'
        : 'paid_elite'
    : 'authenticated';

  return {
    planType: serviceAccessActive ? planType : null,
    paymentStatus: serviceAccessActive ? paymentStatus : 'inactive',
    membershipType: serviceAccessActive ? membershipType : expired ? 'expired' : membershipType,
    expiresAt,
    activeServices,
    accessCategory,
    serviceAccessActive,
  };
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const [state, setState] = useState<MembershipState>(CLOSED_STATE);
  const [loading, setLoading] = useState(true);

  const fetchMembership = useCallback(async () => {
    if (!user) {
      setState({ ...CLOSED_STATE, paymentStatus: null, accessCategory: 'public' });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plan_type, payment_status, membership_type, membership_plan, membership, expires_at, access_expires_at, active_services, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle<ProfileMembership>();

      if (profileError) {
        console.error('Error fetching membership profile:', profileError);
        setState(CLOSED_STATE);
        return;
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('membership_plan, payment_status, service_status, access_services_enabled')
        .eq('user_id', user.id)
        .maybeSingle<ClientMembership>();

      if (clientError) {
        console.warn('Client membership lookup failed; preserving profile-only access decision:', clientError);
      }

      const nextState = buildMembershipState(profile || null, client || null);
      setState(nextState);

      if (profile?.membership_type === 'vip_trial' && profile.expires_at && isExpired(profile.expires_at)) {
        await supabase
          .from('profiles')
          .update({ membership_type: 'expired_trial', payment_status: 'inactive' })
          .eq('user_id', user.id);
        setState({ ...CLOSED_STATE, membershipType: 'expired_trial', expiresAt: profile.expires_at });
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      // Security-critical: access must fail closed on lookup/runtime failure.
      setState(CLOSED_STATE);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const getRequiredAccess = useCallback((feature: string): AccessCategory => getRequiredAccessForFeature(feature), []);

  const hasAccess = useCallback((feature: string): boolean => {
    if (!loading && !rolesLoading && isAdmin()) return true;

    const requiredAccess = getRequiredAccessForFeature(feature);
    if (requiredAccess === 'public') return true;
    if (!user) return false;
    if (requiredAccess === 'authenticated') return true;
    if (requiredAccess === 'admin') return false;
    if (!state.serviceAccessActive || !state.planType) return false;

    if (requiredAccess === 'paid_basic') return planRank[state.planType] >= 1;
    if (requiredAccess === 'paid_pro') return planRank[state.planType] >= 2;
    if (requiredAccess === 'paid_elite') return planRank[state.planType] >= 3;

    return false;
  }, [getRequiredAccess, isAdmin, loading, rolesLoading, state.planType, state.serviceAccessActive, user]);

  const refreshMembership = useCallback(async () => {
    await fetchMembership();
  }, [fetchMembership]);

  const value = useMemo(() => ({
    ...state,
    loading: loading || rolesLoading,
    hasAccess,
    getRequiredAccess,
    refreshMembership,
  }), [getRequiredAccess, hasAccess, loading, refreshMembership, rolesLoading, state]);

  return <MembershipContext.Provider value={value}>{children}</MembershipContext.Provider>;
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}
