# Playwright E2E — auth & session stability

These specs verify the production-critical login flows for Express Credit CRM:

- Admin login → lands on `/admin`
- Client login → lands on `/client/...`
- Hard refresh on a protected route keeps the user signed in
- Navigation across all protected admin/client routes never bounces to `/admin/login`
- A signed-in session survives **90 seconds** without redirect or forced logout

The specs depend on the in-app **AuthDebugPanel** (`[data-testid="auth-debug"]`)
to read `authReady` / `rolesReady` / `guardsReady` / `isAdmin` deterministically,
so route guards are only evaluated after auth has settled.

## Setup

```bash
bun add -D @playwright/test
bunx playwright install --with-deps
```

## Required env vars

| Var                  | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `E2E_BASE_URL`       | App URL (default `http://localhost:8080`)     |
| `E2E_ADMIN_EMAIL`    | Real admin login                              |
| `E2E_ADMIN_PASSWORD` | Real admin password                           |
| `E2E_CLIENT_EMAIL`   | Real client login                             |
| `E2E_CLIENT_PASSWORD`| Real client password                          |

If admin or client credentials are missing the corresponding spec auto-skips,
so it is safe to run partial subsets in CI.

## Run

```bash
E2E_BASE_URL=https://expresscreditfinancials.org \
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
E2E_CLIENT_EMAIL=... E2E_CLIENT_PASSWORD=... \
bunx playwright test
```

Single file:

```bash
bunx playwright test e2e/auth-admin.spec.ts
```

## Manual debug panel

Append `?debug=auth` to any URL, or run
`localStorage.setItem('ec_debug_auth','1')` in the browser console, to surface
the floating panel and inspect session/role/membership readiness in real time.