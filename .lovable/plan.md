## Root Cause

The session is persisting fine on desktop — what looks like an "auto‑logout" is actually `RequireAdmin` (and downstream code) reading a stale `loading=false` + `userRole=null` and redirecting away from the destination route the moment Supabase fires the post‑login `onAuthStateChange`. Two specific bugs:

1. **`src/hooks/useRoles.tsx`** — `fetchUserRole` runs once with `user=null`, sets `loading=false`. When `user` becomes set after login, the effect re‑runs but never sets `loading=true` again, so for the duration of the role fetch the guard sees `roleLoading=false && isAdmin()===false` and redirects to `/`.
2. **`src/hooks/useMembership.tsx`** — same anti‑pattern; can flash "no membership" briefly during login.
3. **`src/pages/AdminLogin.tsx`** — after a successful `supabase.auth.signInWithPassword`, the page rejects everyone who isn't in a **hardcoded** `admin@expresscredit.com` / `support@…` / `manager@…` list. Real DB‑driven admins get "Access denied" → never navigate to `/admin` → bounce back to login. This must be replaced with the real `user_roles` check.
4. **`src/hooks/useAuth.tsx`** — `onAuthStateChange` callback uses `await supabase.functions.invoke(...)` for new‑user notifications (Supabase deadlock anti‑pattern). Convert to fire‑and‑forget so the auth state machine never blocks.

Mobile worked because the post‑login destination on mobile is typically a `/client/*` route, which is wrapped in `RequireAuth` (checks `user` only, not role) and so the race never triggered.

## Fixes (surgical, frontend‑only)

### 1. `src/hooks/useRoles.tsx`
- Set `loading(true)` at the top of `fetchUserRole` whenever a user is present, before the Supabase query.
- Keep the effect dependency on `user?.id` (not the whole user object) to avoid re‑fetch storms.
- Leave `hasRole` / `isAdmin` / context shape unchanged.

### 2. `src/hooks/useMembership.tsx`
- Same `setLoading(true)` at the top of `fetchMembership` before the query.
- Switch effect dep to `user?.id`.

### 3. `src/pages/AdminLogin.tsx`
- Remove the hardcoded `adminEmails` array entirely.
- After `signIn` succeeds, query `public.user_roles` for the signed‑in user (`has_role`‑equivalent select where `role = 'admin'`).
- If admin: `navigate('/admin')`. If not: show "Not an admin account" and call `supabase.auth.signOut()` so the wrong account doesn't sit in a logged‑in state on the admin login page.
- Preserve all existing UI, loading state, and error messaging.

### 4. `src/hooks/useAuth.tsx`
- Inside `onAuthStateChange`, replace the `await supabase.functions.invoke('new-user-notification', …)` with a non‑awaited call wrapped in `.catch(console.error)` (fire‑and‑forget).
- Keep `setTimeout(() => checkAdminStatus(), 0)` deferral pattern (already correct).
- Add lightweight, non‑sensitive `console.info` breadcrumbs: `auth init`, `session restored`, `auth state change <event>` (no tokens, no emails beyond what's already logged).

### 5. No changes to
- `src/integrations/supabase/client.ts` — already correctly configured (single instance, localStorage, persist + autoRefresh).
- `src/components/RouteGuards.tsx` — logic is correct once #1 is fixed.
- `App.tsx` route table, `ProtectedRoute.tsx`, `useAuth.tsx` `signIn/signUp/signOut` surface, RLS, edge functions, Stripe/membership business logic.

## Acceptance Verification (post‑build)

1. Desktop Chrome / Edge / Guest: log in via `/admin/login` as a real DB admin → land on `/admin`, refresh → stay on `/admin`.
2. Client user logs in via `/` (Index `LoginForm`) → lands on the authenticated Index dashboard, refresh → stays signed in.
3. Wrong password → toast error, no redirect loop.
4. Logout button (Navigation/Admin/Client sidebar) → signs out and returns to `/` or `/admin/login`.
5. Mobile flow unchanged.

## Files Changed

- `src/hooks/useRoles.tsx`
- `src/hooks/useMembership.tsx`
- `src/pages/AdminLogin.tsx`
- `src/hooks/useAuth.tsx`

## Manual Supabase Dashboard Settings to Verify

Authentication → URL Configuration:
- **Site URL**: `https://expresscreditfinancials.org`
- **Redirect URLs** (add all):
  - `https://expresscreditfinancials.org/*`
  - `https://www.expresscreditfinancials.org/*`
  - `https://expresscreditfinancials.lovable.app/*`
  - `https://id-preview--18339a17-fb35-45bf-9665-b9e5e2aa7dff.lovable.app/*`
  - `https://expresscreditfinancials.org/auth/callback`
  - `https://www.expresscreditfinancials.org/auth/callback`
  - `https://expresscreditfinancials.lovable.app/auth/callback`

Also confirm in **Authentication → Providers → Email**:
- "Confirm email" matches your current policy. If it's ON and you have users that never clicked the confirmation link, they will fail to sign in regardless of the frontend.

Confirm the intended admin users exist in `public.user_roles` with `role='admin'`:
```sql
select u.email, r.role from auth.users u
join public.user_roles r on r.user_id = u.id
where r.role = 'admin';
```

Approve this plan to implement the four file changes.
