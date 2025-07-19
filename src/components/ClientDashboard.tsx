import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, LogOut, FileText, TrendingUp, Target, Clock, Shield, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ClientDashboardProps {
  onUploadDocument: () => void;
}

export function ClientDashboard({ onUploadDocument }: ClientDashboardProps) {
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    }
  };

  if (!profile) return null;

  const getMembershipColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-secondary text-secondary-foreground';
      case 'pro': return 'bg-accent text-accent-foreground';
      case 'elite': return 'bg-primary text-primary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getMembershipBadge = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Badge className="status-basic">Basic Plan</Badge>;
      case 'pro':
        return <Badge className="status-pro">Pro Plan</Badge>;
      case 'elite':
        return <Badge className="status-elite">Elite Plan</Badge>;
      default:
        return <Badge className="status-basic">Basic Plan</Badge>;
    }
  };

  const getMembershipFeatures = (tier: string) => {
    switch (tier) {
      case 'basic':
        return ['Basic credit analysis', 'Monthly credit reports', 'Email support'];
      case 'pro':
        return ['Advanced credit analysis', 'Weekly credit reports', 'Priority support', 'Dispute tracking'];
      case 'elite':
        return ['Premium credit analysis', 'Daily credit monitoring', '24/7 phone support', 'Personal credit advisor', 'Guaranteed results'];
      default:
        return ['Basic credit analysis', 'Monthly credit reports', 'Email support'];
    }
  };

  // Mock data for now - will be replaced with real data from Supabase
  const mockData = {
    disputeProgress: 75,
    totalDisputes: 8,
    completedDisputes: 6,
    creditScore: 680,
    creditScoreChange: 25
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-elegant border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-accent" />
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">Express Credit & Financial Solutions</h1>
                <p className="text-primary-foreground/80">Client Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-primary-foreground">
                <p className="font-medium">Welcome, {profile.full_name || 'Client'}</p>
                <p className="text-sm opacity-80">{user?.email}</p>
              </div>
              <Button onClick={handleLogout} variant="silver">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Membership Status */}
          <Card className="card-premium hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 text-accent mr-2" />
                  Membership Status
                </CardTitle>
                {getMembershipBadge(profile.membership_tier || 'basic')}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold">Plan Features:</h4>
                <ul className="space-y-2">
                  {getMembershipFeatures(profile.membership_tier || 'basic').map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-accent rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Dispute Progress */}
          <Card className="card-elegant hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 text-accent mr-2" />
                Dispute Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium">{mockData.disputeProgress}%</span>
                  </div>
                  <Progress value={mockData.disputeProgress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{mockData.completedDisputes}</div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{mockData.totalDisputes}</div>
                    <p className="text-xs text-muted-foreground">Total Disputes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Score */}
          <Card className="card-elegant hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 text-accent mr-2" />
                Credit Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{mockData.creditScore}</div>
                <div className="flex items-center justify-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">+{mockData.creditScoreChange} this month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Upload Documents */}
          <Card className="card-elegant hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 text-accent mr-2" />
                Document Upload
              </CardTitle>
              <CardDescription>
                Upload your credit reports, bank statements, and other important documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop files here or click to browse
                  </p>
                  <Button onClick={onUploadDocument} variant="gold" size="lg">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="card-elegant hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 text-accent mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates on your credit repair journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium">Credit report analyzed</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium">Dispute letter sent to Equifax</p>
                    <p className="text-xs text-muted-foreground">5 days ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium">Account verification completed</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}