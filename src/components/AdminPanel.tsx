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
import { Users, FileText, Upload, MessageSquare, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function AdminPanel() {
  const { user, profile, signOut } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string>('');

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    }
  };

  if (!profile || profile.role !== 'admin') {
    return <div>Access denied. Admin role required.</div>;
  }

  // Mock client data - will be replaced with real Supabase data
  const mockClients = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@email.com',
      membershipTier: 'pro',
      disputeProgress: 75,
      creditScore: 680,
      status: 'active',
      joinDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      membershipTier: 'basic',
      disputeProgress: 45,
      creditScore: 620,
      status: 'active',
      joinDate: '2024-02-20'
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: 'mike@email.com',
      membershipTier: 'elite',
      disputeProgress: 90,
      creditScore: 750,
      status: 'active',
      joinDate: '2024-01-08'
    }
  ];

  const getMembershipBadge = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Badge className="status-basic">Basic</Badge>;
      case 'pro':
        return <Badge className="status-pro">Pro</Badge>;
      case 'elite':
        return <Badge className="status-elite">Elite</Badge>;
      default:
        return <Badge className="status-basic">Basic</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
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
                <p className="text-primary-foreground/80">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-primary-foreground">
                <p className="font-medium">Admin Portal</p>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{mockClients.length}</p>
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Disputes</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <FileText className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Credit Score</p>
                  <p className="text-2xl font-bold">683</p>
                </div>
                <Settings className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">87%</p>
                </div>
                <MessageSquare className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Management */}
        <Card className="card-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>Manage all clients and their credit repair progress</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="gold">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Client Document</DialogTitle>
                      <DialogDescription>
                        Upload a document for a specific client
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="client-select">Select Client</Label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="document-upload">Document</Label>
                        <Input id="document-upload" type="file" />
                      </div>
                      <Button className="w-full" variant="gold">
                        Upload Document
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Credit Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMembershipBadge(client.membershipTier)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full" 
                            style={{ width: `${client.disputeProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{client.disputeProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{client.creditScore}</TableCell>
                    <TableCell>
                      {getStatusBadge(client.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Note
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Private Note</DialogTitle>
                              <DialogDescription>
                                Add a private note for {client.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea 
                                placeholder="Enter your private note here..."
                                rows={4}
                              />
                              <Button className="w-full" variant="gold">
                                Save Note
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Select defaultValue={client.membershipTier}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}