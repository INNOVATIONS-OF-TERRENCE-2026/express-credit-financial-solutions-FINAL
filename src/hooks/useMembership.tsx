import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRoles } from './useRoles';

export type PlanType = 'basic' | 'pro' | 'elite' | 'vip';

interface MembershipContextType {
  planType: PlanType | null;
  paymentStatus: string | null;
  membershipType: string | null;
  expiresAt: string | null;
  loading: boolean;
  hasAccess: (feature: string) => boolean;
  refreshMembership: () => Promise<void>;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [membershipType, setMembershipType] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembership = async () => {
    if (!user) {
      setPlanType(null);
      setPaymentStatus(null);
      setMembershipType(null);
      setExpiresAt(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, payment_status, membership_type, expires_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching membership:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setPlanType(data.plan_type as PlanType);
        setPaymentStatus(data.payment_status);
        setMembershipType(data.membership_type);
        setExpiresAt(data.expires_at);

        // Auto-expire VIP trials if past expiration
        if (data.membership_type === 'vip_trial' && data.expires_at && new Date(data.expires_at) <= new Date()) {
          await supabase.from('profiles').update({
            membership_type: 'expired_trial',
            payment_status: 'inactive',
          }).eq('user_id', user.id);
          setMembershipType('expired_trial');
          setPaymentStatus('inactive');
        }
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, [user]);

  const hasAccess = (feature: string): boolean => {
    // Admins have access to all features
    if (!loading && !rolesLoading && isAdmin()) return true;

    // VIP trial gets full access until expiration
    if (membershipType === 'vip_trial' && paymentStatus === 'active') return true;

    // Publicly accessible features
    if (['education', 'dashboard', 'credit-building', 'data-freeze'].includes(feature)) return true;

    // Must have active status for gated features
    if (paymentStatus !== 'active') return false;

    switch (feature) {
      case 'dispute-generator':
      case 'credit-upload':
        return ['pro', 'elite', 'vip'].includes(planType || '');
      case 'exclusive-content':
        return ['vip'].includes(planType || '');
      case 'document-center':
        return ['basic', 'pro', 'elite', 'vip'].includes(planType || '');
      default:
        return false;
    }
  };

  const refreshMembership = async () => {
    setLoading(true);
    await fetchMembership();
  };

  const value = {
    planType,
    paymentStatus,
    membershipType,
    expiresAt,
    loading: loading || rolesLoading,
    hasAccess,
    refreshMembership,
  };

  return <MembershipContext.Provider value={value}>{children}</MembershipContext.Provider>;
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}
