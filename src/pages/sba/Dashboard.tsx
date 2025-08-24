import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Package,
  User,
  Building,
  DollarSign
} from 'lucide-react';
import { StatusTracker } from '@/components/sba/StatusTracker';
import { SectionTitle } from '@/components/sba/SectionTitle';
import { useAppStore } from '@/store/app';

export default function Dashboard() {
  const { status, uploadedDocs, matchedProgram, applicationId } = useAppStore();

  // Mock data for demonstration
  const applicationProgress = {
    precheck: 100,
    consent: 100,
    intake: status === 'precheck' || status === 'consent' ? 0 : 100,
    docs: status === 'docs' || status === 'packaged' || status === 'sent_to_lender' ? 100 : 0,
    packaged: status === 'packaged' || status === 'sent_to_lender' ? 100 : 0,
  };

  const overallProgress = Object.values(applicationProgress).reduce((sum, val) => sum + val, 0) / 5;

  const tasks = [
    {
      id: 1,
      title: 'Upload Business Tax Returns',
      description: 'Last 3 years of business tax returns required',
      completed: uploadedDocs.some(doc => doc.doc_type === 'tax_return'),
      urgent: !uploadedDocs.some(doc => doc.doc_type === 'tax_return'),
    },
    {
      id: 2,
      title: 'Provide Financial Statements',
      description: 'Current P&L and Balance Sheet',
      completed: uploadedDocs.some(doc => doc.doc_type === 'pnl') && 
                 uploadedDocs.some(doc => doc.doc_type === 'balance_sheet'),
      urgent: false,
    },
    {
      id: 3,
      title: 'Generate SBA Form 0804',
      description: 'Create standardized application form',
      completed: uploadedDocs.some(doc => doc.doc_type === 'form_0804'),
      urgent: uploadedDocs.length >= 3 && !uploadedDocs.some(doc => doc.doc_type === 'form_0804'),
    },
    {
      id: 4,
      title: 'Build Lender Packet',
      description: 'Compile complete application package',
      completed: status === 'packaged' || status === 'sent_to_lender',
      urgent: false,
    },
  ];

  const completedTasks = tasks.filter(task => task.completed).length;
  const urgentTasks = tasks.filter(task => task.urgent && !task.completed);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <SectionTitle subtitle="Track your SBA loan application progress and manage tasks">
          Application Dashboard
        </SectionTitle>

        {/* Status Overview */}
        <StatusTracker status={status} className="mb-8" />

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Application Summary */}
          <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                Application Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round(overallProgress)}%
                  </div>
                  <p className="text-sm text-slate-400">Complete</p>
                  <Progress value={overallProgress} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {uploadedDocs.length}
                  </div>
                  <p className="text-sm text-slate-400">Documents Uploaded</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {completedTasks}/{tasks.length}
                  </div>
                  <p className="text-sm text-slate-400">Tasks Complete</p>
                </div>
              </div>

              {matchedProgram && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">Recommended Program</h3>
                      <p className="text-slate-300">
                        SBA {matchedProgram.toUpperCase().replace('A', 'A ')} Loan
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Matched
                    </Badge>
                  </div>
                </div>
              )}

              {applicationId && (
                <div className="text-sm text-slate-400">
                  <p>Application ID: {applicationId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link to="/sba/documents">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Documents
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full border-slate-600 text-slate-300">
                <Link to="/sba/packet">
                  <Package className="mr-2 h-4 w-4" />
                  View Packet Status
                </Link>
              </Button>

              <Button 
                variant="outline" 
                className="w-full border-slate-600 text-slate-300"
                onClick={() => window.open('https://www.sba.gov/funding-programs/loans/lender-match', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                SBA Lender Match
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Task List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Tasks & Requirements</span>
                {urgentTasks.length > 0 && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    {urgentTasks.length} Urgent
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border ${
                    task.completed
                      ? 'bg-green-500/10 border-green-500/30'
                      : task.urgent
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-slate-700/50 border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {task.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                      ) : task.urgent ? (
                        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                      ) : (
                        <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-medium text-white">{task.title}</h4>
                        <p className="text-sm text-slate-400">{task.description}</p>
                      </div>
                    </div>
                    {task.completed && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Done
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadedDocs.length > 0 ? (
                <div className="space-y-3">
                  {uploadedDocs.slice(-5).map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-700/30 rounded p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-white text-sm">{doc.filename}</p>
                          <p className="text-xs text-slate-400">
                            {doc.doc_type.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
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
                  {uploadedDocs.length > 5 && (
                    <Button asChild variant="ghost" className="w-full text-slate-400">
                      <Link to="/sba/documents">
                        View All Documents ({uploadedDocs.length})
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm mb-3">No documents uploaded yet</p>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                    <Link to="/sba/documents">
                      Upload First Document
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}