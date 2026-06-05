import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminShell } from '@/components/admin/AdminShell';
import { useClientRegistry, logRegistryAction, type MissingProfile, type OrphanIdentity, type RegistryClient, type RegistryTag } from '@/hooks/useClientRegistry';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRoles } from '@/hooks/useRoles';
import { RefreshCw, UserPlus, Link2, EyeOff, Search, AlertTriangle, ShieldCheck, Users, CheckCircle2, Circle, History, Download, Zap } from 'lucide-react';

const TAG_STYLES: Record<RegistryTag, string> = {
  'Registered': 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  'Reconciled': 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  'Profile Only': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  'Needs Client Row': 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  'Needs Portal Link': 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  'Duplicate Risk': 'bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/30',
  'Orphan Data': 'bg-rose-500/15 text-rose-500 border-rose-500/30',
  'Not Client': 'bg-muted text-muted-foreground border-border',
  'Prospect': 'bg-sky-500/15 text-sky-500 border-sky-500/30',
  'Test Account': 'bg-muted text-muted-foreground border-border',
  'Ignored': 'bg-muted text-muted-foreground border-border',
  'Archived': 'bg-muted text-muted-foreground border-border',
};

function TagChips({ tags }: { tags: RegistryTag[] | undefined }) {
  if (!tags?.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded border ${TAG_STYLES[t]}`}>{t}</span>
      ))}
    </div>
  );
}

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
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [engineRunning, setEngineRunning] = useState(false);
  const [enginePreview, setEnginePreview] = useState<any>(null);
  const [engineLast, setEngineLast] = useState<any>(null);

  const runEngine = async (dryRun: boolean) => {
    setEngineRunning(true);
    try {
      const { data, error } = await (supabase as any).rpc('reconcile_client_links', { dry_run: dryRun });
      if (error) throw error;
      if (dryRun) setEnginePreview(data);
      else { setEngineLast(data); setEnginePreview(null); await snap.refresh(); }
      toast({
        title: dryRun ? 'Dry run complete' : 'Reconciliation executed',
        description: `Profiles linked: ${data.profiles_linked_to_clients} · Reports: ${data.reports_relinked} · Payments: ${data.payments_relinked} · Agreements: ${data.agreements_relinked} · Disputes: ${data.disputes_relinked} · Documents: ${data.documents_relinked}`,
      });
    } catch (e: any) {
      toast({ title: 'Engine failed', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setEngineRunning(false);
    }
  };

  if (!rolesLoading && !isAdmin()) {
    navigate('/');
    return null;
  }

  const norm = (s: string | null | undefined) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  // Compute bulk-eligibility for each selected profile.
  const bulkEval = useMemo(() => {
    const selectedProfiles = snap.missingProfiles.filter((p) => selected[p.user_id]);
    const emailToClient = new Map(snap.clients.filter((c) => c.email).map((c) => [c.email!.toLowerCase(), c]));
    const nameToClients = new Map<string, RegistryClient[]>();
    snap.clients.forEach((c) => {
      const nk = norm(c.full_name);
      if (!nk) return;
      const arr = nameToClients.get(nk) || [];
      arr.push(c); nameToClients.set(nk, arr);
    });
    const emailSeen = new Map<string, number>();
    selectedProfiles.forEach((p) => {
      const e = (p.email || '').toLowerCase();
      if (e) emailSeen.set(e, (emailSeen.get(e) || 0) + 1);
    });
    const toCreate: MissingProfile[] = [];
    const toSkip: { profile: MissingProfile; reason: string }[] = [];
    selectedProfiles.forEach((p) => {
      const e = (p.email || '').toLowerCase();
      const nk = norm([p.first_name, p.last_name].filter(Boolean).join(' '));
      if (!e) { toSkip.push({ profile: p, reason: 'No email — manual review required' }); return; }
      if (emailToClient.has(e)) { toSkip.push({ profile: p, reason: 'Email already on a client row' }); return; }
      if ((emailSeen.get(e) || 0) > 1) { toSkip.push({ profile: p, reason: 'Email duplicated in this batch' }); return; }
      if (nk && (nameToClients.get(nk)?.length || 0) > 0) { toSkip.push({ profile: p, reason: 'Normalized name matches existing client' }); return; }
      toCreate.push(p);
    });
    return { selectedProfiles, toCreate, toSkip };
  }, [selected, snap.missingProfiles, snap.clients]);

  const selectedCount = bulkEval.selectedProfiles.length;

  const toggleSelected = (uid: string) =>
    setSelected((s) => ({ ...s, [uid]: !s[uid] }));
  const toggleSelectAllMissing = () => {
    const all = snap.missingProfiles.every((p) => selected[p.user_id]);
    const next: Record<string, boolean> = {};
    if (!all) snap.missingProfiles.forEach((p) => (next[p.user_id] = true));
    setSelected(next);
  };

  const runBulkCreate = async () => {
    setBulkRunning(true);
    let created = 0; let failed = 0;
    for (const p of bulkEval.toCreate) {
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
        created += 1;
        await logRegistryAction('BULK_CREATE_FROM_PROFILE', { source_user_id: p.user_id, new_client_id: data?.id, email: p.email }, data?.id);
      } catch (err: any) {
        failed += 1;
        await logRegistryAction('BULK_CREATE_FAILED', { source_user_id: p.user_id, email: p.email, error: err?.message || 'unknown' });
      }
    }
    setBulkRunning(false);
    setBulkPreviewOpen(false);
    setSelected({});
    toast({
      title: 'Bulk reconciliation complete',
      description: `${created} created · ${failed} failed · ${bulkEval.toSkip.length} skipped`,
      variant: failed > 0 ? 'destructive' : 'default',
    });
    snap.refresh();
  };

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

  const excludeProfile = async (
    p: MissingProfile,
    status: 'prospect' | 'not_client' | 'test_account' | 'ignored',
  ) => {
    setBusyId(p.user_id);
    try {
      const sb: any = supabase;
      const { error } = await sb
        .from('client_registry_exclusions')
        .upsert(
          {
            source_type: 'profile',
            source_id: p.user_id,
            email: p.email,
            name: [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || null,
            status,
            reason: `Marked ${status} by admin`,
          },
          { onConflict: 'source_type,source_id' },
        );
      if (error) throw error;
      await logRegistryAction('EXCLUDE_PROFILE', { source_user_id: p.user_id, status, email: p.email });
      toast({ title: 'Marked', description: `Profile marked ${status.replace('_', ' ')}.` });
      snap.refresh();
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.message || 'Could not mark profile', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const archiveOrphan = async (o: OrphanIdentity) => {
    setBusyId(o.user_id);
    try {
      const sb: any = supabase;
      const key = `${o.source}::${o.user_id}`;
      const { error } = await sb
        .from('client_registry_exclusions')
        .upsert(
          {
            source_type: 'orphan_identity',
            source_id: key,
            name: o.label,
            status: 'archived',
            reason: `Archived orphan ${o.source}`,
          },
          { onConflict: 'source_type,source_id' },
        );
      if (error) throw error;
      await logRegistryAction('ARCHIVE_ORPHAN', { source: o.source, source_user_id: o.user_id });
      toast({ title: 'Archived', description: 'Orphan identity archived.' });
      snap.refresh();
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.message || 'Could not archive', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const escapeCsv = (v: string | number | null | undefined) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const exportReconciliationPreviewCsv = () => {
    const now = new Date().toISOString().replace(/[:.]/g, '-');
    const lines: string[] = [];

    // Section 1: Summary
    lines.push('Reconciliation Preview Summary');
    lines.push(`Generated,${escapeCsv(now)}`);
    lines.push(`Selected Records,${selectedCount}`);
    lines.push(`Clients to Create,${bulkEval.toCreate.length}`);
    lines.push(`Skipped Records,${bulkEval.toSkip.length}`);
    lines.push(`Duplicate Risk Groups,${snap.duplicates.length}`);
    lines.push('');

    // Section 2: Selected Records
    lines.push('Selected Records');
    lines.push('User ID,First Name,Last Name,Email,Membership Type,Tags');
    for (const p of bulkEval.selectedProfiles) {
      const tags = (snap.profileTags[p.user_id] || []).join('; ');
      lines.push([p.user_id, p.first_name, p.last_name, p.email, p.membership_type, tags].map(escapeCsv).join(','));
    }
    lines.push('');

    // Section 3: Clients to Create
    lines.push('Clients to Create');
    lines.push('User ID,Full Name,Email,Membership Type,Portal Status,Admin Notes');
    for (const p of bulkEval.toCreate) {
      const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || (p.email ? p.email.split('@')[0] : 'Unknown Client');
      lines.push([p.user_id, fullName, p.email, p.membership_type || '', 'active', 'Bulk reconciliation'].map(escapeCsv).join(','));
    }
    lines.push('');

    // Section 4: Links to Be Made (suggested matches among selected)
    lines.push('Links to Be Made (Suggested Matches)');
    lines.push('User ID,First Name,Last Name,Email,Suggested Client ID,Suggested Client Name,Confidence');
    for (const p of bulkEval.selectedProfiles) {
      if (p.suggested_client_id) {
        lines.push([p.user_id, p.first_name, p.last_name, p.email, p.suggested_client_id, p.suggested_client_label, `${p.suggested_confidence}%`].map(escapeCsv).join(','));
      }
    }
    if (!bulkEval.selectedProfiles.some((p) => p.suggested_client_id)) {
      lines.push('No suggested links for selected records');
    }
    lines.push('');

    // Section 5: Skipped Records
    lines.push('Skipped Records');
    lines.push('User ID,First Name,Last Name,Email,Skip Reason');
    for (const { profile: p, reason } of bulkEval.toSkip) {
      lines.push([p.user_id, p.first_name, p.last_name, p.email, reason].map(escapeCsv).join(','));
    }
    lines.push('');

    // Section 6: Duplicate Risks
    lines.push('Duplicate Risk Groups');
    lines.push('Reason,Key,Client ID,Client Name,Email,Phone,User ID');
    for (const g of snap.duplicates) {
      for (const c of g.clients) {
        lines.push([g.reason, g.key, c.id, c.full_name, c.email, c.phone, c.user_id || ''].map(escapeCsv).join(','));
      }
    }
    if (snap.duplicates.length === 0) {
      lines.push('No duplicate risks detected');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-preview-${now}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <TabsTrigger value="engine">Reconciliation Engine</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail ({snap.recentAudit.length})</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
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
                      <TableHead>Tags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((c) => (
                      <TableRow key={c.id} className={c.not_a_client ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{c.full_name || '—'}</TableCell>
                        <TableCell>{c.email || '—'}</TableCell>
                        <TableCell>{c.phone || '—'}</TableCell>
                        <TableCell><TagChips tags={snap.clientTags[c.id]} /></TableCell>
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
            {snap.missingProfiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Button size="sm" variant="outline" onClick={toggleSelectAllMissing}>
                    {snap.missingProfiles.every((p) => selected[p.user_id]) ? 'Clear selection' : 'Select all'}
                  </Button>
                  <span className="text-muted-foreground">{selectedCount} selected</span>
                </div>
                <Button size="sm" disabled={selectedCount === 0} onClick={() => setBulkPreviewOpen(true)}>
                  <UserPlus className="h-3 w-3 mr-1" /> Bulk review & create
                </Button>
              </div>
            )}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Profiles without a client row</CardTitle>
                <CardDescription>Profiles that have no matching <code>clients</code> record by <code>user_id</code> or <code>email</code>.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Name / Email</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Suggested match</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snap.missingProfiles.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No unreconciled profiles. Everyone has a client row.</TableCell></TableRow>
                    )}
                    {snap.missingProfiles.map((p) => {
                      const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
                      return (
                        <TableRow key={p.user_id}>
                          <TableCell>
                            <Checkbox checked={!!selected[p.user_id]} onCheckedChange={() => toggleSelected(p.user_id)} />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{name || (p.email || p.user_id.slice(0, 8))}</p>
                            <p className="text-xs text-muted-foreground">{p.email || 'no email'}</p>
                          </TableCell>
                          <TableCell><TagChips tags={snap.profileTags[p.user_id]} /></TableCell>
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
                              <Button size="sm" variant="ghost" disabled={busyId === p.user_id} onClick={() => excludeProfile(p, 'prospect')}>
                                Prospect
                              </Button>
                              <Button size="sm" variant="ghost" disabled={busyId === p.user_id} onClick={() => excludeProfile(p, 'not_client')}>
                                Not client
                              </Button>
                              <Button size="sm" variant="ghost" disabled={busyId === p.user_id} onClick={() => excludeProfile(p, 'test_account')}>
                                Test
                              </Button>
                              <Button size="sm" variant="ghost" disabled={busyId === p.user_id} onClick={() => excludeProfile(p, 'ignored')}>
                                <EyeOff className="h-3 w-3 mr-1" /> Ignore
                              </Button>
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
                            <Button size="sm" variant="ghost" disabled={busyId === o.user_id} onClick={() => archiveOrphan(o)}>
                              <EyeOff className="h-3 w-3 mr-1" /> Archive
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
                <CardDescription>These client rows have no <code>user_id</code>. When a unique profile email matches, you can link the portal account directly. No bulk auto-link.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Portal Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snap.needsPortalLink.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">All client rows are linked to portal accounts.</TableCell></TableRow>
                    )}
                    {snap.needsPortalLink.map((c) => {
                      const matchUserId = c.email ? snap.profileByEmail[c.email.toLowerCase()] : undefined;
                      const status = matchUserId
                        ? { label: 'Email Match Found', cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' }
                        : { label: 'No Portal Account', cls: 'bg-muted text-muted-foreground border-border' };
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.full_name || '—'}</TableCell>
                          <TableCell>{c.email || '—'}</TableCell>
                          <TableCell>{c.phone || '—'}</TableCell>
                          <TableCell>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${status.cls}`}>{status.label}</span>
                          </TableCell>
                          <TableCell className="space-x-2">
                            {matchUserId && (
                              <Button
                                size="sm"
                                disabled={busyId === c.id}
                                onClick={async () => {
                                  if (!confirm(`Link portal account for ${c.email}?\n\nThis sets clients.user_id = ${matchUserId} on this row only.`)) return;
                                  setBusyId(c.id);
                                  try {
                                    const { data, error } = await (supabase as any)
                                      .from('clients')
                                      .update({ user_id: matchUserId, updated_at: new Date().toISOString() })
                                      .eq('id', c.id)
                                      .is('user_id', null)
                                      .select('id')
                                      .maybeSingle();
                                    if (error) throw error;
                                    if (!data) throw new Error('Client is already linked or no longer eligible. Refresh and review before retrying.');
                                    await logRegistryAction('LINK_PORTAL_ACCOUNT', { client_id: c.id, email: c.email, profile_user_id: matchUserId }, c.id);
                                    toast({ title: 'Portal linked', description: `${c.email} is now linked.` });
                                    await snap.refresh();
                                  } catch (e: any) {
                                    toast({ title: 'Link failed', description: e?.message || 'Could not link account', variant: 'destructive' });
                                  } finally {
                                    setBusyId(null);
                                  }
                                }}
                              >
                                <Link2 className="h-3.5 w-3.5 mr-1" /> Link Portal Account
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/clients/${c.id}`)}>Open editor</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Trail */}
          <TabsContent value="audit" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Recent reconciliation actions</CardTitle>
                <CardDescription>Latest 50 registry actions from the audit log.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Target client</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snap.recentAudit.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No reconciliation actions yet.</TableCell></TableRow>
                    )}
                    {snap.recentAudit.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{a.action.replace(/^REGISTRY_/, '')}</Badge></TableCell>
                        <TableCell className="text-xs"><code>{a.user_id ? a.user_id.slice(0, 8) + '…' : '—'}</code></TableCell>
                        <TableCell className="text-xs">{a.details?.source || a.details?.source_user_id?.slice?.(0, 8) || '—'}</TableCell>
                        <TableCell className="text-xs"><code>{a.record_id ? a.record_id.slice(0, 8) + '…' : '—'}</code></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reconciliation Engine */}
          <TabsContent value="engine" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4" /> Deterministic reconciliation engine</CardTitle>
                <CardDescription>
                  Backfills <code>clients.user_id</code> from profiles by unique email match, then backfills <code>client_id</code> across
                  payments, credit reports, agreements, dispute letters, and documents whenever <code>user_id</code> resolves to exactly one client.
                  Never overwrites existing links. Never merges duplicates. Every run is logged to <code>audit_logs</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => runEngine(true)} disabled={engineRunning}>
                    {engineRunning ? 'Running…' : 'Dry run preview'}
                  </Button>
                  <Button size="sm" onClick={() => runEngine(false)} disabled={engineRunning || !enginePreview}>
                    Execute reconciliation
                  </Button>
                  {enginePreview && (
                    <Button size="sm" variant="ghost" onClick={() => setEnginePreview(null)} disabled={engineRunning}>Clear preview</Button>
                  )}
                </div>
                {!enginePreview && !engineLast && (
                  <p className="text-xs text-muted-foreground">Start with a dry run to see exactly what will change before executing.</p>
                )}
                {(enginePreview || engineLast) && (
                  <div className="rounded border border-border/60 p-3 text-sm space-y-1">
                    <p className="font-medium">
                      {enginePreview ? 'Dry run preview' : 'Last execution result'}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date((enginePreview || engineLast).ran_at).toLocaleString()}
                      </span>
                    </p>
                    {(['profiles_linked_to_clients','profiles_skipped_ambiguous','reports_relinked','payments_relinked','agreements_relinked','disputes_relinked','documents_relinked','document_archive_relinked'] as const).map((k) => {
                      const v = (enginePreview || engineLast)[k] ?? 0;
                      return (
                        <div key={k} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{k.replace(/_/g, ' ')}</span>
                          <span className={v > 0 ? 'font-semibold' : ''}>{v}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Trail (rendered list) */}
          {/* Checklist */}
          <TabsContent value="checklist" className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reconciliation completion checklist</CardTitle>
                <CardDescription>Live status of the data-repair workstream.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { ok: snap.totals.profilesMissingClient === 0, label: 'All real clients registered', detail: `${snap.totals.profilesMissingClient} profiles still need a client row` },
                  { ok: snap.totals.clientsWithoutPortal === 0, label: 'All portal users linked', detail: `${snap.totals.clientsWithoutPortal} clients without a portal user_id` },
                  { ok: snap.totals.reportsOrphan === 0, label: 'All orphan reports assigned', detail: `${snap.totals.reportsOrphan} credit report rows orphaned` },
                  { ok: snap.totals.paymentsOrphan === 0, label: 'All orphan payments assigned', detail: `${snap.totals.paymentsOrphan} payment rows orphaned` },
                  { ok: snap.totals.agreementsOrphan === 0, label: 'All orphan agreements assigned', detail: `${snap.totals.agreementsOrphan} agreement rows orphaned` },
                  { ok: snap.totals.possibleDuplicates === 0, label: 'Duplicate risks reviewed', detail: `${snap.totals.possibleDuplicates} duplicate groups outstanding` },
                  { ok: snap.totals.notClientCount > 0 || snap.totals.profilesMissingClient === 0, label: 'Non-client / test records marked', detail: `${snap.totals.notClientCount} rows flagged not-a-client` },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-2">
                    {row.ok
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                      : <Circle className="h-4 w-4 text-amber-500 mt-0.5" />}
                    <div>
                      <p className={row.ok ? 'text-foreground' : 'font-medium'}>{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.detail}</p>
                    </div>
                  </div>
                ))}
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

      {/* Bulk reconciliation preview */}
      <Dialog open={bulkPreviewOpen} onOpenChange={(o) => !o && setBulkPreviewOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Safe reconciliation preview</DialogTitle>
            <DialogDescription>
              No silent merges. Only profiles with a unique email and no name/email conflict will create new client rows.
              Skipped rows stay untouched for manual review.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded border border-border p-2">
              <p className="text-2xl font-bold">{selectedCount}</p>
              <p className="text-xs text-muted-foreground">Selected</p>
            </div>
            <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2">
              <p className="text-2xl font-bold text-emerald-500">{bulkEval.toCreate.length}</p>
              <p className="text-xs text-muted-foreground">Clients to create</p>
            </div>
            <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2">
              <p className="text-2xl font-bold text-amber-500">{bulkEval.toSkip.length}</p>
              <p className="text-xs text-muted-foreground">To skip</p>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-3 text-sm">
            {bulkEval.toCreate.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-500 uppercase mb-1">Will create</p>
                <ul className="space-y-1">
                  {bulkEval.toCreate.map((p) => (
                    <li key={p.user_id} className="text-xs flex justify-between gap-2 border-b border-border/40 pb-1">
                      <span className="truncate">{[p.first_name, p.last_name].filter(Boolean).join(' ') || p.email}</span>
                      <span className="text-muted-foreground truncate">{p.email}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bulkEval.toSkip.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-500 uppercase mb-1">Will skip</p>
                <ul className="space-y-1">
                  {bulkEval.toSkip.map(({ profile: p, reason }) => (
                    <li key={p.user_id} className="text-xs flex justify-between gap-2 border-b border-border/40 pb-1">
                      <span className="truncate">{[p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || p.user_id.slice(0, 8)}</span>
                      <span className="text-muted-foreground truncate">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-md border border-border bg-muted/30 p-2 text-xs space-y-1">
            <p className="font-semibold">Safety rules in effect</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              <li>No auto-merge of duplicate clients</li>
              <li>No deletion of profiles, clients, or orphan records</li>
              <li>Existing client.user_id values are never overwritten</li>
              <li>Profiles without an email are skipped from bulk create</li>
            </ul>
          </div>

          <DialogFooter className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportReconciliationPreviewCsv} disabled={bulkRunning} className="gap-1">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={() => setBulkPreviewOpen(false)} disabled={bulkRunning}>Cancel</Button>
            <Button onClick={runBulkCreate} disabled={bulkRunning || bulkEval.toCreate.length === 0}>
              <UserPlus className="h-4 w-4 mr-1" />
              {bulkRunning ? 'Creating…' : `Create ${bulkEval.toCreate.length} client${bulkEval.toCreate.length === 1 ? '' : 's'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}