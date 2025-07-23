import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, TrendingUp, Shield, Star } from 'lucide-react';

interface ClientData {
  name: string;
  email: string;
  membershipTier: 'setup' | 'monthly' | 'monitoring';
  disputeProgress: number;
  totalDisputes: number;
  completedDisputes: number;
  creditScore: number;
  creditScoreChange: number;
}

interface ClientDashboardProps {
  clientData: ClientData;
  onUploadDocument: () => void;
  onLogout: () => void;
}

export function ClientDashboard({ clientData, onUploadDocument, onLogout }: ClientDashboardProps) {
  const getMembershipBadge = (tier: string) => {
    switch (tier) {
      case 'setup':
        return <Badge className="status-basic">Setup Fee</Badge>;
      case 'monthly':
        return <Badge className="status-pro">Monthly Service</Badge>;
      case 'monitoring':
        return <Badge className="status-elite">Credit Monitoring</Badge>;
      default:
        return <Badge className="status-basic">Setup Fee</Badge>;
    }
  };

  const getMembershipFeatures = (tier: string) => {
    switch (tier) {
      case 'setup':
        return ['One-time setup fee - $350', 'Account initialization', 'Initial credit analysis', 'Dispute strategy development'];
      case 'monthly':
        return ['Monthly service subscription - $99/month', 'Ongoing dispute management', 'Credit report analysis', 'Progress tracking', 'Expert consultation'];
      case 'monitoring':
        return ['Credit monitoring via Smart‑Credit - $29/month', 'Real-time credit alerts', 'Score tracking', 'Identity monitoring', 'Monthly reports'];
      default:
        return ['One-time setup fee - $350', 'Account initialization', 'Initial credit analysis', 'Dispute strategy development'];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-elegant border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/ba89249e-b0af-422c-81e0-5f107a0f0425.png" 
                alt="Express Credit & Financial Solutions" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">Express Credit & Financial Solutions</h1>
                <p className="text-primary-foreground/80">Client Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-primary-foreground">
                <p className="font-medium">Welcome, {clientData.name}</p>
                <p className="text-sm opacity-80">{clientData.email}</p>
              </div>
              <Button onClick={onLogout} variant="silver">
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
                {getMembershipBadge(clientData.membershipTier)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold">Plan Features:</h4>
                <ul className="space-y-2">
                  {getMembershipFeatures(clientData.membershipTier).map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-accent rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
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
                <div className="text-4xl font-bold text-accent mb-2">
                  {clientData.creditScore}
                </div>
                <div className="flex items-center justify-center">
                  {clientData.creditScoreChange > 0 ? (
                    <span className="text-green-600 text-sm flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{clientData.creditScoreChange} this month
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No change this month
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispute Progress */}
          <Card className="card-elegant hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 text-accent mr-2" />
                Dispute Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span>{clientData.completedDisputes} / {clientData.totalDisputes}</span>
                </div>
                <Progress value={clientData.disputeProgress} className="h-2" />
                <div className="text-sm text-muted-foreground">
                  {clientData.disputeProgress}% Complete
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card className="card-elegant hover-lift lg:col-span-2">
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Upload documents for your credit repair process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Upload credit reports, bank statements, or other relevant documents
                </p>
                <Button onClick={onUploadDocument} variant="gold" size="lg">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2" />
                  <div className="text-sm">
                    <p className="font-medium">Dispute Filed</p>
                    <p className="text-muted-foreground">Equifax account removed</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div className="text-sm">
                    <p className="font-medium">Score Improvement</p>
                    <p className="text-muted-foreground">+15 point increase</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div className="text-sm">
                    <p className="font-medium">Document Uploaded</p>
                    <p className="text-muted-foreground">Credit report processed</p>
                    <p className="text-xs text-muted-foreground">2 weeks ago</p>
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