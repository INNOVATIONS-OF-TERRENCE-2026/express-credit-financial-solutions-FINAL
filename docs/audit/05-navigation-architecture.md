# 05 — Navigation Architecture

## Current state

### Admin sidebar (src/components/admin/AdminSidebar.tsx)

11 items, all top-level:

```text
Command Center · Clients · Upload Reports · Reports & Results · Disputes
Documents · Payments · Agreements · Activity · Settings · Advanced Tools
```

### Client sidebar (src/components/client/ClientPortalSidebar.tsx)

9 items: `Dashboard · Results · Reports · Disputes · Documents · Payments · Agreements · Messages · Settings`.

### Top-level navigation (NavigationHeader)

Public marketing links to `/`, `/membership`, login. Largely separate from app nav.

### Hidden / not-in-nav routes

- `/admin/clients/:id`, `/admin/client-preview/:id` (deep-link only)
- `/admin/login`
- `/client-portals`, `/client-portals-legacy/:slug` (admin tool + legacy)
- 16 legacy redirects under `/upload-credit-report`, `/document-center`, `/credit-tracking`, `/score-tracker`, `/credit-building`, `/goodwill-letters`, `/education`, `/ai-assistant`, `/data-freeze`, etc. — all `<Navigate replace>` to canonical.
- 8 SBA routes under `/sba/*` — separate module, not in main nav.

## Target state — 10 top-level categories

```text
Dashboard · Clients · Reports · Disputes · Documents · Payments · Activity · Team · Settings · Tools
```

### Consolidation map (admin)

| Current admin item | Target category | Sub-item |
|---|---|---|
| Command Center | **Dashboard** | (home) |
| Clients | **Clients** | List / Detail / Bulk |
| Upload Reports | **Reports** | Upload |
| Reports & Results | **Reports** | List / Results |
| Disputes | **Disputes** | Queue / Letters / Mailing |
| Documents | **Documents** | Vault / Verification queue |
| Payments | **Payments** | Review / History / Reconciliation |
| Agreements | **Documents** | Agreements |
| Activity | **Activity** | System feed / Per-client filter |
| Settings | **Settings** | Account / Branding / Notifications |
| Advanced Tools | **Tools** | AI control / War Board / Backlog / Automation |
| — *(new)* | **Team** | Admins / Roles / Audit |

### Consolidation map (client)

Client portal stays 9 items but **reframes around outcomes** (see report 06):

| Current | Reframed |
|---------|----------|
| Dashboard | Credit Score Center (home) |
| Results | Progress Center (debt removed, accounts deleted, inquiries removed, mortgage readiness) |
| Reports | My Reports |
| Disputes | Disputes & Letters |
| Documents | Document Vault |
| Payments | Payment Center |
| Agreements | Agreement Center |
| Messages | Credit Coach |
| Settings | Account |

## Redirect map (when consolidation ships)

Existing 16 legacy redirects stay. New redirects to add:

| From | To |
|------|----|
| `/admin/agreements` | `/admin/documents/agreements` |
| `/admin/upload-reports` | `/admin/reports/upload` |
| `/admin/reports` | `/admin/reports/list` |
| `/client-portals-legacy/:slug` | `/admin/clients` |
| `/client/results` | `/client/progress` (with deep-link preservation) |
| `/client/messages` | `/client/coach` |

All redirects via `<Navigate replace />` — no client-side history pollution.

## Hidden-route audit

| Route | Reachable from | Action |
|-------|----------------|--------|
| `/admin/client-preview/:id` | "Preview as client" button (admin) | KEEP, document |
| `/client-portals` | Admin link on `/admin` dashboard | MOVE to `/admin/clients/portals` |
| `/client-portals-legacy/:slug` | None | REMOVE route after one release |
| `/sba/*` | NavigationHeader if logged-in user has SBA role (TBD) | Document as separate module |

## Nav depth target

- Admin: max 2 clicks to any task (top-level → sub-item).
- Client: max 1 click — every category visible in the sidebar.
- Mobile: AdminMobileNav merges into AdminSidebar's responsive variant; one source of truth.

## What this report does NOT do

- Does not change any route.
- Does not modify any sidebar.
- All changes are sequenced in report 10 (Implementation Roadmap) under Phase 2 (Navigation), gated by user approval.
