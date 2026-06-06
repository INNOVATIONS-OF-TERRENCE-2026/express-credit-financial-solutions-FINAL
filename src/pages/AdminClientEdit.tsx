import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { NavigationHeader } from '@/components/NavigationHeader';
import { BackButton } from '@/components/BackButton';
import { AdminNotesPanel } from '@/components/AdminNotesPanel';
import { ResultsOverridePanel } from '@/components/admin/ResultsOverridePanel';
import { ClientActivityTimeline } from '@/components/ClientActivityTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LuxuryCard, EyebrowLabel, StatusBadge } from '@/components/luxury';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRoles } from '@/hooks/useRoles';
import { resolveClient as resolveClientId } from '@/lib/resolveClient';
import { Save, Zap, CreditCard, ArrowLeft, Eye, User, Shield, FileSearch, Gavel, FileText, Wallet, ScrollText, Activity, StickyNote, ExternalLink } from 'lucide-react';

interface ClientData {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string;
  dob: string;
  ssn_last4: string;
  membership_plan: string | null;
  user_id: string | null;
  workflow_status: string | null;
  priority_level: string | null;
  round_number: number | null;
  created_at: string;
  updated_at: string;
}

interface CreditScores {
  experian_score: number | null;
  equifax_score: number | null;
  transunion_score: number | null;
}

export default function AdminClientEdit() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: rolesLoading } = useRoles();

  const [client, setClient] = useState<ClientData | null>(null);
  const [scores, setScores] = useState<CreditScores>({ experian_score: null, equifax_score: null, transunion_score: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!rolesLoading && !isAdmin()) {
      navigate('/');
      return;
    }
    if (isAdmin() && clientId) {
      fetchClient();
    }
  }, [isAdmin, rolesLoading, clientId]);

  const fetchClient = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      // Resolve any identifier type to clients.id
      const resolved = await resolveClientId(clientId);
      const actualClientId = resolved?.clientId || clientId;

      const [{ data: c, error: cErr }, { data: s }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', actualClientId).single(),
        supabase.from('client_credit_scores' as any).select('*').eq('client_id', actualClientId).single(),
      ]);

      if (cErr || !c) {
        toast({ title: 'Error', description: 'Client not found', variant: 'destructive' });
        navigate('/admin/clients');
        return;
      }

      setClient(c as ClientData);
      if (s) {
        const scoreData = s as any;
        setScores({
          experian_score: scoreData.experian_score,
          equifax_score: scoreData.equifax_score,
          transunion_score: scoreData.transunion_score,
        });
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({ title: 'Error', description: 'Failed to load client data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const { error: clientErr } = await supabase.from('clients')
        .update({
          full_name: client.full_name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          dob: client.dob,
          ssn_last4: client.ssn_last4,
          membership_plan: client.membership_plan,
          workflow_status: client.workflow_status,
          priority_level: client.priority_level,
          round_number: client.round_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);
      if (clientErr) throw clientErr;

      // Upsert credit scores
      const { error: scoreErr } = await supabase.from('client_credit_scores' as any)
        .upsert(
          {
            client_id: client.id,
            user_id: client.user_id,
            ...scores,
            source: 'manual',
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: 'client_id' }
        );
      if (scoreErr) throw scoreErr;

      toast({ title: 'Client Updated', description: 'All changes saved successfully.' });

      // Fire automation events (non-blocking)
      try {
        await supabase.functions.invoke('process-automation-event', {
          body: { event_type: 'client_profile_updated', client_id: client.id, user_id: client.user_id, payload: { updated_by: 'admin' }, source: 'admin_editor' },
        });
        if (scores.experian_score || scores.equifax_score || scores.transunion_score) {
          await supabase.functions.invoke('process-automation-event', {
            body: { event_type: 'score_updated', client_id: client.id, user_id: client.user_id, payload: scores, source: 'admin_editor' },
          });
        }
      } catch (autoErr) {
        console.log('Automation event skipped:', autoErr);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDisputes = async () => {
    if (!client) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-dispute-ai', {
        body: { client_id: client.id, mode: 'manual' },
      });
      if (error) throw error;
      toast({ title: 'Disputes Generated', description: `${data?.cases_created || 0} dispute cases created.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const updateField = (field: keyof ClientData, value: string | number | null) => {
    if (!client) return;
    setClient({ ...client, [field]: value });
  };

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2" />
          <p className="text-muted-foreground">Loading client data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">Return Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Client Not Found</CardTitle>
              <CardDescription>The requested client could not be loaded.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/admin/clients')} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />Back to Clients
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Luxury Header */}
        <LuxuryCard variant="midnight" accent className="p-6 md:p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
            <EyebrowLabel className="text-ivory/60">Client Profile</EyebrowLabel>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="lux-display text-3xl md:text-4xl text-ivory tracking-tight">{client.full_name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs uppercase tracking-[0.18em] text-ivory/50">ID {client.id.slice(0, 8)}</span>
                {client.membership_plan && (
                  <StatusBadge
                    status={(client.membership_plan.toLowerCase() === 'elite' || client.membership_plan.toLowerCase() === 'vip') ? 'elite' : client.membership_plan.toLowerCase() === 'pro' ? 'pro' : 'basic'}
                    label={client.membership_plan}
                  />
                )}
                {client.workflow_status && (
                  <StatusBadge
                    status={client.workflow_status === 'completed' ? 'completed' : 'in-progress'}
                    label={client.workflow_status.replace(/_/g, ' ')}
                  />
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" onClick={() => window.open(`/admin/client-preview/${client.id}`, '_blank')} className="bg-white/5 border-white/20 text-ivory hover:bg-white/10 hover:text-ivory">
                <Eye className="h-4 w-4 mr-2" />Preview Portal
              </Button>
              <Button onClick={() => navigate('/admin/clients')} variant="ghost" className="text-ivory/80 hover:bg-white/10 hover:text-ivory">
                <ArrowLeft className="h-4 w-4 mr-2" />Back
              </Button>
            </div>
          </div>
        </LuxuryCard>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="overview"><User className="h-3.5 w-3.5 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="results"><CreditCard className="h-3.5 w-3.5 mr-1" />Results Override</TabsTrigger>
            <TabsTrigger value="reports"><FileSearch className="h-3.5 w-3.5 mr-1" />Reports</TabsTrigger>
            <TabsTrigger value="disputes"><Gavel className="h-3.5 w-3.5 mr-1" />Disputes</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Documents</TabsTrigger>
            <TabsTrigger value="payments"><Wallet className="h-3.5 w-3.5 mr-1" />Payments</TabsTrigger>
            <TabsTrigger value="agreements"><ScrollText className="h-3.5 w-3.5 mr-1" />Agreements</TabsTrigger>
            <TabsTrigger value="notes"><StickyNote className="h-3.5 w-3.5 mr-1" />Notes</TabsTrigger>
            <TabsTrigger value="activity"><Activity className="h-3.5 w-3.5 mr-1" />Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main edit form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={client.full_name} onChange={e => updateField('full_name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={client.email || ''} onChange={e => updateField('email', e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={client.phone} onChange={e => updateField('phone', e.target.value)} />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input value={client.address} onChange={e => updateField('address', e.target.value)} />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={client.dob} onChange={e => updateField('dob', e.target.value)} />
                  </div>
                  <div>
                    <Label>SSN Last 4</Label>
                    <Input value={client.ssn_last4} maxLength={4} onChange={e => updateField('ssn_last4', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status & Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Status & Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Membership Plan</Label>
                    <Select value={client.membership_plan || 'Basic'} onValueChange={v => updateField('membership_plan', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                        <SelectItem value="Elite">Elite</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Workflow Status</Label>
                    <Select value={client.workflow_status || 'needs_credit_report'} onValueChange={v => updateField('workflow_status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="needs_credit_report">Needs Credit Report</SelectItem>
                        <SelectItem value="ready_to_push">Ready to Push</SelectItem>
                        <SelectItem value="ready_for_605b">Ready for 605B</SelectItem>
                        <SelectItem value="round_2">Round 2</SelectItem>
                        <SelectItem value="cfpb_escalation">CFPB Escalation</SelectItem>
                        <SelectItem value="monitor">Monitor</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority Level</Label>
                    <Select value={client.priority_level || 'medium'} onValueChange={v => updateField('priority_level', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Round Number</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={client.round_number ?? 1}
                      onChange={e => updateField('round_number', e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credit Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Credit Scores
                  <Badge variant="outline">Admin Override</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Experian</Label>
                    <Input
                      type="number" min={300} max={850} placeholder="---"
                      value={scores.experian_score ?? ''}
                      onChange={e => setScores({ ...scores, experian_score: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Equifax</Label>
                    <Input
                      type="number" min={300} max={850} placeholder="---"
                      value={scores.equifax_score ?? ''}
                      onChange={e => setScores({ ...scores, equifax_score: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">TransUnion</Label>
                    <Input
                      type="number" min={300} max={850} placeholder="---"
                      value={scores.transunion_score ?? ''}
                      onChange={e => setScores({ ...scores, transunion_score: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Bar */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={handleGenerateDisputes} disabled={generating} variant="outline">
                <Zap className="h-4 w-4 mr-2" />{generating ? 'Generating...' : 'Generate Disputes'}
              </Button>
            </div>
          </div>

          {/* Right column - meta */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Record Info</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Created: {new Date(client.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(client.updated_at).toLocaleString()}</p>
                {client.user_id && <p>Auth User ID: {client.user_id.slice(0, 8)}...</p>}
                {!client.user_id && <p className="text-amber-500">No linked auth account</p>}
              </CardContent>
            </Card>
          </div>
            </div>
          </TabsContent>

          <TabsContent value="results">
            <ResultsOverridePanel clientId={client.id} />
          </TabsContent>

          <TabsContent value="reports">
            <ClientCrossLinkCard
              title="Credit Reports"
              description="Upload a new credit report or view the report archive for this client."
              primaryHref={`/admin/upload-reports?clientId=${client.id}`}
              primaryLabel="Upload Report"
              secondaryHref={`/admin/reports?clientId=${client.id}`}
              secondaryLabel="View All Reports"
            />
          </TabsContent>

          <TabsContent value="disputes">
            <ClientCrossLinkCard
              title="Disputes"
              description="Review dispute cases, generate letters, and track round progress."
              primaryHref={`/admin/disputes?clientId=${client.id}`}
              primaryLabel="Open Disputes"
            />
          </TabsContent>

          <TabsContent value="documents">
            <ClientCrossLinkCard
              title="Documents"
              description="Review uploaded identification, proofs, and supporting documents."
              primaryHref={`/admin/documents?clientId=${client.id}`}
              primaryLabel="Open Documents"
            />
          </TabsContent>

          <TabsContent value="payments">
            <ClientCrossLinkCard
              title="Payments"
              description="Review payment proof submissions, history, and outstanding balances."
              primaryHref={`/admin/payments?clientId=${client.id}`}
              primaryLabel="Open Payments"
            />
          </TabsContent>

          <TabsContent value="agreements">
            <ClientCrossLinkCard
              title="Agreements"
              description="View signed agreements and pending signature requests."
              primaryHref={`/admin/agreements?clientId=${client.id}`}
              primaryLabel="Open Agreements"
            />
          </TabsContent>

          <TabsContent value="notes">
            <AdminNotesPanel clientId={client.id} clientName={client.full_name} />
          </TabsContent>

          <TabsContent value="activity">
            <ClientActivityTimeline clientId={client.id} userId={client.user_id || undefined} limit={50} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ClientCrossLinkCard({
  title, description, primaryHref, primaryLabel, secondaryHref, secondaryLabel,
}: {
  title: string; description: string;
  primaryHref: string; primaryLabel: string;
  secondaryHref?: string; secondaryLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={primaryHref}><ExternalLink className="h-4 w-4 mr-2" />{primaryLabel}</a>
        </Button>
        {secondaryHref && secondaryLabel && (
          <Button asChild variant="outline">
            <a href={secondaryHref}><ExternalLink className="h-4 w-4 mr-2" />{secondaryLabel}</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
