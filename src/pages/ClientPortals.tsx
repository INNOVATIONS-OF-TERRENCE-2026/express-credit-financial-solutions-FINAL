import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ClientLogin } from '@/components/ClientLogin';
import { ClientPortal } from '@/components/ClientPortal';
import { supabase } from '@/integrations/supabase/client';
import { useRoles } from '@/hooks/useRoles';
import { resolveClient } from '@/lib/resolveClient';

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function ClientPortals() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(null);
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
      const resolved = await resolveClient(clientSlug);

      // Admin can access any portal
      if (isAdmin()) {
        if (resolved) {
          setClientName(resolved.fullName);
          setResolvedClientId(resolved.clientId);
          setIsAuthenticated(true);
        } else {
          // Fallback: check profiles table for email display
          if (isUUID(clientSlug)) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('user_id', clientSlug)
              .single();
            setClientName(profile?.email || 'Client');
          } else {
            setClientName('Client');
          }
          setResolvedClientId(null);
          setIsAuthenticated(true);
        }
        setLoading(false);
        return;
      }

      // Regular user: can access their own portal
      if (resolved && (resolved.userId === user.id || clientSlug === user.id)) {
        setClientName(resolved.fullName || user.email || 'Client');
        setResolvedClientId(resolved.clientId);
        setIsAuthenticated(true);
      } else if (clientSlug === user.id) {
        // User has auth account but no client record yet
        setClientName(user.email || 'Client');
        setResolvedClientId(null);
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
        onSuccess={() => checkAuthentication()}
      />
    );
  }

  return <ClientPortal clientName={clientName || 'Client'} resolvedClientId={resolvedClientId} />;
}
