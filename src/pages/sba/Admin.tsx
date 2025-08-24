import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Download, 
  FileText, 
  Filter,
  ExternalLink,
  Users,
  Package,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { SectionTitle } from '@/components/sba/SectionTitle';

// Mock data for demonstration
const mockApplications = [
  {
    id: 'APP-001',
    borrower_email: 'john@acmecorp.com',
    business_name: 'ACME Corporation',
    program: '7a',
    requested_amount: 250000,
    status: 'packaged',
    created_at: '2024-01-15',
    documents_count: 8,
  },
  {
    id: 'APP-002',
    borrower_email: 'sarah@techstart.com',
    business_name: 'TechStart LLC',
    program: 'microloan',
    requested_amount: 45000,
    status: 'docs',
    created_at: '2024-01-14',
    documents_count: 5,
  },
  {
    id: 'APP-003',
    borrower_email: 'mike@restaurant.com',
    business_name: 'Downtown Bistro',
    program: '504',
    requested_amount: 500000,
    status: 'sent_to_lender',
    created_at: '2024-01-12',
    documents_count: 12,
  },
  {
    id: 'APP-004',
    borrower_email: 'lisa@consulting.com',
    business_name: 'Apex Consulting',
    program: 'express',
    requested_amount: 75000,
    status: 'intake',
    created_at: '2024-01-10',
    documents_count: 3,
  },
];

const getStatusColor = (status: string) => {
  const colors = {
    precheck: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    consent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    intake: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    docs: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    packaged: 'bg-green-500/20 text-green-400 border-green-500/30',
    sent_to_lender: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return colors[status as keyof typeof colors] || colors.precheck;
};

const getProgramName = (program: string) => {
  const names = {
    '7a': 'SBA 7(a)',
    '504': 'SBA 504',
    'microloan': 'Microloan',
    'express': 'SBA Express',
  };
  return names[program as keyof typeof names] || program;
};

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredApplications = mockApplications.filter(app => {
    const matchesSearch = 
      app.borrower_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total_applications: mockApplications.length,
    total_volume: mockApplications.reduce((sum, app) => sum + app.requested_amount, 0),
    packaged_count: mockApplications.filter(app => app.status === 'packaged' || app.status === 'sent_to_lender').length,
    in_progress: mockApplications.filter(app => app.status !== 'packaged' && app.status !== 'sent_to_lender').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <SectionTitle subtitle="Internal dashboard for application review and management">
          SBA Administration Panel
        </SectionTitle>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Applications</p>
                  <p className="text-2xl font-bold text-white">{stats.total_applications}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white">
                    ${(stats.total_volume / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Packaged</p>
                  <p className="text-2xl font-bold text-white">{stats.packaged_count}</p>
                </div>
                <Package className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">In Progress</p>
                  <p className="text-2xl font-bold text-white">{stats.in_progress}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-white">Applications</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="precheck">Pre-check</option>
                  <option value="consent">Consent</option>
                  <option value="intake">Intake</option>
                  <option value="docs">Documents</option>
                  <option value="packaged">Packaged</option>
                  <option value="sent_to_lender">Sent to Lender</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Application ID</TableHead>
                    <TableHead className="text-slate-300">Borrower</TableHead>
                    <TableHead className="text-slate-300">Business</TableHead>
                    <TableHead className="text-slate-300">Program</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Documents</TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id} className="border-slate-700">
                      <TableCell className="text-white font-mono text-sm">
                        {app.id}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {app.borrower_email}
                      </TableCell>
                      <TableCell className="text-white">
                        {app.business_name}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {getProgramName(app.program)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        ${app.requested_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {app.documents_count} files
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            title="Export Packet"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            title="View Documents"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white"
                            title="Open Application"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredApplications.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400">No applications found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Admin panel for internal use only. All data is protected and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}