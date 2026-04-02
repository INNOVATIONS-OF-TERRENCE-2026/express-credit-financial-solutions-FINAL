import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ClientPortal } from '@/components/ClientPortal';
import { useRoles } from '@/hooks/useRoles';
import { useAuth } from '@/hooks/useAuth';
import { resolveClient } from '@/lib/resolveClient';
import { ArrowLeft, Shield, Eye, Pencil } from 'lucide-react';

export default function AdminClientPreview() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const { user } = useAuth();

  const [clientName, setClientName] = useState<string>('Client');
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    if (!rolesLoading && !isAdmin()) {
      navigate('/');
      return;
    }
    if (isAdmin() && clientId) {
      doResolve();
    }
  }, [isAdmin, rolesLoading, clientId]);

  const doResolve = async () => {
    if (!clientId) return;
    try {
      const resolved = await resolveClient(clientId);
      if (resolved) {
        setClientName(resolved.fullName);
        setResolvedId(resolved.clientId);
        setFound(true);
      } else {
        setFound(false);
      }
    } catch (err) {
      console.error('Error resolving client:', err);
      setFound(false);
    } finally {
      setLoading(false);
    }
  };

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2" />
          <p className="text-muted-foreground">Loading client portal preview...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">Return Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!found || !resolvedId) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Client Not Found</CardTitle>
              <CardDescription>Could not locate a client record for this ID.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/admin/clients')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />Back to Clients
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin preview banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-500">Admin Preview Mode</span>
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">{clientName}</Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/clients/${resolvedId}`)}>
              <Pencil className="h-3 w-3 mr-1" />Edit Client
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/admin/clients')}>
              <ArrowLeft className="h-3 w-3 mr-1" />Back
            </Button>
          </div>
        </div>
      </div>

      {/* Render the actual ClientPortal in admin preview mode */}
      <ClientPortal clientName={clientName} resolvedClientId={resolvedId} isAdminPreview={true} />
    </div>
  );
}
