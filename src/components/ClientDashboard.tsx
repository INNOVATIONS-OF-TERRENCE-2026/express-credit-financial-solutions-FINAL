import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, TrendingUp, Shield, Star, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SecureVerificationUpload } from './SecureVerificationUpload';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();

  const getMembershipBadge = (tier: string) => {
    switch (tier) {
      case 'setup': return <Badge className="bg-muted text-muted-foreground">Setup Fee</Badge>;
      case 'monthly': return <Badge className="bg-primary/10 text-primary border border-primary/20">Monthly Service</Badge>;
      case 'monitoring': return <Badge className="bg-primary/10 text-primary border border-primary/20">Credit Monitoring</Badge>;
      default: return <Badge className="bg-muted text-muted-foreground">Setup Fee</Badge>;
    }
  };

  const getMembershipFeatures = (tier: string) => {
    switch (tier) {
      case 'setup': return ['One-time setup fee - $349.99', 'Account initialization', 'Initial credit analysis', 'Dispute strategy development'];
      case 'monthly': return ['Monthly service subscription - $99/month', 'Ongoing dispute management', 'Credit report analysis', 'Progress tracking', 'Expert consultation'];
      case 'monitoring': return ['Credit monitoring via Smart‑Credit - $29/month', 'Real-time credit alerts', 'Score tracking', 'Identity monitoring', 'Monthly reports'];
      default: return ['One-time setup fee - $350', 'Account initialization', 'Initial credit analysis'];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Express Credit & Financial Solutions</h1>
                <p className="text-muted-foreground">Client Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-foreground">Welcome, {clientData.name}</p>
                <p className="text-sm text-muted-foreground">{clientData.email}</p>
              </div>
              <Button onClick={onLogout} variant="outline">Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center"><Star className="h-5 w-5 text-primary mr-2" />Membership</CardTitle>
                {getMembershipBadge(clientData.membershipTier)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Plan Features:</h4>
                <ul className="space-y-2">
                  {getMembershipFeatures(clientData.membershipTier).map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-foreground"><div className="w-2 h-2 bg-primary rounded-full mr-2" />{feature}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center"><TrendingUp className="h-5 w-5 text-primary mr-2" />Credit Score</div>
                <Link to="/credit-tracking"><Button variant="outline" size="sm"><BarChart3 className="h-4 w-4 mr-1" />Track</Button></Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="stat-number text-primary mb-2">{clientData.creditScore}</div>
                <div className="flex items-center justify-center mb-3">
                  {clientData.creditScoreChange > 0 ? (
                    <span className="text-green-500 text-sm flex items-center"><TrendingUp className="h-4 w-4 mr-1" />+{clientData.creditScoreChange} this month</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">No change this month</span>
                  )}
                </div>
                <Link to="/credit-tracking"><Button variant="ghost" size="sm" className="w-full text-xs">View Detailed History →</Button></Link>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-hover">
            <CardHeader><CardTitle className="flex items-center"><FileText className="h-5 w-5 text-primary mr-2" />Dispute Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-foreground"><span>Completed</span><span>{clientData.completedDisputes} / {clientData.totalDisputes}</span></div>
                <Progress value={clientData.disputeProgress} className="h-2" />
                <div className="text-sm text-muted-foreground">{clientData.disputeProgress}% Complete</div>
              </div>
            </CardContent>
          </Card>

          {user && <div className="lg:col-span-3"><SecureVerificationUpload userId={user.id} /></div>}

          <Card className="glass-card-hover lg:col-span-2">
            <CardHeader><CardTitle>Document Management</CardTitle><CardDescription>Upload documents for your credit repair process</CardDescription></CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Upload credit reports, bank statements, or other relevant documents</p>
                <Button onClick={onUploadDocument} size="lg"><Upload className="h-4 w-4 mr-2" />Upload Documents</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-foreground">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { color: 'bg-primary', title: 'Dispute Filed', desc: 'Equifax account removed', time: '2 days ago' },
                  { color: 'bg-green-500', title: 'Score Improvement', desc: '+15 point increase', time: '1 week ago' },
                  { color: 'bg-blue-500', title: 'Document Uploaded', desc: 'Credit report processed', time: '2 weeks ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 ${item.color} rounded-full mt-2`} />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-muted-foreground">{item.desc}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
