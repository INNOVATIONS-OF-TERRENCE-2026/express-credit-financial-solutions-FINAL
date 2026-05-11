
# Fix Admin Edit Button + Admin Portal/View "Client Data Not Found"

## Root cause (verified)

The admin routes are wired correctly:
- `/admin/clients/:clientId` → `AdminClientEdit` (exists, admin-guarded)
- `/admin/client-preview/:clientId` → `AdminClientPreview` (exists, admin-guarded, passes `isAdminPreview=true` + `resolvedClientId` to `ClientPortal`)
- All "View Portal" buttons (`AdminClients`, `ClientPortalLinks`, `AdminCRMFixedPanel`, `AdminClientOverview`, `AdminDocumentUploader`, `AdminDashboard`) already point to `/admin/client-preview/:id`.
- Admin user `terrencemilliner10@gmail.com` and `admin@expresscredit.com` both have `user_roles.role='admin'`.

So why does the user see the **Express Credit login page** + **"Client data not found"**?

**Three concrete bugs remain:**

1. **`/client/:clientSlug` fall-through (ClientPortals.tsx)** — When an admin lands on `/client/:id` (from a shared/copied portal link, an old bookmark, or the `Copy Portal Link` button in `ClientPortalLinks` which still emits `/client/:id`), the page:
   - Admin path: sets `resolvedClientId = null` when `resolveClient` fails, then renders `<ClientPortal resolvedClientId={null} />`.
   - `ClientPortal.fetchClientData()` then queries `clients.user_id = admin.uid` — no row → `clientData` stays null → **"Client data not found. Please contact support."** rendered (line 250 of `ClientPortal.tsx`).
   - If the admin is signed out in that tab, `ClientLogin` is shown — that's the unfamiliar "Express Credit auth login page".

2. **`AdminClientEditor` modal silently fails** — In `src/components/AdminClientEditor.tsx`, `if (!client) return null` (line 122) so when the `clients` fetch errors or returns nothing, the dialog opens with nothing rendered. Clicking Edit appears to do nothing.

3. **`Copy Portal Link` produces an unsafe URL** — `ClientPortalLinks.copyPortalLink` writes `${origin}/client/${id}` which is the buggy public-client route. Admins copying this link, opening it, and landing in the broken path is exactly the reported symptom.

## Files to modify

1. `src/pages/ClientPortals.tsx` — when the signed-in user is admin, redirect `/client/:slug` to `/admin/client-preview/:resolvedClientId`. Never fall through to `ClientPortal` with a mismatched ID.
2. `src/components/AdminClientEditor.tsx` — add `loading` + `notFound` states inside the dialog; render error toast and stay open with an explanatory message instead of returning `null`.
3. `src/pages/ClientPortalLinks.tsx` — `copyPortalLink` should emit `/admin/client-preview/:id` (admin-safe). Keep public `/client/:id` only as a secondary "client-facing link" option behind a separate label.
4. `src/components/ClientPortal.tsx` — when `isAdminPreview && !clientData` show a clearer admin-specific empty state ("This client has no `clients` row — open the editor to create one"), not the generic support message.

## Routes
No new routes. All required routes already exist:
- `/admin/clients/:clientId` (edit)
- `/admin/client-preview/:clientId` (admin preview)
- `/client/:clientSlug` (real client portal, will redirect admins out)

## SQL
None. RLS already supports admins via `has_role(auth.uid(), 'admin')` on `clients`, `client_credit_scores`, etc. Both admin emails have `user_roles` rows.

## Technical details

**ClientPortals.tsx redirect logic:**
```ts
if (isAdmin() && resolved?.clientId) {
  return <Navigate to={`/admin/client-preview/${resolved.clientId}`} replace />;
}
```
Also: if admin and not resolved, navigate back to `/admin/clients` with a toast.

**AdminClientEditor states:**
- `loading` (spinner inside DialogContent)
- `notFound` (message + Close button, no silent dismiss)
- propagate `error.message` to toast

**copyPortalLink:**
- Primary button writes `${origin}/admin/client-preview/${client_id}` (admin link).
- (Optional minor) keep `/client/:id` available as a "Client-facing link" via a small secondary action — out of scope unless user asks.

## Test plan

1. Sign in as admin `terrencemilliner10@gmail.com`.
2. `/admin/clients` → click pencil → editor modal opens with full data; edit `phone`, save → toast "Client Updated"; verify `clients.phone` updated in DB.
3. `/admin/clients` → click eye → opens `/admin/client-preview/:id` in new tab → portal renders client data, no login screen, no "Client data not found".
4. Paste an OLD `/client/<uuid>` URL while signed in as admin → app redirects to `/admin/client-preview/<resolved>` automatically.
5. Sign out → visit `/client/<uuid>` → still shows `ClientLogin` (real client flow intact).
6. Sign in as a non-admin client → `/client/<own-id>` works exactly as before, no regression.
7. From `ClientPortalLinks`, click `Copy` → paste in browser → opens admin preview, not the buggy public route.

## Safety
- Admin dashboard, war board, document uploaders untouched.
- Auth provider, Supabase client, routing tree untouched.
- No RLS changes; admin role checks unchanged.
- Real client portal (`/client/:slug` for non-admins) preserved.
- All four edits are additive / defensive — no removed business logic.
