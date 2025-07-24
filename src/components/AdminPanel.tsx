import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, Upload, MessageSquare, Settings, Shield, Activity, TrendingUp, AlertCircle, BarChart3, Database, Mail } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  membershipTier: 'basic' | 'pro' | 'elite';
  disputeProgress: number;
  creditScore: number;
  joinDate: string;
  status: 'active' | 'inactive';
}

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock client data with enhanced information
  const [clients] = useState<Client[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@email.com',
      membershipTier: 'pro',
      disputeProgress: 75,
      creditScore: 680,
      joinDate: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      membershipTier: 'elite',
      disputeProgress: 90,
      creditScore: 720,
      joinDate: '2024-02-01',
      status: 'active'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike@email.com',
      membershipTier: 'basic',
      disputeProgress: 45,
      creditScore: 620,
      joinDate: '2024-03-10',
      status: 'active'
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily@email.com',
      membershipTier: 'elite',
      disputeProgress: 85,
      creditScore: 750,
      joinDate: '2024-01-28',
      status: 'active'
    }
  ]);

  const getMembershipBadge = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Basic</Badge>;
      case 'pro':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Pro</Badge>;
      case 'elite':
        return <Badge className="bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-300">Elite</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Basic</Badge>;
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNote = () => {
    console.log('Adding note:', newNote, 'for client:', selectedClient?.id);
    setNewNote('');
  };

  const handleMembershipChange = (clientId: string, newTier: string) => {
    console.log('Changing membership for client:', clientId, 'to:', newTier);
  };

  const handleBackupDatabase = () => {
    console.log('Initiating database backup...');
    // Add backup logic here
    alert('Database backup initiated successfully!');
  };

  const handleSendNotifications = () => {
    console.log('Sending notifications...');
    // Add notification logic here
    alert('Notifications sent to all active clients!');
  };

  const handleSystemSettings = () => {
    console.log('Opening system settings...');
    // Add system settings logic here
    alert('System settings panel opened!');
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
                <h1 className="font-bold text-primary-foreground text-3xl">Express Credit & Financial Solutions</h1>
                <p className="text-primary-foreground/80">Advanced Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={onLogout} variant="silver">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-elegant">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2 text-accent" />
                    Total Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.length}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% this month
                  </p>
                </CardContent>
              </Card>
              
              <Card className="card-elegant">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-accent" />
                    Active Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">47</div>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Activity className="h-3 w-3 mr-1" />
                    15 pending review
                  </p>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-accent" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">97.3%</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2.1% vs last month
                  </p>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-accent" />
                    Avg. Score Increase
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+127</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Best month yet
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and System Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 text-accent mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                      <div className="text-sm">
                        <p className="font-medium">New client registration</p>
                        <p className="text-muted-foreground">Michael Chen signed up for Pro plan</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div className="text-sm">
                        <p className="font-medium">Dispute completed</p>
                        <p className="text-muted-foreground">Credit line deletion successful for Sarah J.</p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                      <div className="text-sm">
                        <p className="font-medium">Payment received</p>
                        <p className="text-muted-foreground">Elite membership payment from John S.</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-accent mr-2" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-700 dark:text-red-300">High Priority</p>
                        <p className="text-red-600 dark:text-red-400">3 dispute deadlines approaching (48hrs)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-700 dark:text-yellow-300">Attention</p>
                        <p className="text-yellow-600 dark:text-yellow-400">OpenAI API usage at 85% of monthly limit</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-700 dark:text-blue-300">Info</p>
                        <p className="text-blue-600 dark:text-blue-400">System backup completed successfully</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Client Management</CardTitle>
                    <CardDescription>Manage client accounts, memberships, and progress</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="Search clients..." 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      className="w-64" 
                    />
                    <Button variant="outline">Export</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Credit Score</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map(client => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">{client.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getMembershipBadge(client.membershipTier)}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            client.creditScore >= 700 ? 'text-green-600' : 
                            client.creditScore >= 600 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {client.creditScore}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-accent h-2 rounded-full" 
                                style={{ width: `${client.disputeProgress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{client.disputeProgress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(client.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedClient(client)}>
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Manage Client: {client.name}</DialogTitle>
                                  <DialogDescription>
                                    Update client information, membership, and track progress
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Membership Tier</Label>
                                      <Select 
                                        defaultValue={client.membershipTier} 
                                        onValueChange={value => handleMembershipChange(client.id, value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="basic">Basic - $99.99/month</SelectItem>
                                          <SelectItem value="pro">Pro - $179.99/month</SelectItem>
                                          <SelectItem value="elite">Elite - $249.99/month</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Update Progress (%)</Label>
                                      <Input 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        defaultValue={client.disputeProgress} 
                                        placeholder="Enter progress percentage" 
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Upload Documents</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                      <p className="text-sm text-muted-foreground">
                                        Upload credit reports, dispute responses, or other documents
                                      </p>
                                      <Button variant="outline" size="sm" className="mt-2">
                                        Choose Files
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Add Private Note</Label>
                                    <Textarea 
                                      placeholder="Add case notes, client communications, or important updates..." 
                                      value={newNote} 
                                      onChange={e => setNewNote(e.target.value)} 
                                      rows={3} 
                                    />
                                    <Button 
                                      onClick={handleAddNote} 
                                      variant="default" 
                                      size="sm" 
                                      disabled={!newNote.trim()}
                                    >
                                      Add Note
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm">
                              <Mail className="h-3 w-3" />
                            </Button>
                          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="card-elegant">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">15</div>
                  <p className="text-xs text-muted-foreground">Require attention</p>
                </CardContent>
              </Card>
              
              <Card className="card-elegant">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">32</div>
                  <p className="text-xs text-muted-foreground">With bureaus</p>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">156</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Dispute Activity Monitor</CardTitle>
                <CardDescription>Track dispute letters, responses, and outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Dispute Type</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div>
                          <div className="font-medium">John Smith</div>
                          <div className="text-sm text-muted-foreground">john@email.com</div>
                        </div>
                      </TableCell>
                      <TableCell>Account Deletion</TableCell>
                      <TableCell>Experian</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 font-medium">Dec 28, 2024</span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Review</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div>
                          <div className="font-medium">Sarah Johnson</div>
                          <div className="text-sm text-muted-foreground">sarah@email.com</div>
                        </div>
                      </TableCell>
                      <TableCell>Inquiry Removal</TableCell>
                      <TableCell>Equifax</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Successful</Badge>
                      </TableCell>
                      <TableCell>Completed</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Monthly Revenue</span>
                      <span className="font-bold text-green-600">$47,250</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Client Value</span>
                      <span className="font-bold">$185/month</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Churn Rate</span>
                      <span className="font-bold text-red-600">2.3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Dispute Success Rate</span>
                      <span className="font-bold text-green-600">97.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Avg. Response Time</span>
                      <span className="font-bold">2.4 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Client Satisfaction</span>
                      <span className="font-bold text-green-600">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 text-accent mr-2" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Supabase Database</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>OpenAI API</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stripe Payments</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email Service</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>API Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>OpenAI API</span>
                        <span>850/1000 requests</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Supabase Storage</span>
                        <span>2.3GB/10GB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>System maintenance and configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="flex items-center justify-center" onClick={handleBackupDatabase}>
                    <Database className="h-4 w-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center" onClick={handleSendNotifications}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Notifications
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center" onClick={handleSystemSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}