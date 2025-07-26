import { useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Banknote, Link as LinkIcon, CheckCircle } from 'lucide-react';

interface BankLink {
  id: string | number;
  institution_name?: string;
  account_type?: string;
  created_at: string;
}

export function PlaidBankLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [bankLinks, setBankLinks] = useState<BankLink[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createLinkToken = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-plaid-link-token');
      
      if (error) throw error;
      
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error creating link token:', error);
      toast({
        title: "Error",
        description: "Failed to initialize Plaid connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      setLoading(true);
      
      // Exchange public token for access token
      const { data, error } = await supabase.functions.invoke('exchange-plaid-token', {
        body: {
          public_token,
          institution: metadata.institution,
          accounts: metadata.accounts
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "✅ Bank Account Linked Successfully (Sandbox Test)",
      });

      // Refresh bank links
      await fetchBankLinks();
    } catch (error) {
      console.error('Error exchanging token:', error);
      toast({
        title: "Error",
        description: "Failed to link bank account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onEvent: (eventName, metadata) => {
      console.log('Plaid event:', eventName, metadata);
    },
    onExit: (err, metadata) => {
      console.log('Plaid exit:', err, metadata);
      setLoading(false);
    },
  });

  const fetchBankLinks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bank_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankLinks(data || []);
    } catch (error) {
      console.error('Error fetching bank links:', error);
    }
  }, []);

  const handleConnect = async () => {
    if (!linkToken) {
      await createLinkToken();
    }
    if (ready) {
      open();
    }
  };

  // Load existing bank links on mount
  useState(() => {
    fetchBankLinks();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Connect Bank Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Securely connect your bank account using Plaid's sandbox environment for testing.
          </p>
          
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2"
            size="lg"
          >
            <LinkIcon className="h-4 w-4" />
            {loading ? 'Connecting...' : 'Connect Bank Account'}
          </Button>
          
          {linkToken && !ready && (
            <p className="text-sm text-muted-foreground">
              Initializing secure connection...
            </p>
          )}
        </div>

        {bankLinks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Connected Accounts</h3>
            <div className="space-y-2">
              {bankLinks.map((link) => (
                <div
                  key={String(link.id)}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">
                        {link.institution_name || 'Bank Account'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {link.account_type} • Connected {new Date(link.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Sandbox</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Sandbox Testing:</p>
          <p>
            This is a test environment. Use demo credentials like "First Platypus Bank" 
            to test the connection. Real bank data is not accessed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}