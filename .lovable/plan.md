
# Emergency Repair: Admin Client Control + Portal Data Sync

## Root cause

The admin app treats `profiles` / `auth.users` as the source of truth for several operations. Bulk edits, tier changes, and some lookups filter by `clients.user_id`, so the 33 of 35 `clients` rows that have no linked auth user become invisible/uneditable. DB confirms: `clients=35`, `clients.user_id NOT NULL = 2`, `profiles=37`. Counts and selectors disagree across screens because some read `clients`, others read `profiles`.

The `clients` table already has nearly every column the brief asks for. Only 4 columns are actually missing.

## What I'll change

### 1. Migration (additive only)
Add the columns truly missing from `public.clients`:

```text
portal_status text default 'active'
payment_status text
admin_notes text
client_visible_update text
```

Existing columns (`starting_score_*`, `current_score_*`, `accounts_deleted_count`, `debt_removed_total`, `hard_inquiries_removed`, `personal_info_items_removed`, `remaining_negatives`, `current_dispute_round` [integer], `next_step_note`, `mortgage_readiness_status`, `ftc_605b_readiness_status`, `membership_plan`, `status`, `onboarding_status`) stay as-is. No drops, no type changes. `current_dispute_round` stays integer; UI already treats it numerically.

Move `membership_type` semantics: keep reading `profiles.membership_type` when a user is linked, but also persist a denormalized `membership_plan` on `clients` so unlinked clients have a tier. No data deletion.

### 2. New `src/lib/clientResolver.ts`
Single resolution layer with:

- `resolveClientById(clientId)` — direct `clients.id` lookup.
- `resolveClientByUserId(userId)` — `clients.user_id` lookup.
- `resolveClientByEmail(email)` — case-insensitive `clients.email` lookup.
- `resolveClientForAdmin(clientId)` — admin always passes explicit `clientId`; never uses admin's `auth.uid()`.
- `resolveClientForPortal(user)` — try `user_id` → fallback to `email` → if matched by email and `clients.user_id IS NULL`, safely link it (single UPDATE guarded by `user_id IS NULL`). Returns a typed result including `status: 'linked' | 'auto_linked' | 'pending_setup'` so the portal can render the support message instead of crashing.

Existing `src/lib/resolveClient.ts` stays (used elsewhere); the new file consolidates the contract and re-exports a compatible helper.

### 3. Admin editing — remove `user_id` gating
Files: `src/pages/AdminClients.tsx`, `src/pages/AdminClientEdit.tsx`, `src/components/AdminClientEditor.tsx`.

- Bulk tier change: write `membership_plan` to `clients` for ALL selected rows; additionally update `profiles.membership_type` for the subset that has `user_id`. Drop the "No linked users" hard block.
- Bulk dispute-status change: continue updating `dispute_letters` keyed by `client_id` (already correct) — verify no `user_id` filter.
- Single-client save: write to `clients` first; only touch `profiles` and emit automation events when `user_id` is present. Never fail the save because `user_id` is null.
- Save path will persist the new override fields (`portal_status`, `payment_status`, `admin_notes`, `client_visible_update`) plus all score/metric fields directly on `clients`.

### 4. Admin client list — single source of truth
`fetchClients` already reads `clients` then joins `profiles.membership_type`. Keep that join but prefer `clients.membership_plan` when present and fall back to `profiles.membership_type`. Add a `portal_account_status` derived field:

```text
linked              → clients.user_id IS NOT NULL
email_match_avail   → user_id null AND profiles/auth has matching email
needs_invite        → user_id null AND no email match
```

The email-match check uses one batched `profiles` query keyed by the visible clients' emails (no per-row N+1). Show the status as a new column/badge.

### 5. Admin client counts
`src/hooks/useAdminMetrics.ts` — change `totalClients` to `count(*) FROM clients`. Add new metrics surfaced in `AdminKpiGrid`:

- Total Clients (clients)
- Portal Users Linked (clients where user_id not null)
- Clients Without Portal Login (clients where user_id null)
- Active / Onboarding / Inactive (from `clients.status` / `clients.onboarding_status`)

All other dashboards that show a "total clients" number get pointed at the same hook.

### 6. Client selectors everywhere
Audit and align these to query `clients` directly (not `profiles`):

- Upload Report selector, Documents selector, Disputes selector, Payments selector, Portal Editor, Score Editor, Status Editor, Client Portal Manager, Client Portals page.

Where a selector currently filters by `user_id IS NOT NULL`, remove that filter.

### 7. Admin client preview
`/admin/client-preview/:clientId` (`AdminClientPreview.tsx`) already resolves by `clients.id` via `resolveClient`. Switch it to `resolveClientForAdmin` and ensure it never redirects/crashes when `user_id` is null. `ClientPortal` rendered in admin preview mode must accept a `clients.id` and not require an auth user.

### 8. Client portal data resolution
`src/contexts/ClientContext.tsx` and `src/hooks/useClientPortalData.ts` — use `resolveClientForPortal(user)`:

1. Match by `clients.user_id`.
2. Else match by `auth.email` → `clients.email` (case-insensitive).
3. On email match with null `user_id`, run a guarded `UPDATE clients SET user_id = auth.uid() WHERE id = $1 AND user_id IS NULL`.
4. If no match: render "Portal setup is pending. Please contact support." instead of a blank page.

### 9. Admin override panel
`AdminClientEditor.tsx` already edits scores and metrics. Extend it with an "Admin Override" card that writes the new portal-visible fields (`portal_status`, `payment_status`, `admin_notes`, `client_visible_update`, `mortgage_readiness_status`, `ftc_605b_readiness_status`, `current_dispute_round`, `next_step_note`) directly to `clients`. Client dashboard already reads these via `useClientPortalData`.

### 10. Link / Invite actions (Phase 6)
On a single client edit page, add three actions:

- "Link Existing User" — modal that searches `profiles` by email (ilike), shows match, and links `clients.user_id = profiles.user_id` (guarded by `user_id IS NULL` to prevent duplicates).
- "Mark Portal Invite Needed" — sets `clients.portal_status = 'invite_needed'`.
- "Resend Portal Invite" — placeholder button that toasts "Coming soon" (no new auth flow created).

No new auth user creation. No duplicate auth/Supabase clients.

## Files touched

```text
NEW   src/lib/clientResolver.ts
NEW   supabase/migrations/<timestamp>_clients_admin_repair.sql
EDIT  src/pages/AdminClients.tsx            (bulk actions, portal status col, selectors)
EDIT  src/pages/AdminClientEdit.tsx         (save without user_id, override fields)
EDIT  src/components/AdminClientEditor.tsx  (override panel, link/invite actions)
EDIT  src/pages/AdminClientPreview.tsx      (use resolveClientForAdmin)
EDIT  src/hooks/useAdminMetrics.ts          (clients-based counts + new metrics)
EDIT  src/components/admin/AdminKpiGrid.tsx (surface new metrics)
EDIT  src/contexts/ClientContext.tsx        (use resolveClientForPortal)
EDIT  src/hooks/useClientPortalData.ts      (read override fields)
EDIT  client selector components            (Upload/Docs/Disputes/Payments/PortalLinks/Portals)
```

Only the files actually touching the broken paths above are edited. No router, auth context, or Supabase client changes.

## Safety

- Additive SQL only; existing columns and data untouched.
- No deletes, no auth.user mutations, no duplicate clients (link action guarded by `user_id IS NULL`).
- No new auth/Supabase client; reuses `@/integrations/supabase/client`.
- No changes to RLS structure; new columns inherit existing `clients` policies (admins can update; service_role has ALL).
- Bulk profile writes still respect existing `profiles` policies — admin-only updates already work today.

## Verification checklist

1. `/admin/clients` total matches `SELECT count(*) FROM clients` (35 today).
2. New KPIs show: Total=35, Linked=2, Unlinked=33.
3. Edit + save succeeds on a client with `user_id = null` (no toast about missing user).
4. Bulk tier change applies to all selected clients (linked or not).
5. Override panel writes `current_score_*`, `mortgage_readiness_status`, etc., and client portal hero reflects the change.
6. `/admin/client-preview/:clientId` loads for an unlinked client.
7. Upload / Documents / Disputes / Payments selectors all list the same 35 clients.
8. Client portal: linked user sees data; email-only match auto-links and loads; no match shows the support message (no blank screen, no crash).
9. `npm run typecheck` / build passes.

Phase ordering at build time: migration first, then `clientResolver.ts`, then admin edit + selectors + KPIs, then portal resolution + override panel, then link/invite UI, then verification.
