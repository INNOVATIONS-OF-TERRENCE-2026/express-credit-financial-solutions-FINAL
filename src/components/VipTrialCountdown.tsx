import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useMembership } from '@/hooks/useMembership';
import { useToast } from '@/hooks/use-toast';

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function VipTrialCountdown() {
  const { membershipType, expiresAt, refreshMembership } = useMembership();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (membershipType !== 'vip_trial' || !expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
        setIsExpired(true);
        handleExpiration();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      const totalSeconds = Math.floor(difference / 1000);

      setTimeRemaining({ hours, minutes, seconds, totalSeconds });
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [membershipType, expiresAt]);

  const handleExpiration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user membership to expired
      const { error } = await supabase
        .from('profiles')
        .update({
          membership_type: 'expired_trial',
          payment_status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error expiring VIP trial:', error);
        return;
      }

      // Refresh membership data
      await refreshMembership();

      toast({
        title: "VIP Trial Expired",
        description: "Your 24-hour VIP trial has ended. Upgrade to continue accessing premium features.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error handling expiration:', error);
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/membership';
  };

  // Don't show if not VIP trial
  if (membershipType !== 'vip_trial') return null;

  // Show expired state
  if (isExpired || timeRemaining.totalSeconds <= 0) {
    return (
      <Card className="w-full bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-bold text-red-700">VIP Trial Expired</h3>
              <p className="text-sm text-red-600">Your 24-hour trial has ended. Upgrade to continue accessing premium features.</p>
            </div>
          </div>
          <Button 
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </Card>
    );
  }

  // Determine urgency styling
  const isUrgent = timeRemaining.totalSeconds < 3600; // Less than 1 hour
  const isCritical = timeRemaining.totalSeconds < 600; // Less than 10 minutes

  const bgGradient = isCritical 
    ? "from-red-100 to-orange-100" 
    : isUrgent 
    ? "from-amber-100 to-yellow-100"
    : "from-amber-50 to-yellow-50";

  const borderColor = isCritical 
    ? "border-red-300" 
    : isUrgent 
    ? "border-amber-300"
    : "border-amber-200";

  const textColor = isCritical 
    ? "text-red-700" 
    : isUrgent 
    ? "text-amber-700"
    : "text-amber-600";

  const badgeColor = isCritical 
    ? "bg-red-500" 
    : isUrgent 
    ? "bg-amber-500"
    : "bg-amber-400";

  return (
    <Card className={`w-full bg-gradient-to-r ${bgGradient} ${borderColor} shadow-lg ${isCritical ? 'animate-pulse' : ''}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Clock className={`w-6 h-6 ${textColor}`} />
          <div>
            <div className="flex items-center gap-2">
              <Badge className={`${badgeColor} text-white font-bold animate-pulse`}>
                VIP TRIAL ACTIVE
              </Badge>
              <span className={`text-sm font-medium ${textColor}`}>⏳ Trial Ends In:</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${textColor} tracking-wider`}>
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${textColor} mb-2`}>
            Full access to all premium features
          </p>
          <Button 
            onClick={handleUpgrade}
            variant="outline"
            size="sm"
            className={`border-2 ${borderColor} ${textColor} hover:bg-white/50 font-semibold`}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </Card>
  );
}