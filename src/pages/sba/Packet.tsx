import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  FileText, 
  Package, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { SectionTitle } from '@/components/sba/SectionTitle';
import { StatusTracker } from '@/components/sba/StatusTracker';
import { useAppStore } from '@/store/app';

export default function Packet() {
  const navigate = useNavigate();
  const { status, uploadedDocs } = useAppStore();

  // Mock packet URL for demonstration
  const packetUrl = "https://example.com/packet.zip";
  const hasPacket = status === 'packaged' || status === 'sent_to_lender';

  const sbaLenderMatchUrl = "https://www.sba.gov/funding-programs/loans/lender-match";

  const handleSendToLenderMatch = () => {
    // In real app, this would track the action
    window.open(sbaLenderMatchUrl, '_blank');
  };

  const copyPacketLink = () => {
    if (hasPacket) {
      navigator.clipboard.writeText(packetUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <SectionTitle subtitle="Complete lender packet ready for SBA partner institutions">
          Lender Packet & Submission
        </SectionTitle>

        <StatusTracker 
          status={hasPacket ? 'packaged' : 'docs'} 
          className="mb-8" 
        />

        <div className="space-y-6">
          {hasPacket ? (
            <>
              {/* Packet Ready */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <CardTitle className="text-2xl text-white">
                    Your Lender Packet is Ready!
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <p className="text-slate-300">
                    Your complete SBA application packet has been generated and is ready 
                    for submission to SBA-approved lenders.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Button 
                      onClick={copyPacketLink}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Copy Packet Link
                    </Button>
                    <Button asChild variant="outline" className="border-slate-600 text-slate-300">
                      <a href={packetUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Packet
                      </a>
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Submit to SBA Lender Match
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Connect with SBA-approved lenders who specialize in your loan type and industry.
                    </p>
                    <Button 
                      onClick={handleSendToLenderMatch}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Go to SBA Lender Match
                    </Button>
                  </div>

                  <Button 
                    onClick={() => navigate('/sba/dashboard')}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    View Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Packet Not Ready */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Lender Packet Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300">
                    Your lender packet will include all the documents and forms needed 
                    for SBA loan submission:
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-white mb-3">Included Documents:</h3>
                      <ul className="space-y-2 text-sm text-slate-400">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          SBA Form 0804 (Application Summary)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          Business Tax Returns
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          Financial Statements
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          Business Licenses
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          Supporting Documentation
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-white mb-3">Packet Features:</h3>
                      <ul className="space-y-2 text-sm text-slate-400">
                        <li className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          Professional cover letter
                        </li>
                        <li className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          Document index
                        </li>
                        <li className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          SBA compliance check
                        </li>
                        <li className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          Lender-ready formatting
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700 text-center">
                    <p className="text-slate-400 mb-4">
                      Complete your document upload to build your lender packet.
                    </p>
                    <Button asChild className="bg-green-600 hover:bg-green-700">
                      <Link to="/sba/documents">
                        Complete Documents
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Uploaded Documents Preview */}
          {uploadedDocs.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Current Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedDocs.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-700/30 rounded p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="text-white">{doc.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {doc.doc_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {doc.url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}