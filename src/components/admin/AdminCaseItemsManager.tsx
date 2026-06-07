import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, Eye, EyeOff, Search, UserCog, Landmark } from 'lucide-react';

const STATUSES = ['queued', 'under_review', 'submitted', 'bureau_pending', 'updated', 'corrected', 'deleted', 'escalated', 'completed'];
const INQUIRY_ACTIONS = ['targeted', 'review', 'correction'];
const PI_TYPES = ['name', 'address', 'phone', 'employer', 'other'];
const PI_STATES = ['targeted', 'correction', 'removal', 'review'];

type Row = Record<string, any>;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Generic editor for one case-item table (inquiries / personal-info variations). */
function ItemEditor({
  clientId,
  userId,
  table,
  titleField,
  columns,
  blankDraft,
  icon: Icon,
  title,
  description,
}: {
  clientId: string;
  userId: string | null;
  table: string;
  titleField: string;
  columns: { key: string; label: string; type: 'text' | 'date' | 'status' | 'select'; options?: string[] }[];
  blankDraft: Row;
  icon: any;
  title: string;
  description: string;
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sb: any = supabase;
    const { data } = await sb.from(table).select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    setRows(data || []);
    setLoading(false);
  }, [table, clientId]);

  useEffect(() => { load(); }, [load]);

  const addRow = async () => {
    const sb: any = supabase;
    const { error } = await sb.from(table).insert({ ...blankDraft, client_id: clientId, user_id: userId });
    if (error) { toast({ title: 'Add failed', description: error.message, variant: 'destructive' }); return; }
    load();
  };

  const patch = (id: string, key: string, value: any) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const saveRow = async (row: Row) => {
    setSaving(row.id);
    const sb: any = supabase;
    const { id, created_at, updated_at, ...rest } = row;
    const { error } = await sb.from(table).update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id);
    setSaving(null);
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Saved', description: `${title} item updated.` });
  };

  const deleteRow = async (id: string) => {
    const sb: any = supabase;
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) { toast({ title: 'Delete failed', description: error.message, variant: 'destructive' }); return; }
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4" /> {title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No items yet. Use “Add” to create the first one.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-md border border-border/50 p-3 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {columns.map((col) => (
                  <Field key={col.key} label={col.label}>
                    {col.type === 'text' && (
                      <Input value={row[col.key] ?? ''} onChange={(e) => patch(row.id, col.key, e.target.value)} />
                    )}
                    {col.type === 'date' && (
                      <Input type="date" value={row[col.key] ?? ''} onChange={(e) => patch(row.id, col.key, e.target.value)} />
                    )}
                    {(col.type === 'status' || col.type === 'select') && (
                      <Select value={row[col.key] ?? ''} onValueChange={(v) => patch(row.id, col.key, v)}>
                        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                          {(col.options || []).map((o) => (
                            <SelectItem key={o} value={o}>{o.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Client-facing note (visible to client)">
                  <Textarea rows={2} value={row.client_note ?? ''} onChange={(e) => patch(row.id, 'client_note', e.target.value)} />
                </Field>
                <Field label="Internal note (admin only — never shown to client)">
                  <Textarea rows={2} value={row.internal_note ?? ''} onChange={(e) => patch(row.id, 'internal_note', e.target.value)} />
                </Field>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => patch(row.id, 'client_visible', !row.client_visible)}
                  className={row.client_visible ? 'text-emerald-500' : 'text-amber-500'}
                >
                  {row.client_visible ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                  {row.client_visible ? 'Visible in portal' : 'Hidden from client'}
                </Button>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => deleteRow(row.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => saveRow(row)} disabled={saving === row.id}>
                    <Save className="h-4 w-4 mr-1" /> {saving === row.id ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/** Read-only reference of admin-only flagged accounts for this client's user. */
function FlaggedAccountsReference({ userId }: { userId: string | null }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const sb: any = supabase;
      const { data } = await sb
        .from('flagged_disputes')
        .select('id, creditor_name, account_type, balance, violation_type, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setRows(data || []);
    })();
  }, [userId]);

  if (!userId) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Landmark className="h-4 w-4" /> Flagged Accounts (reference)</CardTitle>
        <CardDescription className="text-xs">Admin-only extraction flags for this user. Not directly shown to the client.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No flagged accounts on file.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-xs">
                <span className="font-medium truncate">{r.creditor_name}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {r.account_type && <span>{r.account_type}</span>}
                  {r.violation_type && <Badge variant="outline" className="text-[10px]">{r.violation_type}</Badge>}
                  {r.status && <Badge variant="outline" className="text-[10px]">{r.status}</Badge>}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Admin manager for the client's portal case file: hard inquiries and
 * personal-information variations (full CRUD into the new tables), plus a
 * read-only reference of admin-only flagged accounts.
 */
export function AdminCaseItemsManager({ clientId, userId }: { clientId: string; userId: string | null }) {
  return (
    <div className="space-y-4">
      <FlaggedAccountsReference userId={userId} />

      <ItemEditor
        clientId={clientId}
        userId={userId}
        table="client_inquiries"
        titleField="inquiry_name"
        icon={Search}
        title="Hard Inquiries"
        description="Inquiries targeted for removal/review. Shown in the client Case File when visible."
        blankDraft={{ inquiry_name: 'New inquiry', bureau: '', inquiry_type: '', status: 'queued', action_state: 'targeted', client_visible: true }}
        columns={[
          { key: 'inquiry_name', label: 'Inquiry Name', type: 'text' },
          { key: 'bureau', label: 'Bureau', type: 'text' },
          { key: 'inquiry_date', label: 'Date', type: 'date' },
          { key: 'inquiry_type', label: 'Type', type: 'text' },
          { key: 'status', label: 'Status', type: 'status', options: STATUSES },
          { key: 'action_state', label: 'Action', type: 'select', options: INQUIRY_ACTIONS },
        ]}
      />

      <ItemEditor
        clientId={clientId}
        userId={userId}
        table="client_personal_info_variations"
        titleField="variation_type"
        icon={UserCog}
        title="Personal Information Variations"
        description="Name/address/phone variations targeted for correction. Shown in the client Case File when visible."
        blankDraft={{ variation_type: 'name', reported_value: '', bureau: '', status: 'queued', correction_state: 'targeted', client_visible: true }}
        columns={[
          { key: 'variation_type', label: 'Type', type: 'select', options: PI_TYPES },
          { key: 'reported_value', label: 'Reported Value', type: 'text' },
          { key: 'bureau', label: 'Bureau', type: 'text' },
          { key: 'status', label: 'Status', type: 'status', options: STATUSES },
          { key: 'correction_state', label: 'Correction', type: 'select', options: PI_STATES },
        ]}
      />
    </div>
  );
}
