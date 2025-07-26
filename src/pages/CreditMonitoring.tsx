import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { NavigationHeader } from '@/components/NavigationHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Plus, Eye, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface CreditScore {
  id: string;
  credit_score: number;
  score_provider: string;
  score_date: string;
  previous_score: number;
  score_change: number;
  created_at: string;
}

interface CreditAlert {
  id: string;
  alert_type: string;
  alert_title: string;
  alert_description: string;
  severity: string;
  is_read: boolean;
  alert_data: any;
  created_at: string;
}

interface ApiCredentials {
  id: string;
  api_provider: string;
  api_key: string;
  is_active: boolean;
  last_sync: string;
}

export function CreditMonitoring() {
  const [creditScores, setCreditScores] = useState<CreditScore[]>([]);
  const [creditAlerts, setCreditAlerts] = useState<CreditAlert[]>([]);
  const [apiCredentials, setApiCredentials] = useState<ApiCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddCredentials, setShowAddCredentials] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const { toast } = useToast();

  const [newCredentials, setNewCredentials] = useState({
    provider: '',
    apiKey: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch credit scores
      const { data: scores, error: scoresError } = await supabase
        .from('credit_monitoring')
        .select('*')
        .eq('user_id', user.id)
        .order('score_date', { ascending: false });

      if (scoresError) throw scoresError;
      setCreditScores(scores || []);

      // Fetch alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('credit_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;
      setCreditAlerts(alerts || []);

      // Fetch API credentials
      const { data: credentials, error: credError } = await supabase
        .from('credit_api_credentials')
        .select('*')
        .eq('user_id', user.id);

      if (credError) throw credError;
      setApiCredentials(credentials || []);

    } catch (error) {
      console.error('Error fetching credit monitoring data:', error);
      toast({
        title: "Error",
        description: "Failed to load credit monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async (provider: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-credit-data', {
        body: { provider, forceRefresh: true }
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: data.message,
      });

      await fetchData();
    } catch (error) {
      console.error('Error syncing credit data:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync credit data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('credit_api_credentials')
        .insert({
          user_id: user.id,
          api_provider: newCredentials.provider,
          api_key: newCredentials.apiKey,
          username: newCredentials.username || null,
          password: newCredentials.password || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "API credentials added successfully",
      });

      setNewCredentials({ provider: '', apiKey: '', username: '', password: '' });
      setShowAddCredentials(false);
      await fetchData();
    } catch (error) {
      console.error('Error adding credentials:', error);
      toast({
        title: "Error",
        description: "Failed to add API credentials",
        variant: "destructive",
      });
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('credit_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      
      setCreditAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 670) return 'text-blue-600';
    if (score >= 580) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlertSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[severity as keyof typeof colors] || colors.medium}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getScoreRange = (score: number) => {
    if (score >= 750) return 'Excellent';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  };

  // Prepare chart data
  const chartData = creditScores
    .filter(score => {
      const scoreDate = new Date(score.score_date);
      const cutoffDate = new Date();
      
      if (selectedTimeframe === '3months') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
      } else if (selectedTimeframe === '6months') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      } else {
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      }
      
      return scoreDate >= cutoffDate;
    })
    .reverse()
    .map(score => ({
      date: format(new Date(score.score_date), 'MMM dd'),
      [score.score_provider]: score.credit_score
    }));

  // Get latest scores for each provider
  const latestScores = creditScores.reduce((acc, score) => {
    if (!acc[score.score_provider] || new Date(score.score_date) > new Date(acc[score.score_provider].score_date)) {
      acc[score.score_provider] = score;
    }
    return acc;
  }, {} as Record<string, CreditScore>);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading credit monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Credit Monitoring</h1>
              <p className="text-muted-foreground mt-2">
                Track your credit scores, monitor changes, and stay alert to important updates
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={showAddCredentials} onOpenChange={setShowAddCredentials}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add API Credentials
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Credit Monitoring API Credentials</DialogTitle>
                    <DialogDescription>
                      Add your IdentityIQ or Credit Hero API credentials to enable automatic credit monitoring
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCredentials} className="space-y-4">
                    <div>
                      <Label htmlFor="provider">API Provider</Label>
                      <Select value={newCredentials.provider} onValueChange={(value) => 
                        setNewCredentials(prev => ({ ...prev, provider: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select API provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="identityiq">IdentityIQ</SelectItem>
                          <SelectItem value="credit_hero">Credit Hero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={newCredentials.apiKey}
                        onChange={(e) => 
                          setNewCredentials(prev => ({ ...prev, apiKey: e.target.value }))
                        }
                        placeholder="Enter your API key"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username (Optional)</Label>
                      <Input
                        id="username"
                        value={newCredentials.username}
                        onChange={(e) => 
                          setNewCredentials(prev => ({ ...prev, username: e.target.value }))
                        }
                        placeholder="Enter username if required"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password (Optional)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newCredentials.password}
                        onChange={(e) => 
                          setNewCredentials(prev => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Enter password if required"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Credentials
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Current Credit Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {Object.values(latestScores).map((score) => (
            <Card key={score.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {score.score_provider.toUpperCase()} Credit Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${getScoreColor(score.credit_score)}`}>
                      {score.credit_score}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getScoreRange(score.credit_score)}
                    </div>
                  </div>
                  <div className="text-right">
                    {score.score_change !== 0 && (
                      <div className={`flex items-center gap-1 text-sm ${
                        score.score_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {score.score_change > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {Math.abs(score.score_change)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(score.score_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Credentials Status */}
        {apiCredentials.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>API Connections</CardTitle>
              <CardDescription>Manage your credit monitoring API connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {apiCredentials.map((cred) => (
                  <div key={cred.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{cred.api_provider.toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        Last sync: {cred.last_sync ? format(new Date(cred.last_sync), 'MMM dd, HH:mm') : 'Never'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSyncData(cred.api_provider)}
                      disabled={syncing}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credit Score Chart */}
        {chartData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Credit Score History</CardTitle>
                  <CardDescription>Track your credit score changes over time</CardDescription>
                </div>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[300, 850]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="experian" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="equifax" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="transunion" stroke="#ffc658" strokeWidth={2} />
                  <Line type="monotone" dataKey="vantagescore" stroke="#ff7300" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Credit Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Credit Alerts
            </CardTitle>
            <CardDescription>Important changes and notifications about your credit</CardDescription>
          </CardHeader>
          <CardContent>
            {creditAlerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No credit alerts found.</p>
                {apiCredentials.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Add API credentials to start monitoring your credit for changes.
                  </p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditAlerts.map((alert) => (
                    <TableRow key={alert.id} className={!alert.is_read ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">
                        {alert.alert_title}
                        {!alert.is_read && <Badge className="ml-2 bg-blue-100 text-blue-800">New</Badge>}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {alert.alert_description}
                      </TableCell>
                      <TableCell>
                        {getAlertSeverityBadge(alert.severity)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(alert.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {!alert.is_read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAlertAsRead(alert.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {apiCredentials.length === 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Get Started with Credit Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Sign up for a credit monitoring service</h4>
                    <p className="text-sm text-muted-foreground">Create an account with IdentityIQ or Credit Hero to get API access</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Obtain your API credentials</h4>
                    <p className="text-sm text-muted-foreground">Get your API key and any required authentication details</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Add credentials to start monitoring</h4>
                    <p className="text-sm text-muted-foreground">Click "Add API Credentials" above to enter your details</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}