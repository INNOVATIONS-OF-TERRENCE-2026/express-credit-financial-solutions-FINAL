import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Eye, Filter, Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface CreditReportUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  analysis_status: string;
  analysis_url: string | null;
  flagged_accounts_count: number;
  ai_analysis_summary: string | null;
  client?: {
    full_name: string;
    email: string;
  };
}

export function AdminCreditReportManager() {
  const [uploads, setUploads] = useState<CreditReportUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchUploads = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all credit report uploads with user information
      const { data, error } = await supabase
        .from('credit_report_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      // Get user information for each upload
      const uploadsWithUserInfo = await Promise.all(
        (data || []).map(async (upload) => {
          // First try to get client info
          const { data: clientData } = await supabase
            .from('clients')
            .select('full_name, email')
            .eq('user_id', upload.user_id)
            .single();

          if (clientData) {
            return {
              ...upload,
              client: clientData
            };
          }

          // If no client, get from profiles
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', upload.user_id)
            .single();

          return {
            ...upload,
            client: {
              full_name: profileData?.email?.split('@')[0] || 'Unknown',
              email: profileData?.email || 'Unknown'
            }
          };
        })
      );

      setUploads(uploadsWithUserInfo || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Error",
        description: "Failed to load credit report uploads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data } = await supabase.storage
        .from('credit-reports')
        .createSignedUrl(filePath, 300); // 5 minutes

      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: `Downloading ${fileName}`,
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('credit-reports')
        .createSignedUrl(filePath, 60);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating preview:', error);
      toast({
        title: "Error",
        description: "Failed to preview file",
        variant: "destructive",
      });
    }
  };

  const triggerReanalysis = async (uploadId: string, filePath: string, fileName: string) => {
    try {
      // Update status to analyzing
      await supabase
        .from('credit_report_uploads')
        .update({ analysis_status: 'analyzing' })
        .eq('id', uploadId);

      // Trigger analysis
      const { data, error } = await supabase.functions.invoke('analyze-credit-report', {
        body: {
          creditReportPath: filePath,
          fileName: fileName,
          reportId: uploadId
        }
      });

      if (error) throw error;

      await fetchUploads();

      toast({
        title: "Analysis Started",
        description: `Re-analysis initiated for ${fileName}`,
      });
    } catch (error) {
      console.error('Error triggering analysis:', error);
      
      // Update status to failed
      await supabase
        .from('credit_report_uploads')
        .update({ analysis_status: 'failed' })
        .eq('id', uploadId);

      await fetchUploads();

      toast({
        title: "Analysis Failed",
        description: "Failed to trigger analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      analyzing: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter uploads based on search and filters
  const filteredUploads = uploads.filter(upload => {
    const matchesSearch = 
      upload.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.client?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || upload.analysis_status === statusFilter;
    const matchesType = typeFilter === 'all' || upload.file_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueFileTypes = Array.from(new Set(uploads.map(u => u.file_type)));
  const statusCounts = uploads.reduce((acc, upload) => {
    acc[upload.analysis_status] = (acc[upload.analysis_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading credit report uploads...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Credit Report Management
        </CardTitle>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Total: {uploads.length}</span>
          <span>|</span>
          <span>Pending: {statusCounts.pending || 0}</span>
          <span>Analyzing: {statusCounts.analyzing || 0}</span>
          <span>Completed: {statusCounts.completed || 0}</span>
          <span>Failed: {statusCounts.failed || 0}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search by file name, client name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[300px]"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="analyzing">Analyzing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueFileTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {filteredUploads.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No credit reports found matching your criteria.
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issues Found</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {upload.client?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {upload.client?.email || 'No email'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="max-w-[200px] truncate" title={upload.file_name}>
                          {upload.file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {upload.file_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(upload.file_size)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{new Date(upload.uploaded_at).toLocaleDateString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(upload.uploaded_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(upload.analysis_status)}
                        {getStatusBadge(upload.analysis_status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {upload.flagged_accounts_count > 0 ? (
                        <Badge variant="destructive">
                          {upload.flagged_accounts_count} issues
                        </Badge>
                      ) : upload.analysis_status === 'completed' ? (
                        <Badge variant="secondary">
                          Clean
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handlePreview(upload.file_path)}
                          size="sm"
                          variant="outline"
                          title="Preview file"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDownload(upload.file_path, upload.file_name)}
                          size="sm"
                          variant="outline"
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {upload.file_type === 'pdf' && (
                          <Button
                            onClick={() => triggerReanalysis(upload.id, upload.file_path, upload.file_name)}
                            size="sm"
                            variant="outline"
                            title="Re-analyze"
                            disabled={upload.analysis_status === 'analyzing'}
                          >
                            <Filter className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}