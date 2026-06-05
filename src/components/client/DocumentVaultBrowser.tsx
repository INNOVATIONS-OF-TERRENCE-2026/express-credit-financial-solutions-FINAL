import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LuxuryCard, EyebrowLabel } from '@/components/luxury';
import { Input } from '@/components/ui/input';
import { FileText, Image as ImageIcon, Lock, FileType2, Search, FolderOpen, X } from 'lucide-react';

type FilterKey = 'all' | 'pdf' | 'image' | 'encrypted';

interface VerificationRow {
  id_document_url: string | null;
  ssn_document_url: string | null;
  address_document_url: string | null;
  updated_at: string | null;
}

interface DocItem {
  key: string;
  name: string;
  category: string;
  filter: Exclude<FilterKey, 'all'>;
  uploadedAt: string | null;
  path: string;
}

function extOf(path: string): string {
  const m = path.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}
function nameOf(path: string): string {
  return path.split('/').pop() || path;
}
function classify(path: string): { filter: Exclude<FilterKey, 'all'>; label: string; Icon: any } {
  const e = extOf(path);
  if (e === 'pdf') return { filter: 'pdf', label: 'PDF', Icon: FileType2 };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(e)) return { filter: 'image', label: e.toUpperCase(), Icon: ImageIcon };
  if (['enc', 'gpg', 'pgp', 'p7m', 'zip'].includes(e)) return { filter: 'encrypted', label: 'Encrypted', Icon: Lock };
  return { filter: 'pdf', label: e ? e.toUpperCase() : 'Document', Icon: FileText };
}

const FILTERS: { key: FilterKey; label: string; Icon: any }[] = [
  { key: 'all', label: 'All Documents', Icon: FolderOpen },
  { key: 'pdf', label: 'PDFs', Icon: FileType2 },
  { key: 'image', label: 'Images', Icon: ImageIcon },
  { key: 'encrypted', label: 'Encrypted', Icon: Lock },
];

export function DocumentVaultBrowser({ userId }: { userId: string }) {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const [verRes, docsRes] = await Promise.all([
        (supabase as any)
          .from('client_verification_secure')
          .select('id_document_url, ssn_document_url, address_document_url, updated_at')
          .eq('user_id', userId)
          .maybeSingle(),
        (supabase as any)
          .from('documents')
          .select('id, file_path, doc_type, uploaded_at')
          .eq('user_id', userId)
          .order('uploaded_at', { ascending: false })
          .limit(200),
      ]);

      const out: DocItem[] = [];
      const ver: VerificationRow | null = verRes.data ?? null;
      const verMap: { url: string | null; category: string }[] = [
        { url: ver?.id_document_url ?? null, category: 'Government Photo ID' },
        { url: ver?.ssn_document_url ?? null, category: 'Social Security Card' },
        { url: ver?.address_document_url ?? null, category: 'Proof of Address' },
      ];
      for (const v of verMap) {
        if (!v.url) continue;
        const c = classify(v.url);
        out.push({
          key: `ver-${v.category}`,
          name: nameOf(v.url),
          category: v.category,
          filter: c.filter,
          uploadedAt: ver?.updated_at ?? null,
          path: v.url,
        });
      }
      for (const r of docsRes.data ?? []) {
        if (!r?.file_path) continue;
        const c = classify(r.file_path);
        out.push({
          key: `doc-${r.id}`,
          name: nameOf(r.file_path),
          category: (r.doc_type || 'Supporting Document').replace(/_/g, ' '),
          filter: c.filter,
          uploadedAt: r.uploaded_at ?? null,
          path: r.file_path,
        });
      }
      if (alive) {
        setItems(out);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: items.length, pdf: 0, image: 0, encrypted: 0 };
    for (const it of items) c[it.filter]++;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (filter !== 'all' && it.filter !== filter) return false;
      if (q && !(`${it.name} ${it.category}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, filter, query]);

  return (
    <LuxuryCard className="p-6 md:p-8">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <EyebrowLabel withRule>
            <FolderOpen className="h-3 w-3" /> Vault Browser
          </EyebrowLabel>
          <h3 className="lux-display text-xl md:text-2xl mt-2 text-foreground">
            Find a document in your vault
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Filter by file type or search by name and category. All files remain encrypted at rest.
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(({ key, label, Icon }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                active
                  ? 'border-gold-deep bg-gradient-gold text-midnight'
                  : 'border-border/60 bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
              <span className={`tabular-nums font-bold ${active ? 'text-midnight/80' : 'text-foreground/70'}`}>
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by file name or category…"
          className="pl-9 pr-9"
          aria-label="Search documents"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">Loading your vault…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-background/40 py-10 text-center">
          <FolderOpen className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-foreground font-medium">No documents match.</p>
          <p className="text-xs text-muted-foreground mt-1">
            {items.length === 0
              ? 'Use the upload center below to add your first file.'
              : 'Try a different filter or clear the search.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/50 bg-background/60">
          {filtered.map((it) => {
            const c = classify(it.path);
            const Icon = c.Icon;
            return (
              <li key={it.key} className="flex items-center gap-3 px-3 py-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/60 text-foreground shrink-0">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{it.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {it.category}
                    {it.uploadedAt && ` · ${new Date(it.uploadedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  {c.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </LuxuryCard>
  );
}