import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Package, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface MailingBundle {
  id: string;
  bundle_name: string;
  status: string;
  zip_file_url: string | null;
  created_at: string;
  generated_at: string | null;
}

interface MailingBundleDownloaderProps {
  clientId?: string;
  userId?: string;
}

export function MailingBundleDownloader({ clientId, userId }: MailingBundleDownloaderProps) {
  const [bundles, setBundles] = useState<MailingBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBundles();
  }, [clientId, userId]);

  const fetchBundles = async () => {
    try {
      let query = supabase.from('mailing_bundles').select('*');
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else if (userId) {
        // Get client ID from user ID
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (client) {
          query = query.eq('client_id', client.id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      toast({
        title: "Error",
        description: "Failed to load mailing bundles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBundle = async () => {
    if (!clientId && !userId) return;

    setGenerating(true);
    setProgress(0);

    try {
      // Simulate progress for user feedback
      const progressSteps = [
        { step: 10, message: "Collecting dispute letters..." },
        { step: 30, message: "Gathering identity documents..." },
        { step: 50, message: "Creating bureau cover sheets..." },
        { step: 80, message: "Packaging ZIP file..." },
        { step: 100, message: "Bundle ready!" }
      ];

      for (const { step, message } of progressSteps) {
        setProgress(step);
        if (step < 100) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Get the client ID if we only have user ID
      let finalClientId = clientId;
      if (userId && !clientId) {
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .single();
        finalClientId = client?.id;
      }

      if (!finalClientId) {
        throw new Error('Client not found');
      }

      // Call the bundle generation function
      const { data, error } = await supabase.functions.invoke('generate-mailing-bundle', {
        body: { client_id: finalClientId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Mailing bundle generated successfully",
      });

      // Refresh bundles list
      fetchBundles();

    } catch (error) {
      console.error('Error generating bundle:', error);
      toast({
        title: "Error",
        description: "Failed to generate mailing bundle",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const downloadBundle = async (bundle: MailingBundle) => {
    if (!bundle.zip_file_url) return;

    try {
      // Create a download link
      const link = document.createElement('a');
      link.href = bundle.zip_file_url;
      link.download = `${bundle.bundle_name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Your mailing bundle is downloading",
      });
    } catch (error) {
      console.error('Error downloading bundle:', error);
      toast({
        title: "Error",
        description: "Failed to download bundle",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ready':
        return 'default' as const;
      case 'processing':
        return 'secondary' as const;
      case 'failed':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Mailing Bundle Downloader
        </CardTitle>
        <CardDescription>
          Download all dispute letters and documents bundled for mailing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generate New Bundle */}
        <div className="space-y-3">
          <Button 
            onClick={generateBundle} 
            disabled={generating}
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            {generating ? 'Generating Bundle...' : 'Download All Letters for Mailing'}
          </Button>

          {generating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Creating your mailing package...
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Bundle includes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All dispute letters (PDF format)</li>
              <li>Driver&apos;s License copy</li>
              <li>SSN Card copy</li>
              <li>Utility Bill or Lease copy</li>
              <li>Bureau-specific cover sheets</li>
            </ul>
          </div>
        </div>

        {/* Existing Bundles */}
        {bundles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Previous Bundles</h4>
            {bundles.map((bundle) => (
              <div key={bundle.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{bundle.bundle_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(bundle.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(bundle.status)} className="flex items-center gap-1">
                    {getStatusIcon(bundle.status)}
                    {bundle.status}
                  </Badge>
                  {bundle.status === 'ready' && bundle.zip_file_url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadBundle(bundle)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {bundles.length === 0 && !generating && (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No mailing bundles yet</p>
            <p className="text-sm">Generate your first bundle above</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
