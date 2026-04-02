import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link, UserCheck, AlertCircle } from 'lucide-react';

interface UnlinkedProfile {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

interface UnlinkedClient {
  id: string;
  full_name: string;
  email: string | null;
  user_id: string | null;
}

export function UnlinkedAuthAccounts() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UnlinkedProfile[]>([]);
  const [unlinkedClients, setUnlinkedClients] = useState<UnlinkedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkSelections, setLinkSelections] = useState<Record<string, string>>({});
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Get all profiles
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, user_id, email, created_at, first_name, last_name')
      .order('created_at', { ascending: false });

    // Get all clients with their user_ids
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, full_name, email, user_id')
      .order('full_name');

    const linkedUserIds = new Set(
      (allClients || []).filter(c => c.user_id).map(c => c.user_id)
    );
    const linkedEmails = new Set(
      (allClients || []).filter(c => c.email).map(c => c.email?.toLowerCase())
    );

    // Profiles not linked to any client
    const unlinked = (allProfiles || []).filter(p =>
      !linkedUserIds.has(p.user_id) && !linkedEmails.has(p.email?.toLowerCase())
    );

    // Clients without a user_id
    const clientsWithoutUser = (allClients || []).filter(c => !c.user_id);

    setProfiles(unlinked);
    setUnlinkedClients(clientsWithoutUser);
    setLoading(false);
  };

  const linkAccount = async (profileUserId: string, profileEmail: string) => {
    const selectedClientId = linkSelections[profileUserId];
    if (!selectedClientId) {
      toast({ title: 'Select a client', description: 'Please select a client to link', variant: 'destructive' });
      return;
    }

    setLinking(profileUserId);
    const { error } = await supabase.from('clients')
      .update({ user_id: profileUserId, email: profileEmail })
      .eq('id', selectedClientId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Linked!', description: 'Auth account linked to client successfully' });
      await supabase.from('client_timeline' as any).insert({
        client_id: selectedClientId,
        event_type: 'account_linked',
        event_label: `Auth account ${profileEmail} linked by admin`,
      });
      fetchData();
    }
    setLinking(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            Unlinked Auth Accounts ({profiles.length})
          </CardTitle>
          <CardDescription>
            These auth accounts are not linked to any client record. Review and manually link them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-muted-foreground">All auth accounts are linked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map(profile => (
                <div key={profile.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{profile.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.first_name || ''} {profile.last_name || ''} • Joined {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{profile.user_id}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={linkSelections[profile.user_id] || ''}
                      onValueChange={(v) => setLinkSelections(prev => ({ ...prev, [profile.user_id]: v }))}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unlinkedClients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => linkAccount(profile.user_id, profile.email)}
                      disabled={!linkSelections[profile.user_id] || linking === profile.user_id}
                    >
                      <Link className="h-4 w-4 mr-1" />
                      {linking === profile.user_id ? 'Linking...' : 'Link'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {unlinkedClients.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Clients Without Auth Account ({unlinkedClients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unlinkedClients.map(c => (
                <Badge key={c.id} variant="outline" className="text-xs">{c.full_name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
