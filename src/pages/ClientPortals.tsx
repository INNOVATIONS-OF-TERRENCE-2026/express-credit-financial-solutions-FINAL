import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ClientLogin } from '@/components/ClientLogin';
import { ClientPortal } from '@/components/ClientPortal';
import { supabase } from '@/integrations/supabase/client';

const CLIENT_NAMES = {
  melvin: 'Melvin Earl Milliner Jr.',
  phoebe: 'Phoebe Thomas',
  jadlyn: 'Jadlyn Nicole Starkey'
} as const;

export default function ClientPortals() {
  const { clientSlug } = useParams<{ clientSlug: keyof typeof CLIENT_NAMES }>();
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const clientName = clientSlug ? CLIENT_NAMES[clientSlug] : null;

  useEffect(() => {
    checkAuthentication();
  }, [user, clientSlug]);

  const checkAuthentication = async () => {
    if (!user || !clientSlug) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      // Check if the authenticated user matches this client
      const { data: clientData } = await supabase
        .from('clients')
        .select('full_name, user_id')
        .eq('user_id', user.id)
        .single();

      if (clientData && clientData.full_name === CLIENT_NAMES[clientSlug]) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (!clientSlug || !clientName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Client Not Found</h1>
          <p className="text-muted-foreground">Invalid client portal URL.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ClientLogin 
        clientName={clientName} 
        onSuccess={() => setIsAuthenticated(true)} 
      />
    );
  }

  return <ClientPortal clientName={clientName} />;
}