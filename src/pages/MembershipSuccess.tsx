import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Crown } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useMembership } from "@/hooks/useMembership";

export default function MembershipSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshMembership, planType, paymentStatus, loading } = useMembership();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Refresh membership data and wait for it to load
    const loadMembership = async () => {
      await refreshMembership();
      // Wait a bit for webhook to process
      setTimeout(() => {
        setChecking(false);
      }, 2000);
    };
    loadMembership();
  }, [refreshMembership]);

  const getMembershipIcon = () => {
    if (planType?.includes('Exclusive')) return <Crown className="w-10 h-10 text-yellow-500" />;
    if (planType?.includes('Elite')) return <Sparkles className="w-10 h-10 text-purple-500" />;
    return <CheckCircle className="w-10 h-10 text-green-500" />;
  };

  const getMembershipBadgeColor = () => {
    if (planType?.includes('Exclusive')) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (planType?.includes('Elite')) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (planType?.includes('Pro')) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (planType?.includes('Fast-5') || planType?.includes('Unlimited')) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    return 'bg-gradient-to-r from-gray-500 to-slate-500';
  };

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Activating your membership...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center border-2 shadow-lg">
            <CardHeader className="space-y-4">
              <div className="mx-auto mb-4 w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center animate-bounce">
                {getMembershipIcon()}
              </div>
              <CardTitle className="text-3xl text-foreground font-bold">
                🎉 Payment Successful!
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Welcome to Express Credit Financials!
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Membership Status Badge */}
              {planType && paymentStatus === 'active' && (
                <div className={`${getMembershipBadgeColor()} text-white py-4 px-6 rounded-lg shadow-lg`}>
                  <p className="text-sm font-medium opacity-90">Your Active Membership</p>
                  <p className="text-2xl font-bold mt-1">{planType}</p>
                  <p className="text-xs mt-2 opacity-80">Status: ✓ Active & Unlocked</p>
                </div>
              )}

              {/* Session ID */}
              {sessionId && (
                <div className="text-xs text-muted-foreground bg-muted/50 py-2 px-4 rounded">
                  Transaction ID: {sessionId.slice(-12)}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={() => navigate('/')} 
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  Access Your Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dispute-center')} 
                  className="w-full h-12"
                  size="lg"
                >
                  Start Credit Disputes
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/membership')} 
                  className="w-full"
                >
                  View All Features
                </Button>
              </div>
              
              {/* Success Message */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  ✓ Your account has been upgraded and all premium features are now unlocked.
                </p>
                {planType && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You now have access to all {planType} benefits including AI-powered dispute generation, 
                    credit analysis, and priority support.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}