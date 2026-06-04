# 09 — Migration Strategy

The mechanics behind report 08. No SQL is executed during the audit; this is the playbook for future phases.

## Core principles

1. **Forward-compatible reads, backward-compatible writes.** New code always knows how to read both shapes during a transition. Old code keeps writing to the legacy shape until cutover.
2. **Views are the migration glue.** A consolidated table gets a `CREATE VIEW <legacy_name>` so legacy code keeps reading without changes.
3. **Dual-write windows are short (one release, max 7 days).** Long dual-writes drift.
4. **Every migration ships with a rollback migration in the same PR.**
5. **One concern per migration.** Don't combine RLS fixes with table consolidation with edge-function refactor.

## Standard table-consolidation pattern

Example: collapsing `payment_notifications` into `client_notifications`.

### Step 1 — Canonical absorbs columns (no data move)

```sql
-- Migration A: ensure canonical has every column the legacy holds
ALTER TABLE public.client_notifications
  ADD COLUMN IF NOT EXISTS payment_record_id uuid REFERENCES public.payment_records(id);
-- GRANTs unchanged (already in place for client_notifications)
```

### Step 2 — Backfill

```sql
-- Migration B: copy missing rows
INSERT INTO public.client_notifications
  (user_id, payment_record_id, title, message, type, created_at, read_at)
SELECT user_id, payment_record_id, title, message, 'payment', created_at, read_at
FROM public.payment_notifications pn
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_notifications cn
  WHERE cn.user_id = pn.user_id
    AND cn.payment_record_id = pn.payment_record_id
    AND cn.created_at = pn.created_at
);
```

### Step 3 — Dual write

Update `tg_payment_after_insert/update` to write **both** tables. Ship. Monitor for 24h.

### Step 4 — Reader switch

Update `src/components/payments/*` and admin to read from `client_notifications WHERE type='payment'`. Ship.

### Step 5 — Replace legacy with view

```sql
-- Migration C: turn the table into a view (after final backfill)
ALTER TABLE public.payment_notifications RENAME TO payment_notifications_legacy;
CREATE VIEW public.payment_notifications AS
  SELECT id, user_id, payment_record_id, title, message, created_at, read_at
  FROM public.client_notifications
  WHERE type = 'payment';
GRANT SELECT ON public.payment_notifications TO authenticated;
GRANT ALL ON public.payment_notifications TO service_role;
```

`payment_notifications_legacy` survives 30 days as a backup, then is dropped.

### Rollback

- Drop view, rename `payment_notifications_legacy` back, redeploy old triggers.

## Encryption-rotation pattern (SSN, P0-2)

1. **Stage new key in Supabase Vault.** `vault.create_secret('ssn_key_v2', ...)`.
2. **Create `encrypt_ssn_v2` / `decrypt_ssn_v2`** that read the key from vault.
3. **One-shot re-encrypt** in a maintenance window:

```sql
UPDATE public.clients
SET ssn_last4 = encrypt_ssn_v2(decrypt_ssn_secure_legacy(ssn_last4))
WHERE ssn_last4 IS NOT NULL;
```

4. **Switch all callers** to `_v2` functions.
5. **Keep `_legacy` for 90 days** for audit replay, then drop.
6. **Rotate vault key annually** going forward.

## Storage-bucket consolidation pattern

Collapsing `documents` / `document-archive` / `document-uploads` → `client-documents`.

1. **Add new bucket** if not present (it is).
2. **Mirror writes** — update upload code to write to both old + new bucket for one release.
3. **Backfill** — Supabase admin script copies old objects with normalized path: `client-documents/<client_id>/<doc_type>/<filename>`.
4. **Update DB rows** — `UPDATE document_archive SET file_path = '<new>' WHERE file_path LIKE '<old>%'`.
5. **Switch reads** — UI reads from `client-documents` only.
6. **Delete old buckets** after 30 days of zero access logs.

## RLS-policy addition pattern (P0-6)

For each of the 18 tables with RLS on + 0 policies:

```sql
-- Example: purchases
CREATE POLICY "Users read own purchases"
  ON public.purchases FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert own purchases"
  ON public.purchases FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage all purchases"
  ON public.purchases FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
```

Re-test trigger chain (`on_purchase_insert` → `create_pipeline_stages` + `create_client_timer` + `create_required_documents`) after policy is in place.

## Backfill safety

- Always wrap backfill in `BEGIN; ... COMMIT;` with row-count sanity check.
- For tables >100K rows, batch by `WHERE created_at BETWEEN ...` to avoid lock storms.
- Run on staging first with a representative dataset.

## Audit during migration

Every consolidation logs to `audit_logs`:

```sql
PERFORM log_security_event(
  'TABLE_CONSOLIDATION',
  '<legacy_table>',
  NULL,
  jsonb_build_object('canonical', '<canonical_table>', 'rows_migrated', n_rows, 'phase', 'reader_switch'),
  'info', 0
);
```

Lets the team query progress and prove completeness.

## Rollback ladder

Each migration in a consolidation gets a numbered rollback. To revert phase N, run rollbacks N, N-1, …, 1.

| Phase | Forward | Rollback |
|-------|---------|----------|
| 1 | Add column to canonical | Drop column |
| 2 | Backfill | Truncate backfilled rows (idempotent via filter) |
| 3 | Dual-write triggers | Revert triggers |
| 4 | Reader switch in app code | Redeploy previous app build |
| 5 | Replace legacy with view | Drop view, rename `_legacy` back |

## Out-of-scope for this strategy

- Cross-region replication, sharding, partitioning — not required at 10K-client target.
- Database-engine version upgrade — Supabase manages.
- Schema generator regeneration — automatic after each migration approval.
