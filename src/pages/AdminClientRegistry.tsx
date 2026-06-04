import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AdminShell } from '@/components/admin/AdminShell';
import { useClientRegistry, logRegistryAction, type MissingProfile, type OrphanIdentity, type RegistryClient } from '@/hooks/useClientRegistry';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRoles } from '@/hooks/useRoles';
import { RefreshCw, UserPlus, Link2, EyeOff, Search, AlertTriangle, ShieldCheck, Users } from 'lucide-react';

function KpiCard({ label, value, tone = 'text-foreground', hint }: { label: string; value: number | string; tone?: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </Card>
  );
}

export default function AdminClientRegistry() {
  const navigate = useNavigate();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const { toast } = useToast();
  const snap = useClientRegistry();
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCreate, setConfirmCreate] = useState<MissingProfile | null>(null);
  const [attachOrphan, setAttachOrphan] = useState<OrphanIdentity | null>(null);
  const [attachTarget, setAttachTarget] = useState<string>('');

  if (!rolesLoading && !isAdmin()) {
    navigate('/');
    return null;
  }

  const filteredClients = useMemo(() => {
    if (!search.trim()) return snap.clients;
    const q = search.toLowerCase();
    return snap.clients.filter((c) =>
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q),
    );
  }, [snap.clients, search]);

  const healthPct = (() => {
    const reconciled = snap.totals.registeredClients;
    const total = snap.totals.totalPotentialIdentities || 1;
    return Math.round((reconciled / total) * 100);
  })();

  const createClientFromProfile = async (p: MissingProfile) => {
    setBusyId(p.user_id);
    try {
      const full_name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || (p.email ? p.email.split('@')[0] : 'Unknown Client');
      const { data, error } = await supabase
        .from('clients')
        .insert({
          full_name,
          email: p.email,
          user_id: p.user_id,
          membership_plan: p.membership_type ?? null,
          portal_status: 'active',
        } as any)
        .select('id')
        .single();
      if (error) throw error;
      await logRegistryAction('CREATE_FROM_PROFILE', { source: 'profiles', source_user_id: p.user_id, new_client_id: data?.id, email: p.email }, data?.id);
      toast({ title: 'Client created', description: `${full_name} added to clients.` });
      setConfirmCreate(null);
      snap.refresh();
    } catch (err: any) {
      toast({ title: 'Create failed', description: err?.message || 'Could not create client', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const linkProfileToClient = async (p: MissingProfile, clientId: string) => {
    setBusyId(p.user_id);
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ user_id: p.user_id, updated_at: new Date().toISOString() } as any)
        .eq('id', clientId)
        .is('user_id', null)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast({ title: 'Already linked', description: 'Target client already has a portal account linked.', variant: 'destructive' });
        return;
      }
      await logRegistryAction('LINK_PROFILE_TO_CLIENT', { source_user_id: p.user_id, client_id: clientId }, clientId);
      toast({ title: 'Linked', description: 'Profile linked to existing client.' });
      snap.refresh();
    } catch (err: any) {
      toast({ title: 'Link failed', description: err?.message || 'Could not link', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const createClientFromOrphan = async (o: OrphanIdentity) => {
    setBusyId(o.user_id);
    try {
      const full_name = o.label || `Recovered from ${o.source}`;
      const { data, error } = await supabase
        .from('clients')
        .insert({
          full_name,
          user_id: o.user_id,
          portal_status: 'active',
          admin_notes: `Reconciled from ${o.source} during registry recovery.`,
        } as any)
        .select('id')
        .single();
      if (error) throw error;
      await logRegistryAction('CREATE_FROM_ORPHAN', { source: o.source, source_user_id: o.user_id, new_client_id: data?.id }, data?.id);
      toast({ title: 'Client created', description: `Recovered client from ${o.source}.` });
      snap.refresh();
    } catch (err: any) {
      toast({ title: 'Create failed', description: err?.message || 'Could not create client', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const attachOrphanToExistingClient = async () => {
    if (!attachOrphan || !attachTarget) return;
    setBusyId(attachOrphan.user_id);
    try {
      // Re-key feature rows from user_id to existing client_id where missing.
      const sb: any = supabase;
      if (attachOrphan.source === 'payment_records') {
        await sb.from('payment_records').update({ client_id: attachTarget }).eq('user_id', attachOrphan.user_id).is('client_id', null);
      } else if (attachOrphan.source === 'credit_report_uploads') {
        await sb.from('credit_report_uploads').update({ client_id: attachTarget }).eq('user_id', attachOrphan.user_id).is('client_id', null);
      } else if (attachOrphan.source === 'client_agreements') {
        await sb.from('client_agreements').update({ client_id: attachTarget }).eq('user_id', attachOrphan.user_id).is('client_id', null);
      }
      await logRegistryAction('ATTACH_ORPHAN_TO_CLIENT', { source: attachOrphan.source, source_user_id: attachOrphan.user_id, client_id: attachTarget }, attachTarget);
      toast({ title: 'Attached', description: 'Orphan records re-keyed to target client.' });
      setAttachOrphan(null); setAttachTarget('');
      snap.refresh();
    } catch (err: any) {
      toast({ title: 'Attach failed', description: err?.message || 'Could not attach', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const markNotAClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ not_a_client: true, updated_at: new Date().toISOString() } as any)
        .eq('id', clientId);
      if (error) throw error;
      await logRegistryAction('MARK_NOT_A_CLIENT', { client_id: clientId }, clientId);
      toast({ title: 'Hidden from suggestions', description: 'Marked as not a client.' });
      snap.refresh();
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.message || 'Could not update', variant: 'destructive' });
    }
  };

  return (
    <AdminShell title="Client Registry">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Client Registry Reconciliation</h2>
            <p className="text-sm text-muted-foreground">Find missing clients, attach orphan records, and link profiles to portal accounts. No silent merges.</p>
          </div>
          <Button size="sm" variant="outline" onClick={snap.refresh} disabled={snap.loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${snap.loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Registered Clients" value={snap.totals.registeredClients} tone="text-amber-500" />
          <KpiCard label="Profiles" value={snap.totals.profiles} />
          <KpiCard label="Portal Linked" value={snap.totals.portalLinked} tone="text-emerald-500" />
          <KpiCard label="No Portal Login" value={snap.totals.clientsWithoutPortal} tone="text-amber-400" />
          <KpiCard label="Profiles Missing Client" value={snap.totals.profilesMissingClient} tone="text-rose-500" />
          <KpiCard label="Possible Duplicates" value={snap.totals.possibleDuplicates} tone="text-fuchsia-500" />
          <KpiCard label="Orphan Reports" value={snap.totals.reportsOrphan} />
          <KpiCard label="Orphan Documents" value={snap.totals.documentsOrphan} />
          <KpiCard label="Orphan Payments" value={snap.totals.paymentsOrphan} />
          <KpiCard label="Orphan Agreements" value={snap.totals.agreementsOrphan} />
          <KpiCard label="Orphan Disputes" value={snap.totals.disputesOrphan} />
          <KpiCard
            label="Registry Health"
            value={`${healthPct}%`}
            tone={healthPct >= 95 ? 'text-emerald-500' : healthPct >= 75 ? 'text-amber-500' : 'text-rose-500'}
            hint={`${snap.totals.totalPotentialIdentities} potential identities`}
          />
        </div>

        {snap.totals.profilesMissingClient + snap.totals.reportsOrphan + snap.totals.documentsOrphan + snap.totals.paymentsOrphan + snap.totals.agreementsOrphan + snap.totals.disputesOrphan > 0 && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Potential unreconciled client records found.</p>
                <p className="text-muted-foreground">Use the tabs below to review and act on each item. No silent merges occur — every reconciliation needs an admin confirmation.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="missing">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="registered">Registered ({snap.totals.registeredClients})</TabsTrigger>
            <TabsTrigger value="missing">Missing From Clients ({snap.totals.profilesMissingClient})</TabsTrigger>
            <TabsTrigger value="orphans">Orphan Identities ({snap.orphanIdentities.length})</TabsTrigger>
            <TabsTrigger value="duplicates">Possible Duplicates ({snap.totals.possibleDuplicates})</TabsTrigger>
            <TabsTrigger value="needs-link">Needs Portal Link ({snap.needsPortalLink.length})</TabsTrigger>
          </TabsList>

          {/* Registered */}
          <TabsContent value="registered" className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search registered clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Portal</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((c) => (
                      <TableRow key={c.id} className={c.not_a_client ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{c.full_name || '—'}</TableCell>
                        <TableCell>{c.email || '—'}</TableCell>
                        <TableCell>{c.phone || '—'}</TableCell>
                        <TableCell>
                          {c.user_id
                            ? <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">Linked</Badge>
                            : <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500">Not linked</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/clients/${c.id}`)}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Missing From Clients */}
          <TabsContent value="missing" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Profiles without a client row</CardTitle>
                <CardDescription>Profiles that have no matching <code>clients</code> record by <code>user_id</code> or <code>email</code>.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name / Email</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Suggested match</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snap.missingProfiles.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">No unreconciled profiles. Everyone has a client row.</TableCell></TableRow>
                    )}
                    {snap.missingProfiles.map((p) => {
                      const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
                      return (
                        <TableRow key={p.user_id}>
                          <TableCell>
                            <p className="font-medium">{name || (p.email || p.user_id.slice(0, 8))}</p>
                            <p className="text-xs text-muted-foreground">{p.email || 'no email'}</p>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px] capitalize">{p.membership_type || '—'}</Badge></TableCell>
                          <TableCell>
                            {p.suggested_client_id ? (
                              <div className="text-xs">
                                <span className="font-medium">{p.suggested_client_label}</span>
                                <span className="ml-2 text-muted-foreground">conf {p.suggested_confidence}</span>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">No match</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Button size="sm" variant="outline" disabled={busyId === p.user_id} onClick={() => setConfirmCreate(p)}>
                                <UserPlus className="h-3 w-3 mr-1" /> Create client
                              </Button>
                              {p.suggested_client_id && (
                                <Button size="sm" variant="ghost" disabled={busyId === p.user_id} onClick={() => linkProfileToClient(p, p.suggested_client_id!)}>
                                  <Link2 className="h-3 w-3 mr-1" /> Link to suggestion
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orphans */}
          <TabsContent value="orphans" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Orphan owner identities</CardTitle>
                <CardDescription>Rows in feature tables whose owner <code>user_id</code> has no matching client.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snap.orphanIdentities.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No orphan identities.</TableCell></TableRow>
                    )}
                    {snap.orphanIdentities.map((o) => (
                      <TableRow key={`${o.source}-${o.user_id}`}>
                        <TableCell><Badge variant="outline" className="text-[10px]">{o.source}</Badge></TableCell>
                        <TableCell><code className="text-xs">{o.user_id.slice(0, 8)}…</code></TableCell>
                        <TableCell className="text-xs">{o.label || '—'}</TableCell>
                        <TableCell>{o.count}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button size="sm" variant="outline" disabled={busyId === o.user_id} onClick={() => createClientFromOrphan(o)}>
                              <UserPlus className="h-3 w-3 mr-1" /> Create client
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setAttachOrphan(o); setAttachTarget(''); }}>
                              <Link2 className="h-3 w-3 mr-1" /> Attach to existing
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Duplicates */}
          <TabsContent value="duplicates" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Possible duplicate clients</CardTitle>
                <CardDescription>Clients that share an email or normalized name. Resolve manually — no silent merges.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {snap.duplicates.length === 0 && <p className="text-sm text-muted-foreground py-3">No duplicates detected.</p>}
                {snap.duplicates.map((g) => (
                  <div key={`${g.reason}-${g.key}`} className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase text-muted-foreground mb-2">
                      {g.reason === 'email' ? 'Shared email' : 'Shared name'}: <span className="font-mono text-foreground">{g.key}</span>
                    </p>
                    <div className="space-y-1">
                      {g.clients.map((c) => (
                        <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <span className="font-medium">{c.full_name || '—'}</span>
                            <span className="text-muted-foreground"> · {c.email || 'no email'} · {c.phone || 'no phone'}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/clients/${c.id}`)}>Edit</Button>
                            <Button size="sm" variant="ghost" onClick={() => markNotAClient(c.id)}>
                              <EyeOff className="h-3 w-3 mr-1" /> Not a client
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Needs Portal Link */}
          <TabsContent value="needs-link" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Clients without portal logins</CardTitle>
                <CardDescription>These client rows have no <code>user_id</code>. Edit them to link an existing profile or mark invite needed.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snap.needsPortalLink.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">All client rows are linked to portal accounts.</TableCell></TableRow>
                    )}
                    {snap.needsPortalLink.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.full_name || '—'}</TableCell>
                        <TableCell>{c.email || '—'}</TableCell>
                        <TableCell>{c.phone || '—'}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/clients/${c.id}`)}>Open client editor</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Create From Profile */}
      <Dialog open={!!confirmCreate} onOpenChange={(o) => !o && setConfirmCreate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create client from profile?</DialogTitle>
            <DialogDescription>
              A new <code>clients</code> row will be created and linked to this profile's auth account.
              You can fill in DOB, address, phone, and SSN last 4 later from the client editor.
            </DialogDescription>
          </DialogHeader>
          {confirmCreate && (
            <div className="text-sm space-y-1">
              <p><strong>Name:</strong> {[confirmCreate.first_name, confirmCreate.last_name].filter(Boolean).join(' ') || '—'}</p>
              <p><strong>Email:</strong> {confirmCreate.email || '—'}</p>
              <p><strong>Membership:</strong> {confirmCreate.membership_type || '—'}</p>
              <p><strong>Auth user:</strong> <code className="text-xs">{confirmCreate.user_id}</code></p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCreate(null)}>Cancel</Button>
            <Button onClick={() => confirmCreate && createClientFromProfile(confirmCreate)} disabled={busyId === confirmCreate?.user_id}>
              <UserPlus className="h-4 w-4 mr-1" /> Create & link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach orphan dialog */}
      <Dialog open={!!attachOrphan} onOpenChange={(o) => { if (!o) { setAttachOrphan(null); setAttachTarget(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach orphan records to existing client</DialogTitle>
            <DialogDescription>
              Re-keys rows in <code>{attachOrphan?.source}</code> whose <code>user_id</code> matches but <code>client_id</code> is null.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Target client</p>
            <select className="w-full border rounded px-2 py-1.5 bg-background" value={attachTarget} onChange={(e) => setAttachTarget(e.target.value)}>
              <option value="">Select a client…</option>
              {snap.clients.filter((c) => !c.not_a_client).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.id} {c.email ? `· ${c.email}` : ''}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAttachOrphan(null); setAttachTarget(''); }}>Cancel</Button>
            <Button onClick={attachOrphanToExistingClient} disabled={!attachTarget || busyId === attachOrphan?.user_id}>
              <Link2 className="h-4 w-4 mr-1" /> Attach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}