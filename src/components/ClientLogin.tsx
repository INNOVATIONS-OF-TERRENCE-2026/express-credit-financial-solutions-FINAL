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
              email_address: email,
              membership_plan: clientName === 'Jadlyn Nicole Starkey' ? 'Basic' : 'Pro',
              date_of_birth: '1990-01-01', // Placeholder - clients can update this later
              phone_number: '000-000-0000', // Placeholder
              ssn: 'encrypted_placeholder' // Placeholder
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-900 to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-yellow-500/5" />
      
      <Card className="w-full max-w-md border-2 border-yellow-600/20 bg-black/90 backdrop-blur-sm shadow-2xl shadow-yellow-500/10">
        <CardHeader className="text-center space-y-4">
          {/* Logo Placeholder */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-xl">EC</span>
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-white">Express Credit & Financial Solutions</CardTitle>
            <p className="text-yellow-400 font-medium text-sm mt-1">Secure Portal</p>
          </div>
          
          <CardDescription className="text-slate-300">
            {isSignUp ? 'Create your account' : 'Welcome to your secure credit restoration portal'}
            <br />
            <span className="font-medium text-yellow-400">{clientName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-yellow-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200 flex items-center gap-2">
                🔒 Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-yellow-500"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-black font-semibold" 
              disabled={loading}
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
          
          {/* Trust Signals */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              🔒 <span>Encrypted & FCRA Compliant</span>
            </div>
            <div className="text-xs text-slate-500">
              SSL Secured • Bank-Level Encryption
            </div>
          </div>
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-yellow-400 hover:text-yellow-300"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </Button>
          </div>
        </CardContent>
        
        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-slate-600">
            Powered by OpenAI GPT + Stripe
          </p>
        </div>
      </Card>
    </div>
  );
}