import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredFeature: string;
  featureName: string;
}

export function ProtectedRoute({ children, requiredFeature, featureName }: ProtectedRouteProps) {
  const { user } = useAuth();
  const { hasAccess, planType, paymentStatus, loading } = useMembership();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access {featureName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')}
              variant="default" 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess(requiredFeature)) {
    const getUpgradeMessage = () => {
      if (paymentStatus !== 'active') {
        return 'Please activate your membership to access this feature.';
      }
      
      switch (requiredFeature) {
        case 'dispute-generator':
        case 'credit-upload':
          return 'Upgrade to Pro, Elite (Premium Strategy Plan), or All Exclusive package to access this feature.';
        case 'exclusive-content':
          return 'Upgrade to All Exclusive package to access this feature.';
        default:
          return 'This feature requires a higher membership level.';
      }
    };

    const getIcon = () => {
      switch (requiredFeature) {
        case 'exclusive-content':
          return <Crown className="h-12 w-12 text-primary mx-auto mb-4" />;
        default:
          return <Star className="h-12 w-12 text-primary mx-auto mb-4" />;
      }
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {getIcon()}
            <CardTitle>Upgrade Required</CardTitle>
            <CardDescription>
              {getUpgradeMessage()}
            </CardDescription>
            {planType && (
              <p className="text-sm text-muted-foreground mt-2">
                Current plan: {planType}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate('/membership')}
              variant="default" 
              className="w-full"
            >
              View Membership Plans
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline" 
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}