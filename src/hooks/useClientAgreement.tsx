import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useClientAgreement() {
  const [hasSignedAgreement, setHasSignedAgreement] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const checkAgreementStatus = async () => {
    if (!user) {
      setHasSignedAgreement(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_agreements')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking agreement status:', error);
        setHasSignedAgreement(false);
      } else {
        setHasSignedAgreement(!!data);
      }
    } catch (error) {
      console.error('Error checking agreement status:', error);
      setHasSignedAgreement(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAgreementStatus();
  }, [user]);

  const refetchAgreementStatus = () => {
    setLoading(true);
    checkAgreementStatus();
  };

  return {
    hasSignedAgreement,
    loading,
    refetchAgreementStatus
  };
}