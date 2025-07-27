import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DemoUserBannerProps {
  userEmail: string;
}

export function DemoUserBanner({ userEmail }: DemoUserBannerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isDemoUser = userEmail === 'demo@expresscredit.ai';

  const handleResetDemoData = async () => {
    if (!user || !isDemoUser) return;

    try {
      // Clear demo user data
      await Promise.all([
        supabase.from('document_uploads').delete().eq('user_id', user.id),
        supabase.from('dispute_letters').delete().eq('user_id', user.id),
        supabase.from('credit_reports').delete().eq('user_id', user.id),
        supabase.from('client_agreements').delete().eq('user_id', user.id),
        supabase.from('chat_history').delete().eq('user_id', user.id)
      ]);

      // Update demo user record
      await supabase
        .from('demo_users')
        .upsert({
          user_id: user.id,
          is_demo: true,
          demo_data: {},
          last_reset: new Date().toISOString()
        }, { onConflict: 'user_id' });

      toast({
        title: 'Demo Data Reset',
        description: 'All demo data has been cleared. You can start fresh!',
      });

      // Refresh the page to show clean state
      window.location.reload();
    } catch (error) {
      console.error('Error resetting demo data:', error);
      toast({
        title: 'Reset Error',
        description: 'Failed to reset demo data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isDemoUser) return null;

  return (
    <div className="bg-yellow-600 text-black p-4 mb-6 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5" />
        <div>
          <p className="font-semibold">TEST MODE - Demo Account</p>
          <p className="text-sm opacity-90">
            This is a demonstration account. No real data or charges will be processed.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleResetDemoData}
        className="border-black text-black hover:bg-black hover:text-yellow-600"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset Demo Data
      </Button>
    </div>
  );
}