import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  FileText, 
  Upload, 
  Mail, 
  Settings, 
  Users, 
  Activity,
  ExternalLink,
  Shield,
  Search,
  Download,
  Eye
} from 'lucide-react';
import { AdminCreditReportManager } from '@/components/AdminCreditReportManager';
import { BacklogOverview } from '@/components/BacklogOverview';
import { AdminReviewQueue } from '@/components/AdminReviewQueue';
import { CasePipelineDashboard } from '@/components/CasePipelineDashboard';
import { AIAnalysisViewer } from '@/components/AIAnalysisViewer';
import { AdminAIControlPanel } from '@/components/AdminAIControlPanel';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  plan_type?: string;
  payment_status?: string;
  subscription_status?: string;
}

interface DisputeRecord {
  id: string;
  user_id: string;
  creditor_name: string;
  account_number: string;
  issue_type: string;
  created_at: string;
  generated_letter: string | null;
  user_email?: string;
  status?: string;
}

interface NotificationLog {
  id: string;
  notification_type: string;
  user_id: string;
  email_sent: boolean;
  created_at: string;
  details: any;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    recipient: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (!rolesLoading && !isAdmin()) {
      navigate('/');
      return;
    }
    
    if (isAdmin()) {
      fetchAdminData();
    }
  }, [isAdmin, rolesLoading, navigate]);

  const fetchAdminData = async () => {
    try {
      // Fetch users with profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch dispute letters separately and get user emails
      const { data: disputesData, error: disputesError } = await supabase
        .from('dispute_letters')
        .select('*')
        .order('created_at', { ascending: false });

      if (disputesError) throw disputesError;
      
      // Get user emails for disputes
      const disputesWithEmails = await Promise.all(
        (disputesData || []).map(async (dispute) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', dispute.user_id)
            .single();
          
          return {
            ...dispute,
            user_email: profile?.email || 'Unknown',
            status: dispute.generated_letter ? 'Completed' : 'Pending'
          };
        })
      );
      
      setDisputes(disputesWithEmails);

      // Fetch notification logs
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: emailForm.recipient,
          subject: emailForm.subject,
          message: emailForm.message,
          from_admin: true
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email sent successfully",
      });

      setEmailForm({ recipient: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  const updateDisputeStatus = async (disputeId: string, status: string) => {
    try {
      // For this demo, we'll update a note field if it exists
      toast({
        title: "Status Updated",
        description: `Dispute marked as ${status}`,
      });
      
      // Refresh disputes
      fetchAdminData();
    } catch (error) {
      console.error('Error updating dispute status:', error);
      toast({
        title: "Error",
        description: "Failed to update dispute status",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDisputes = disputes.filter(dispute => 
    dispute.creditor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Crown className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Express Credit & Financial Solutions LLC
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-muted-foreground">
                Welcome back, Admin • {new Date().toLocaleDateString()}
              </p>
              <Button onClick={signOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="review-queue">Review Queue</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="ai-ops">AI Ops</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="credit-reports">Credit Reports</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered clients
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{disputes.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total dispute letters
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Letters</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {disputes.filter(d => d.generated_letter).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generated this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{notifications.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Email notifications
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => navigate('/dispute-center')} 
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Dispute Center</span>
                </Button>
                <Button 
                  onClick={() => setEditModeEnabled(!editModeEnabled)} 
                  variant={editModeEnabled ? "destructive" : "secondary"}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>{editModeEnabled ? 'Disable' : 'Enable'} Edit Mode</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="user-search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-search"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={fetchAdminData} variant="outline">
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage client accounts and subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan Type</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.plan_type || 'None'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.payment_status === 'active' ? 'default' : 'secondary'}
                          >
                            {user.payment_status || 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.subscription_status === 'active' ? 'default' : 'secondary'}
                          >
                            {user.subscription_status || 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership Management Tab */}
          <TabsContent value="membership" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Membership Management</CardTitle>
                <CardDescription>
                  Assign, upgrade, or downgrade user membership tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Membership Type</TableHead>
                      <TableHead>Assign Tier</TableHead>
                      <TableHead>Toggle Status</TableHead>
                      <TableHead>VIP Trial</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{u.plan_type || 'None'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.payment_status === 'active' ? 'default' : 'secondary'}>
                            {u.payment_status || 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{u.subscription_status || 'standard'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={u.plan_type || ''}
                            onValueChange={async (value) => {
                              const { error } = await supabase
                                .from('profiles')
                                .update({ plan_type: value, payment_status: 'active' })
                                .eq('id', u.id);
                              if (error) {
                                toast({ title: 'Error', description: error.message, variant: 'destructive' });
                              } else {
                                toast({ title: 'Updated', description: `${u.email} → ${value}` });
                                fetchAdminData();
                              }
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="elite">Elite</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={u.payment_status === 'active'}
                            onCheckedChange={async (checked) => {
                              const { error } = await supabase
                                .from('profiles')
                                .update({ payment_status: checked ? 'active' : 'inactive' })
                                .eq('id', u.id);
                              if (error) {
                                toast({ title: 'Error', description: error.message, variant: 'destructive' });
                              } else {
                                toast({ title: 'Updated', description: `${u.email} status → ${checked ? 'active' : 'inactive'}` });
                                fetchAdminData();
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const expiresAt = new Date();
                              expiresAt.setDate(expiresAt.getDate() + 14);
                              const { error } = await supabase
                                .from('profiles')
                                .update({
                                  membership_type: 'vip_trial',
                                  payment_status: 'active',
                                  plan_type: 'vip',
                                  expires_at: expiresAt.toISOString(),
                                })
                                .eq('id', u.id);
                              if (error) {
                                toast({ title: 'Error', description: error.message, variant: 'destructive' });
                              } else {
                                toast({ title: 'VIP Trial Granted', description: `${u.email} — 14-day VIP trial activated` });
                                fetchAdminData();
                              }
                            }}
                          >
                            Grant 14-Day VIP
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="dispute-search">Search Disputes</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dispute-search"
                    placeholder="Search by creditor or user email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={fetchAdminData} variant="outline">
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Dispute Tracking System</CardTitle>
                <CardDescription>
                  Monitor and manage all client disputes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Email</TableHead>
                      <TableHead>Creditor</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-medium">
                          {dispute.user_email}
                        </TableCell>
                        <TableCell>{dispute.creditor_name}</TableCell>
                        <TableCell>****{dispute.account_number.slice(-4)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {dispute.issue_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={dispute.status === 'Completed' ? 'default' : 'secondary'}
                          >
                            {dispute.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateDisputeStatus(dispute.id, 'Completed')}
                            >
                              Mark Complete
                            </Button>
                            {dispute.generated_letter && (
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Automation Center</CardTitle>
                <CardDescription>
                  Upload templates and manage document generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload PDF Templates</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload dispute letter templates for automatic generation
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Template Library</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">Standard Dispute Letter</span>
                          <Badge>Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">Debt Validation Letter</span>
                          <Badge>Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">Cease & Desist Letter</span>
                          <Badge variant="secondary">Draft</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Generate</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Select User</Label>
                        <Input placeholder="user@example.com" />
                      </div>
                      <div>
                        <Label>Template</Label>
                        <Input placeholder="Standard Dispute Letter" />
                      </div>
                      <Button className="w-full">
                        Generate Letter
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credit Reports Tab */}
          <TabsContent value="credit-reports" className="space-y-6">
            <AdminCreditReportManager />
          </TabsContent>

          {/* Email Control Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Email Control Panel</CardTitle>
                <CardDescription>
                  Send notifications and messages to users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={sendEmailNotification} className="space-y-4">
                  <div>
                    <Label htmlFor="recipient">Recipient Email</Label>
                    <Input
                      id="recipient"
                      type="email"
                      value={emailForm.recipient}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, recipient: e.target.value }))}
                      placeholder="client@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Important update about your account"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={emailForm.message}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter your message here..."
                      rows={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>
                  Latest email notifications sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.slice(0, 10).map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium">
                          {notification.notification_type}
                        </TableCell>
                        <TableCell>{notification.user_id}</TableCell>
                        <TableCell>
                          <Badge variant={notification.email_sent ? 'default' : 'destructive'}>
                            {notification.email_sent ? 'Sent' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(notification.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Administrative controls and system configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-mode" className="text-base font-medium">
                      Internal Edit Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Show edit controls and component labels
                    </p>
                  </div>
                  <Switch
                    id="edit-mode"
                    checked={editModeEnabled}
                    onCheckedChange={setEditModeEnabled}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => window.open('https://supabase.com/dashboard/project/vctxvlkzoyqrwnletgsp', '_blank')}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Supabase Dashboard</span>
                  </Button>
                  
                  <Button 
                    onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Stripe Dashboard</span>
                  </Button>
                  
                  <Button 
                    onClick={() => window.open('/admin-dashboard', '_blank')}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Internal Tools</span>
                  </Button>
                  
                  <Button 
                    onClick={() => navigate('/dispute-center')}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Dispute Center</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system health and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-purple-600">{notifications.length}</div>
                    <div className="text-sm text-muted-foreground">Notifications</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}