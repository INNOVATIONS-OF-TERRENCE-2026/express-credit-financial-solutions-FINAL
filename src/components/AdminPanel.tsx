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
export function AdminPanel({
  onLogout
}: AdminPanelProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock client data
  const [clients] = useState<Client[]>([{
    id: '1',
    name: 'John Smith',
    email: 'john@email.com',
    membershipTier: 'pro',
    disputeProgress: 75,
    creditScore: 680,
    joinDate: '2024-01-15',
    status: 'active'
  }, {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    membershipTier: 'elite',
    disputeProgress: 90,
    creditScore: 720,
    joinDate: '2024-02-01',
    status: 'active'
  }, {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike@email.com',
    membershipTier: 'basic',
    disputeProgress: 45,
    creditScore: 620,
    joinDate: '2024-03-10',
    status: 'active'
  }]);
  const getMembershipBadge = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Badge className="status-basic">Active</Badge>;
      case 'pro':
        return <Badge className="status-pro"></Badge>;
      case 'elite':
        return <Badge className="status-elite">Inactive</Badge>;
      default:
        return <Badge className="status-basic">Basic</Badge>;
    }
  };
  const filteredClients = clients.filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleAddNote = () => {
    // In a real app, this would save to database
    console.log('Adding note:', newNote, 'for client:', selectedClient?.id);
    setNewNote('');
  };
  const handleMembershipChange = (clientId: string, newTier: string) => {
    // In a real app, this would update the database
    console.log('Changing membership for client:', clientId, 'to:', newTier);
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-elegant border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-accent" />
              <div>
                <h1 className="font-bold text-primary-foreground text-3xl">Express Credit & Financial Solutions</h1>
                <p className="text-primary-foreground/80">Admin Panel</p>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-elegant">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2 text-accent" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
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
              <div className="text-2xl font-bold">15</div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Settings className="h-4 w-4 mr-2 text-accent" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">97%</div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-accent" />
                Avg. Score Increase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+95</div>
            </CardContent>
          </Card>
        </div>

        {/* Client Management */}
        <Card className="card-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>Manage your clients, disputes, and memberships</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Input placeholder="Search clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Membership Status
                </TableHead>
                  <TableHead>Credit Score</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(client => <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getMembershipBadge(client.membershipTier)}</TableCell>
                    <TableCell>{client.creditScore}</TableCell>
                    <TableCell>{client.disputeProgress}%</TableCell>
                    <TableCell>{new Date(client.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="silver" size="sm" onClick={() => setSelectedClient(client)}>
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Manage Client: {client.name}</DialogTitle>
                              <DialogDescription>
                                Update client information, membership, and add notes
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                              {/* Membership Tier Update */}
                              <div className="space-y-2">
                                <Label>Membership Tier</Label>
                                <Select defaultValue={client.membershipTier} onValueChange={value => handleMembershipChange(client.id, value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="basic">Basic - $49/month</SelectItem>
                                    <SelectItem value="pro">Pro - $99/month</SelectItem>
                                    <SelectItem value="elite">Elite - $149/month</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Document Upload */}
                              <div className="space-y-2">
                                <Label>Upload Documents</Label>
                                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">
                                    Click to upload PDFs or documents for this client
                                  </p>
                                  <Button variant="silver" size="sm" className="mt-2">
                                    Choose Files
                                  </Button>
                                </div>
                              </div>

                              {/* Private Notes */}
                              <div className="space-y-2">
                                <Label>Add Private Note</Label>
                                <Textarea placeholder="Add a private note about this client..." value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} />
                                <Button onClick={handleAddNote} variant="gold" size="sm" disabled={!newNote.trim()}>
                                  Add Note
                                </Button>
                              </div>

                              {/* Dispute Progress Update */}
                              <div className="space-y-2">
                                <Label>Update Dispute Progress</Label>
                                <Input type="number" min="0" max="100" defaultValue={client.disputeProgress} placeholder="Enter progress percentage" />
                                <Button variant="gold" size="sm">
                                  Update Progress
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>;
}