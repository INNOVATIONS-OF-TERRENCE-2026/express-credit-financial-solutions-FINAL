import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ExternalLink } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { BackButton } from '@/components/BackButton';

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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <NavigationHeader />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <BackButton />
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Client Portals</h1>
            <p className="text-muted-foreground">
              Access individual client portals for secure document management and credit repair services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card key={client.slug} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {client.name}
                  </CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <p>{client.plan} Plan</p>
                      <p className="text-xs">{client.email}</p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => window.open(`/client/${client.slug}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Access Portal
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-center">Admin Access</CardTitle>
              <CardDescription className="text-center">
                As an admin, you have full access to all client data and can view their portals directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" onClick={() => window.open('/admin-dashboard', '_blank')}>
                View Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}