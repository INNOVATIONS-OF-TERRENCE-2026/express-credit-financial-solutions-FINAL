import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type PlanType = 'Basic Package' | 'Pro Package' | 'Elite Package' | 'All Exclusive Package';

interface MembershipContextType {
  planType: PlanType | null;
  paymentStatus: string | null;
  loading: boolean;
  hasAccess: (feature: string) => boolean;
  refreshMembership: () => Promise<void>;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembership = async () => {
    if (!user) {
      setPlanType(null);
      setPaymentStatus(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, payment_status')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching membership:', error);
        return;
      }

      if (data) {
        setPlanType(data.plan_type as PlanType);
        setPaymentStatus(data.payment_status);
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
    if (paymentStatus !== 'active') return false;
    
    switch (feature) {
      case 'dashboard':
      case 'education':
        return true; // All plans have access
      
      case 'dispute-generator':
      case 'credit-upload':
        return planType === 'Pro Package' || planType === 'Elite Package' || planType === 'All Exclusive Package';
      
      case 'exclusive-content':
        return planType === 'All Exclusive Package';
      
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
    loading,
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