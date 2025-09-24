import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function EmailVerificationBanner() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  // Only show if user exists but email is not confirmed
  if (!user || user.email_confirmed_at) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Verification Email Sent",
        description: "Please check your email and click the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You can sign back in after verifying your email.",
    });
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 mb-1">
              Email Verification Required
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              Please verify your email address ({user.email}) to access all features. 
              Check your inbox for a verification link.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={isResending}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                {isResending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {isResending ? 'Sending...' : 'Resend Email'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-yellow-700 hover:bg-yellow-100"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}