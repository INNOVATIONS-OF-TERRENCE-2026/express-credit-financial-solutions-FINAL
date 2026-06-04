# Express Credit — Forensic Platform Audit

Read-only audit. No code, schema, RLS, routes, edge functions, or buckets will be modified. Deliverable is twelve markdown reports under `/docs/audit/` plus a top-level index. Implementation is explicitly out of scope for this directive.

## Guardrails

- No writes to `src/`, `supabase/`, `public/`, or `.env`.
- No migrations, no inserts, no RLS edits, no edge-function deploys.
- No data deletion. No bucket changes.
- Database access is `SELECT`-only via `supabase--read_query` for counts, orphan checks, and policy inspection.
- Existing auth, profiles ↔ clients ↔ user_roles mapping is treated as load-bearing and documented, not refactored.

## Method

Four parallel read-only investigation streams via subagents, then synthesis. Every finding cites `file:line` or `table.column` — no prose-only claims.

```text
Stream A  Frontend         routes, pages, components, hooks, contexts, dead code, duplicates
Stream B  Backend          72 tables, RLS, triggers, functions, buckets, edge functions, orphans
Stream C  Domain workflows reports → match → dispute → letter → payment → membership → activity
Stream D  UX & visual      client portal vs admin shells, nav surface area, design tokens, a11y
```

Synthesis pass cross-links findings (e.g. a broken admin button → the hook it calls → the table/RLS it hits → the workflow it belongs to) so each issue has one canonical entry referenced from multiple reports.  
  
THIS ENTIRE platform should resemble:

&nbsp;

Luxury Private Banking

Family Office Dashboard

Wealth Management Platform

Mortgage Capital Advisory Firm

Enterprise Client Success Platform

&nbsp;

NOT:

&nbsp;

Credit repair software

SaaS admin panel

Developer dashboard

Tech startup portal

CRM template

&nbsp;

The new design language should be:

&nbsp;

- White-label

- Executive

- Luxury

- High-trust

- Banking-grade

- Mortgage-grade

- Private client experience

- Concierge experience

&nbsp;

Color direction:

&nbsp;

- Ivory

- White

- Champagne

- Platinum

- Navy

- Charcoal

- Gold accents

&nbsp;

Remove all visual language associated with:

&nbsp;

- Neon colors

- Hacker aesthetics

- Startup dashboards

- Generic SaaS panels

- Gaming UI

- Dark-mode-first interfaces

&nbsp;

Admin experience should become:

&nbsp;

Mission Control

Client Operations Center

Dispute Operations Center

Document Operations Center

Credit Intelligence Center

Mortgage Readiness Center

&nbsp;

Client experience should become:

&nbsp;

Private Client Portal

&nbsp;

with:

&nbsp;

- Credit Score Center

- Progress Center

- Deleted Accounts Center

- Debt Removed Center

- Mortgage Readiness Center

- Document Vault

- Agreement Center

- Payment Center

- Credit Coach Center

&nbsp;

The existing UI should be treated as legacy.

&nbsp;

Create the replacement blueprint after audit completion.

## Deliverables — `/docs/audit/`

1. `00-index.md` — map of all reports, severity legend, glossary (profile vs client vs user_id), reading order.
2. `01-platform-audit.md` — full inventory: every route (App.tsx), every page, every admin/client component, every hook, every context, every edge function, every bucket, every table. Tables, not prose.
3. `02-broken-systems.md` — concrete broken items with repro: dead buttons, failing forms, broken match logic, miscounted KPIs, RLS-blocked queries, 404 routes, stale realtime subs. Each with severity (P0/P1/P2) and blast radius.
4. `03-duplicate-systems.md` — duplicate dashboards (AdminPanel vs AdminCommandCenter vs AdminDashboardComponents), duplicate client portals (ClientPortal vs ClientDashboard vs client/Dashboard), duplicate upload flows (CreditReportUpload vs AdminFileUploader vs SecureVerificationUpload vs bulk_upload_*), duplicate auth/login surfaces, overlapping tables (`payments` vs `payment_records` vs `payment_receipts`; `documents` vs `document_archive` vs `document_uploads`; `credit_reports` vs `credit_report_uploads`; `clients` vs `profiles`). Recommended canonical for each.
5. `04-database-architecture.md` — ER diagram (mermaid) of all 72 tables, FK graph, orphan-row counts, RLS coverage matrix per role (anon/authenticated/admin/service_role), GRANT audit, trigger map, function inventory, encryption surface (SSN, Plaid), storage-bucket → table linkage.
6. `05-navigation-architecture.md` — current nav tree (admin sidebar, client sidebar, top-level routes, hidden routes), proposed consolidation into the 10 categories (Dashboard, Clients, Reports, Disputes, Documents, Payments, Activity, Team, Settings, Tools), redirect map for any route that would move.
7. `06-client-experience.md` — every screen a client can reach, what data each pulls, what's missing for outcome-centric UX (score delta, debt removed, mortgage readiness, next milestone, before/after), and which data already exists in `clients` / `client_activity_timeline` / `score_history` vs what would need new derivations (no schema yet — just gap analysis).
8. `07-admin-experience.md` — every admin screen, time-to-task for the seven critical admin jobs (find client, open profile, upload report, update client, review payment, send dispute, see activity), friction inventory, fragmentation map.
9. `08-refactor-strategy.md` — consolidation plan per duplicate cluster, with preservation contract (which table/component is canonical, what gets aliased, what gets deprecated-but-kept). No deletions proposed without a replacement path.
10. `09-migration-strategy.md` — data-preservation playbook for the future consolidation: backfill rules, dual-write windows, view-based aliasing so legacy code keeps reading, rollback checkpoints. Strategy only — no SQL executed.
11. `10-implementation-roadmap.md` — phased sequence (Consolidation → Nav → Client UX → Admin UX → Report Intelligence → Visual Rebuild → Scale), with dependencies, estimated effort bands, and explicit gates requiring your approval before each phase.
12. `11-risk-and-dependencies.md` — risk register (RLS regressions, auth breakage, payment data loss, report-match drift, signature/agreement integrity), dependency graph between phases, kill-switches, and the "do not touch without CTO sign-off" list (auth, RLS, SSN/Plaid crypto, payment_records, signatures bucket, client_agreements).

## Technical notes

- Investigation uses `acp_subagent--spawn_agent` for each stream so large intermediate output stays out of the main context; only final reports land in `/docs/audit/`.
- DB inspection uses `supabase--read_query` for: table row counts, orphan FK checks, RLS policy dump from `pg_policies`, GRANT dump from `information_schema.role_table_grants`, trigger dump from `pg_trigger`.
- Frontend inspection uses `rg` for route registration, hook usage, dead exports, and duplicate component detection.
- Visual rebuild is documented as a future phase only; no token, Tailwind, or `index.css` changes in this audit.
- Reports are written as `.md` so they live in git and diff cleanly over time.

## Out of scope (explicit)

- Any code change, any migration, any new component, any new page, any new edge function.
- The premium visual rip-and-replace (documented as Phase 6 of the roadmap, executed later under separate directive).
- Mobile app, partner portal, realtor portal, franchise layer (captured in roadmap as future, not designed here).

## Exit criteria

All twelve reports exist under `/docs/audit/`, `00-index.md` links to each, every P0/P1 finding in `02-broken-systems.md` has a file/line or table/policy citation, and the roadmap in `10` is sequenced with approval gates. At that point you decide which phase to authorize next.