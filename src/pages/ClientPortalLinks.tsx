import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, ExternalLink, Upload, FileText, Settings } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { BackButton } from '@/components/BackButton';
import { AdminDocumentUploader } from '@/components/AdminDocumentUploader';
import { AdminClientOverview } from '@/components/AdminClientOverview';

const clients = [
  {
    name: 'Melvin Earl Milliner Jr.',
    slug: 'melvin',
    plan: 'Pro',
    email: 'melvin@example.com'
  },
  {
    name: 'Phoebe Thomas',
    slug: 'phoebe',
    plan: 'Pro',
    email: 'phoebe@example.com'
  },
  {
    name: 'Jadlyn Nicole Starkey',
    slug: 'jadlyn',
    plan: 'Basic',
    email: 'jadlyn@example.com'
  }
];

export default function ClientPortalLinks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-black relative overflow-hidden">
      {/* Chrome effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-blue-950/30 to-black/80"></div>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.3) 0px, transparent 2px),
                         radial-gradient(circle at 75% 75%, rgba(30, 58, 138, 0.2) 0px, transparent 1px),
                         radial-gradient(circle at 50% 10%, rgba(255,255,255,0.1) 0px, transparent 1px),
                         radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.2) 0px, transparent 2px),
                         radial-gradient(circle at 90% 40%, rgba(255,255,255,0.05) 0px, transparent 1px)`,
        backgroundSize: '100px 100px, 80px 80px, 60px 60px, 120px 120px, 90px 90px'
      }}></div>
      <div className="relative z-10">
      <NavigationHeader />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <BackButton />
        </div>
        
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-600 bg-clip-text text-transparent drop-shadow-lg" style={{
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3), 0 0 30px rgba(255, 215, 0, 0.2)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}>Admin Client Portal Management</h1>
            <p className="text-muted-foreground">
              Comprehensive client management, document upload, and portal access
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Client Overview
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Document Upload
              </TabsTrigger>
              <TabsTrigger value="portals" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Portal Access
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminClientOverview />
            </TabsContent>

            <TabsContent value="upload">
              <AdminDocumentUploader />
            </TabsContent>

            <TabsContent value="portals">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Individual Client Portals</CardTitle>
                    <CardDescription>
                      Direct access to each client's secure portal for document management and credit repair services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {clients.map((client) => (
                        <Card key={client.slug} className="hover:shadow-lg transition-shadow border-primary/20">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <User className="w-5 h-5" />
                              {client.name}
                            </CardTitle>
                            <CardDescription>
                              <div className="space-y-1">
                                <p className="font-medium">{client.plan} Plan</p>
                                <p className="text-xs text-muted-foreground">{client.email}</p>
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <Button 
                              className="w-full" 
                              onClick={() => window.open(`/client/${client.slug}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Access Client Portal
                            </Button>
                            <Button 
                              variant="outline"
                              className="w-full" 
                              onClick={() => {
                                // Focus on upload tab and pre-select this client
                                const event = new CustomEvent('selectClient', { detail: client.slug });
                                window.dispatchEvent(event);
                              }}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Documents
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="manage">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Admin Tools
                    </CardTitle>
                    <CardDescription>
                      Administrative functions and bulk operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => window.open('/admin-dashboard', '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Full Admin Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        // Could add bulk export functionality
                        alert('Bulk operations coming soon!');
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Document Export
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-center">Quick Actions</CardTitle>
                    <CardDescription className="text-center">
                      Common administrative tasks and shortcuts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => {
                        // Navigate to upload tab
                        const uploadTab = document.querySelector('[value="upload"]') as HTMLElement;
                        uploadTab?.click();
                      }}
                    >
                      Upload Client Documents
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => {
                        // Navigate to overview tab
                        const overviewTab = document.querySelector('[value="overview"]') as HTMLElement;
                        overviewTab?.click();
                      }}
                    >
                      View Client Statistics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </div>
    </div>
  );
}