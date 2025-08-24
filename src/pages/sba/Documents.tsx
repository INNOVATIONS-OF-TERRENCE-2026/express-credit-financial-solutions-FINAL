import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { StatusTracker } from '@/components/sba/StatusTracker';
import { SectionTitle } from '@/components/sba/SectionTitle';
import { Uploader } from '@/components/sba/Uploader';
import { useAppStore } from '@/store/app';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function Documents() {
  const navigate = useNavigate();
  const { applicationId, uploadedDocs, addUploadedDoc, setStatus } = useAppStore();
  const { toast } = useToast();
  const [generating0804, setGenerating0804] = useState(false);
  const [buildingPacket, setBuildingPacket] = useState(false);
  const [form0804Url, setForm0804Url] = useState<string | null>(null);
  const [packetUrl, setPacketUrl] = useState<string | null>(null);

  if (!applicationId) {
    navigate('/sba/intake');
    return null;
  }

  const handleGenerate0804 = async () => {
    setGenerating0804(true);
    try {
      const result = await apiClient.generateForm0804(applicationId);
      setForm0804Url(result.url);
      addUploadedDoc({
        doc_type: 'form_0804',
        filename: 'SBA_Form_0804.pdf',
        url: result.url,
      });
      toast({
        title: 'Form 0804 Generated',
        description: 'Your SBA Form 0804 has been generated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate Form 0804. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating0804(false);
    }
  };

  const handleBuildPacket = async () => {
    setBuildingPacket(true);
    try {
      const result = await apiClient.buildPacket(applicationId);
      setPacketUrl(result.packet_url);
      setStatus('packaged');
      toast({
        title: 'Lender Packet Created',
        description: 'Your complete lender packet is ready for submission.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to build lender packet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBuildingPacket(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle subtitle="Upload required documents and generate your SBA application packet">
          Document Upload & Processing
        </SectionTitle>

        <StatusTracker status="docs" className="mb-8" />

        <div className="space-y-6">
          {/* Document Uploader */}
          <Uploader 
            applicationId={applicationId}
            onUploaded={(doc) => addUploadedDoc(doc)}
          />

          {/* Uploaded Documents List */}
          {uploadedDocs.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedDocs.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-700/30 rounded p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-white">{doc.filename}</p>
                          <Badge variant="outline" className="text-xs">
                            {doc.doc_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {doc.url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Generate SBA Form 0804</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">
                  Create the standardized SBA application summary form based on your intake data.
                </p>
                <Button 
                  onClick={handleGenerate0804}
                  disabled={generating0804}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {generating0804 ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate 0804 PDF
                    </>
                  )}
                </Button>
                {form0804Url && (
                  <Button variant="outline" className="w-full mt-2" asChild>
                    <a href={form0804Url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download Form 0804
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Build Lender Packet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">
                  Combine all documents into a complete packet ready for SBA lenders.
                </p>
                <Button 
                  onClick={handleBuildPacket}
                  disabled={buildingPacket || uploadedDocs.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {buildingPacket ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Building...
                    </>
                  ) : (
                    'Build Lender Packet'
                  )}
                </Button>
                {packetUrl && (
                  <div className="space-y-2 mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <a href={packetUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Packet
                      </a>
                    </Button>
                    <Button 
                      onClick={() => navigate('/sba/dashboard')}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}