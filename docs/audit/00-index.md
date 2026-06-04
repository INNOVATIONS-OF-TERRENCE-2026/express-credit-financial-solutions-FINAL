# Express Credit — Forensic Platform Audit

Read-only audit. No code, schema, RLS, routes, edge functions, or buckets were modified.

Date: 2026-06-04. Branch: live production.

## Reading order

| # | Report | Read if you want… |
|---|--------|-------------------|
| 00 | [Index](./00-index.md) | This map. |
| 01 | [Platform inventory](./01-platform-audit.md) | Every route, page, component, hook, table, function, bucket. |
| 02 | [Broken systems](./02-broken-systems.md) | P0/P1/P2 defects with file/table citations. |
| 03 | [Duplicate systems](./03-duplicate-systems.md) | Every cluster of overlapping code/tables and the recommended canonical. |
| 04 | [Database architecture](./04-database-architecture.md) | ER overview, RLS matrix, GRANT audit, triggers, encryption surface. |
| 05 | [Navigation architecture](./05-navigation-architecture.md) | Current nav, consolidation into 10 top-level categories, redirect map. |
| 06 | [Client experience](./06-client-experience.md) | Every client screen, data gaps for outcome-centric UX. |
| 07 | [Admin experience](./07-admin-experience.md) | Every admin screen, time-to-task for 7 critical jobs. |
| 08 | [Refactor strategy](./08-refactor-strategy.md) | Consolidation plan per duplicate cluster with preservation contract. |
| 09 | [Migration strategy](./09-migration-strategy.md) | Data-preservation playbook (backfill, dual-write, views, rollback). |
| 10 | [Implementation roadmap](./10-implementation-roadmap.md) | Phased sequence with approval gates. |
| 11 | [Risk & dependencies](./11-risk-and-dependencies.md) | Risk register, kill-switches, do-not-touch list. |

## Evidence base (raw stream output)

The 12 reports above synthesize four parallel investigations. The raw output lives alongside and is cited throughout:

- `_stream-a-frontend.md` — 356 lines, every route/page/component/hook with usage analysis.
- `_stream-b-backend.md` — 504 lines, 72 tables + 25 edge functions + 15 buckets + RLS/GRANT/triggers/encryption.
- `_stream-c-workflows.md` — 490 lines, 7 core workflows traced UI → hook → table → trigger with ASCII sequence diagrams.
- `_stream-d-ux.md` — 362 lines, navigation, journey maps, design-token audit, premium-rebuild brief.

## Severity legend

| Tier | Meaning | Response window |
|------|---------|-----------------|
| **P0** | Security exposure, data loss risk, silent feature breakage in production. | Fix this week. Gate everything else. |
| **P1** | Workflow degraded, user-visible friction, broken UX with workaround. | Fix this sprint. |
| **P2** | Code health, duplication, dead code, polish, hardening. | Roll into consolidation phases. |

## Glossary

- **profile** (`public.profiles`) — one row per auth user, created by `handle_new_user` trigger on `auth.users` insert. Holds `payment_status`, `membership_type`, contact info. PK: `id`. Link: `user_id` → `auth.users.id`.
- **client** (`public.clients`) — operational record for a credit-restoration engagement. Created/edited by admins. Holds scores, dispute round, accounts deleted, debt removed, mortgage readiness data. PK: `id` (uuid). Link: `user_id` → `auth.users.id` (1:1 with profile when the client has logged in; nullable when the admin pre-creates the record).
- **user_id** — the `auth.users.id` uuid. The join key between `profiles`, `clients`, `payment_records`, `client_agreements`, `bank_links`, etc.
- **user_roles** (`public.user_roles`) — RBAC table. `has_role(uid, 'admin')` is the canonical admin check. `is_admin()` exists in some policies but is inconsistent (see report 04).
- **canonical table** — the single source of truth recommended in report 03 / 08. Other overlapping tables become views or are deprecated.

## Audit guardrails (verified)

- Zero migrations were applied.
- Zero rows were inserted, updated, or deleted.
- Zero edge functions were deployed.
- Zero storage objects were created or removed.
- Zero RLS or GRANT changes.
- All DB inspection was `SELECT`-only against `pg_catalog` / `information_schema` / `public`.

## Exit criteria

All 12 reports present, every P0/P1 in report 02 cites a file/line or table/policy, roadmap in report 10 is sequenced with approval gates. You decide which phase to authorize next.
