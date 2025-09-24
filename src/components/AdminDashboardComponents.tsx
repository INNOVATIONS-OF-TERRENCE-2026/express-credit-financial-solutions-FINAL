import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  MessageSquare, 
  Clock, 
  BarChart3, 
  Download, 
  Eye, 
  Search,
  Users,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AdminDataItem {
  id: string;
  user_id: string;
  client_name?: string;
  client_email?: string;
  created_at: string;
  [key: string]: any;
}

interface AdminDashboardComponentsProps {
  userEmail?: string;
}

export function AdminDashboardComponents({ userEmail }: AdminDashboardComponentsProps) {
  const [documents, setDocuments] = useState<AdminDataItem[]>([]);
  const [disputes, setDisputes] = useState<AdminDataItem[]>([]);
  const [chatHistory, setChatHistory] = useState<AdminDataItem[]>([]);
  const [creditScans, setCreditScans] = useState<AdminDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch documents with user profile data
      const { data: documentsData, error: documentsError } = await supabase
        .from('document_archive')
        .select(`
          *,
          profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      // Fetch dispute timeline
      const { data: disputesData, error: disputesError } = await supabase
        .from('dispute_timeline')
        .select(`
          *,
          profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (disputesError) throw disputesError;

      // Fetch chat history grouped by user
      const { data: chatData, error: chatError } = await supabase
        .from('chat_history')
        .select(`
          *,
          profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (chatError) throw chatError;

      // Fetch credit scan summaries
      const { data: creditData, error: creditError } = await supabase
        .from('credit_scan_summaries')
        .select(`
          *,
          profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (creditError) throw creditError;

      // Transform data to include client email
      const transformData = (data: any[]) => {
        return data.map(item => ({
          ...item,
          client_email: item.profiles?.email || 'Unknown'
        }));
      };

      setDocuments(transformData(documentsData));
      setDisputes(transformData(disputesData));
      setChatHistory(transformData(chatData));
      setCreditScans(transformData(creditData));

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = (data: AdminDataItem[]) => {
    if (!searchTerm) return data;
    return data.filter(item => 
      item.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.creditor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message_content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('document-archive')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Dashboard - All Client Data
          </CardTitle>
          <CardDescription>
            View and manage all client documents, disputes, chat history, and credit reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by client email, file name, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchAllData} variant="outline">
              Refresh Data
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{documents.length}</div>
                <div className="text-sm text-muted-foreground">Documents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{disputes.length}</div>
                <div className="text-sm text-muted-foreground">Disputes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{chatHistory.length}</div>
                <div className="text-sm text-muted-foreground">Chat Messages</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{creditScans.length}</div>
                <div className="text-sm text-muted-foreground">Credit Scans</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Data Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="chat">Chat History</TabsTrigger>
          <TabsTrigger value="scans">Credit Scans</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Client Documents</CardTitle>
              <CardDescription>All uploaded documents across all clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterData(documents).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{doc.file_name}</span>
                        <Badge variant="outline">{doc.document_type}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Client: {doc.client_email} • 
                        Uploaded: {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(doc.file_path, doc.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filterData(documents).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No documents found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Timeline</CardTitle>
              <CardDescription>All dispute timelines across all clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterData(disputes).map((dispute) => (
                  <div key={dispute.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{dispute.creditor_name}</span>
                        <div className="text-sm text-muted-foreground">
                          Client: {dispute.client_email} • Account: {dispute.account_number}
                        </div>
                      </div>
                      <Badge variant={dispute.status === 'completed' ? 'default' : 'secondary'}>
                        {dispute.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {format(new Date(dispute.created_at), 'MMM dd, yyyy')}
                      {dispute.outcome && ` • Outcome: ${dispute.outcome}`}
                    </div>
                  </div>
                ))}
                {filterData(disputes).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No disputes found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Chat History</CardTitle>
              <CardDescription>All AI assistant conversations across all clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterData(chatHistory).map((chat) => (
                  <div key={chat.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <Badge variant={chat.message_role === 'user' ? 'default' : 'secondary'}>
                          {chat.message_role}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {chat.client_email}
                      </div>
                    </div>
                    <div className="text-sm mb-2">
                      {chat.message_content.substring(0, 200)}
                      {chat.message_content.length > 200 && '...'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(chat.timestamp), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                ))}
                {filterData(chatHistory).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No chat history found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans">
          <Card>
            <CardHeader>
              <CardTitle>Credit Scan Summaries</CardTitle>
              <CardDescription>All credit report analyses across all clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterData(creditScans).map((scan) => (
                  <div key={scan.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{scan.file_name}</span>
                        <div className="text-sm text-muted-foreground">
                          Client: {scan.client_email}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {scan.dispute_opportunities} opportunities
                      </Badge>
                    </div>
                    <div className="text-sm mb-2">
                      {scan.ai_summary?.substring(0, 200)}
                      {scan.ai_summary?.length > 200 && '...'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Scanned: {format(new Date(scan.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                ))}
                {filterData(creditScans).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No credit scans found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}