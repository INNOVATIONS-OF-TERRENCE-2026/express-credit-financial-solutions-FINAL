import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ClientLogin } from '@/components/ClientLogin';
import { ClientPortal } from '@/components/ClientPortal';
import { supabase } from '@/integrations/supabase/client';
import { useRoles } from '@/hooks/useRoles';

export default function ClientPortals() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      // Admin can access any portal
      if (isAdmin()) {
        // Look up the client by user_id (slug is now user_id)
        const { data: clientData } = await supabase
          .from('clients')
          .select('full_name')
          .eq('user_id', clientSlug)
          .single();

        if (clientData) {
          setClientName(clientData.full_name);
          setIsAuthenticated(true);
        } else {
          // Fallback: check profiles for email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', clientSlug)
            .single();
          setClientName(profile?.email || 'Client');
          setIsAuthenticated(true);
        }
        setLoading(false);
        return;
      }

      // Regular user: only their own portal
      if (clientSlug === user.id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('full_name')
          .eq('user_id', user.id)
          .single();

        setClientName(clientData?.full_name || user.email || 'Client');
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

  if (!clientSlug) {
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
        clientName={clientName || 'Client'}
        onSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return <ClientPortal clientName={clientName || 'Client'} />;
}
