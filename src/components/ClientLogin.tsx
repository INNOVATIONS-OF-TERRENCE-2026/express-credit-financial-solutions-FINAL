import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClientLoginProps {
  clientName: string;
  onSuccess: () => void;
}

export function ClientLogin({ clientName, onSuccess }: ClientLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
        if (!result.error) {
          // Create client record after successful signup
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            await supabase.from('clients').upsert({
              user_id: userData.user.id,
              full_name: clientName,
              email: email,
              membership_plan: 'Premium',
              dob: '1990-01-01', // Placeholder - clients can update this later
              phone: '000-000-0000', // Placeholder
              ssn_last4: '0000', // Placeholder
              address: 'Address to be updated' // Required field
            });
          }
        }
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        toast({
          title: 'Authentication Error',
          description: result.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: `Welcome ${clientName}!`,
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center lux-midnight-scene relative overflow-hidden px-4 py-12">
      <div className="w-full max-w-md lux-glass-dark p-8 md:p-10 relative">
        <span aria-hidden className="absolute inset-x-10 top-0 lux-chrome-rule" />
        <div className="text-center space-y-4 mb-6">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center btn-premium-gold">
            <span className="lux-display text-lg leading-none">E</span>
          </div>
          <div>
            <p className="lux-eyebrow text-ivory/60">Client Portal</p>
            <h1 className="lux-display text-2xl text-ivory mt-1">Express Credit &amp; Financial Solutions</h1>
          </div>
          <p className="text-sm text-ivory/70">
            {isSignUp ? 'Create your secure account to begin.' : 'Sign in to your credit repair command center.'}
            <br />
            <span className="font-medium text-gold-soft">{clientName}</span>
          </p>
        </div>
        <div className="space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="lux-label-dark">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="lux-input-dark h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="lux-label-dark">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="lux-input-dark h-11"
              />
            </div>
            <Button type="submit" variant="premium" className="w-full h-11" disabled={loading}>
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="lux-chrome-rule" />

          <div className="text-center space-y-2">
            <p className="text-xs text-ivory/60 tracking-wide">Bank-grade encryption · FCRA-aligned workflow</p>
          </div>
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gold-soft hover:text-gold"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </Button>
          </div>
        </div>
        <div className="text-center pt-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ivory/40">
            Express Credit &amp; Financial Solutions
          </p>
        </div>
      </div>
    </div>
  );
}