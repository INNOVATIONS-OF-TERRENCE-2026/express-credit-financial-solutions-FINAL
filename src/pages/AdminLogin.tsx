import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: signInError, user: authUser } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Verify admin role from the database (user_roles table) — no hardcoded allow-list.
      if (!authUser) {
        setError('Login session could not be verified. Please try again.');
        return;
      }

      const { data: roleRow, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error('[admin-login] role lookup error:', roleError);
        setError('Unable to verify admin privileges. Please try again.');
        return;
      }

      if (!roleRow) {
        // Clear the non-admin browser session without revoking refresh tokens server-side.
        await supabase.auth.signOut({ scope: 'local' });
        setError('Access denied. This account does not have admin privileges.');
        return;
      }

      toast({
        title: "Welcome Admin",
        description: "Successfully logged into admin dashboard",
      });

      navigate('/admin', { replace: true });
      
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen lux-midnight-scene flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="sr-only">Admin Login</h1>
        <div className="lux-glass-dark p-8 md:p-10 relative">
          <span aria-hidden className="absolute inset-x-10 top-0 lux-chrome-rule" />
          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 btn-premium-gold rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6" />
            </div>
            <p className="lux-eyebrow text-ivory/60">Admin Command Center</p>
            <h2 className="lux-display text-2xl text-ivory">Admin Portal</h2>
            <p className="text-sm text-ivory/70">Express Credit &amp; Financial Solutions</p>
          </div>
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-destructive/15 border-destructive/40 text-ivory">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="lux-label-dark">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@expresscreditfinancials.org"
                  required
                  disabled={isLoading}
                  className="lux-input-dark h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="lux-label-dark">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="lux-input-dark h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-ivory/60 hover:text-ivory"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" variant="premium" className="w-full h-11" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In to Admin'}
              </Button>
            </form>


            <div className="mt-5 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-ivory/60 hover:text-ivory hover:bg-ivory/5"
              >
                ← Back to Main Site
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}