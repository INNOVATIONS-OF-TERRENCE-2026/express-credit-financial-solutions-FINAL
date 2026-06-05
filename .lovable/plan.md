# Emergency God Mode Repair — Execution Plan

This is a large, multi-phase production repair. Below is the surgical plan, scoped to existing architecture (no new auth, no new router, no duplicate Supabase clients).

## Phase 0 — Post-Execution Verification Report (NEW, do first)
Build `/admin/verification-report` page that lists every client with:
- Portal-link status (client.user_id present? profile email match? ambiguous?)
- Document/archive status (counts in `documents` + `document_archive`, orphans)
- Payment-summary consistency (row exists in `client_payment_summary`? expected_amount = 600? user_id matches client.user_id?)
- Credit score presence (latest row in `client_credit_scores`)
- Membership / service status flags
Single sortable/filterable table + CSV export. Read-only diagnostic.

## Phase 1 — Client Status Normalization (Migration)
Additive columns on `clients` (only if missing): `portal_status`, `membership_plan`, `service_status`, `access_services_enabled`. Backfill real clients (`not_a_client = false`) to active/premium/enabled. Trigger to default new rows to active/premium.

## Phase 2 — Remove Agreement Gating
- `useAdminMetrics`, `useClientRegistry`, `useClientPortalData`: drop `needs_agreement` blockers from Portal-Ready / Active calculations.
- Remove "Needs Agreement" KPI card from Admin Client Registry and Admin Dashboard. Keep agreement data accessible but non-blocking.

## Phase 3 — Fix Portal Button Routing
Currently the "Portal" button in Admin Client Registry navigates to a route that re-mounts admin shell. Fix: route to `/admin/client-portal-editor/:clientId`. Add route in `App.tsx`. Guard with `RequireAdmin`. Loads client by `clients.id` (not auth.uid).

## Phase 4 — Admin Client Portal Editor (`/admin/client-portal-editor/:clientId`)
New page with sections:
1. Client header (name, email, phone, membership, portal, service status)
2. Credit Score Editor — current + starting per bureau, auto-calc change
3. Credit Results Editor — accounts deleted, debt removed, remaining negatives, inquiries removed, PII removed, dispute round, latest update, next step
4. Report Upload Center — multi-file, bureau + report_type selectors, auto-assign `client_id`
5. Negative Accounts Editor — CRUD list
6. Client Visible Preview — embedded read-only render of `/client/...`
7. Save (per-section) → writes to Supabase, reflects in client portal

Storage targets: `client_credit_scores`, `credit_report_uploads`, new `client_credit_results` (additive table) and `client_negative_accounts` (additive table).

## Phase 5 — Multi-Report Upload + Client Assignment
Upload to `credit-reports` storage bucket, insert into `credit_report_uploads` with `{client_id, user_id?, bureau, report_type, report_date, uploaded_by, storage_path, file_name}`.

## Phase 6 — FICO-Style Score UI (Client Portal)
Rebuild client `CreditScoreCenter` component:
- Large circular gauge (SVG) per bureau, tabs Experian/Equifax/TransUnion
- Current, starting, points gained, last updated, tier label, progress to next tier
- Ivory/white background, champagne gold accents, deep navy text via design tokens (add tokens to `index.css`)

## Phase 7 — Client Portal White-Label Rebuild
Restructure `ClientPortal.tsx` sections in order: Score Center, Progress Overview, Deleted Accounts, Remaining Negatives, Debt Removed, Inquiry Progress, PII Updates, Reports, Payment Status, Next Step, Timeline. Remove generic tool/quick-action clutter.

## Phase 8 — Admin Dashboard Cleanup
Replace KPI grid in Admin Client Registry header with: Total, Active, Premium, Portal Linked, Portal Not Linked, With Scores, Missing Scores, Reports Uploaded, Active Services.

## Phase 9 — Payment Center $600 Default
Backfill `client_payment_summary.expected_amount = 600` where null/0. Update Payment Center page so every client row appears (left-join clients), admin inline-edit for paid, status, method, notes; balance auto-derived. No Stripe dependency.

## Phase 10 — Smoke Verification
Manual checklist via the Phase 0 verification report; capture before/after counts.

## Technical Notes
- New tables (additive): `client_credit_results`, `client_negative_accounts` (RLS: admin all, client SELECT own via user_id link).
- New columns (additive): `clients.portal_status`, `clients.membership_plan`, `clients.service_status`, `clients.access_services_enabled`.
- Design tokens: add `--gold-champagne`, `--navy-deep`, `--ivory`, `--platinum` HSL tokens; do not hardcode colors.
- Reuse `RequireAdmin`, existing `supabase` client, existing `AdminSidebar`.
- No changes to auth, RLS for unrelated tables, or working edge functions.

## Order of Execution
1. Phase 1 migration (additive columns + backfill)
2. Phase 0 verification report page (so we can measure)
3. Phase 3 routing fix + Phase 4 editor scaffold (additive tables migration)
4. Phase 2 + Phase 8 KPI cleanup
5. Phase 5 multi-upload
6. Phase 9 payment $600 backfill
7. Phase 6 + Phase 7 white-label UI
8. Phase 10 verify via Phase 0 report

## Risk Controls
- All DB changes additive; no destructive drops.
- Portal-link trigger already permits admin NULL→uuid linking (prior fix).
- No edits to auth schema, no service-role key in frontend.
- Per-section saves prevent large transactional failures.

Approve to proceed, or tell me to trim scope (e.g. Phase 0 + 3 + 4 only as a first slice).