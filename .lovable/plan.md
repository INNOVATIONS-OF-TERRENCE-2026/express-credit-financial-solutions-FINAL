
# Express Credit Financial Solutions — Platform Rearchitecture Plan

This is a **plan-only deliverable**. No code, schema, or routes will change until you approve a phase.

---

## 1. Current Architecture Map

**Auth / providers** (`src/App.tsx`): ErrorBoundary → QueryClient → Theme → SBAConfig → Auth → Roles → Membership → Tooltip → Router. Global: ScrollToTop, GlobalSearchCommand, FloatingChat.

**Route surface (~55 routes)** grouped by intent:

- **Marketing / public:** `/`, `/membership`
- **SBA sub-product (duplicated):** `/sba/*` and `/sba-portal/*` (8 pages × 2 = 16 routes)
- **Client tools (legacy, scattered):** `/dispute-center`, `/data-freeze`, `/onboarding`, `/documents`, `/education`, `/credit-tracking`, `/credit-building`, `/goodwill-letters`, `/credit-monitoring`, `/upload-credit-report`, `/ai-assistant`, `/document-center`, `/score-tracker`, `/payments`, `/payment-history`
- **Client portal (new canonical):** `/client/dashboard|results|reports|disputes|documents|payments|agreements|messages|settings` + legacy `/client/:slug` and `/client-portals`
- **Admin (new canonical):** `/admin` (Command Center), `/admin/clients`, `/admin/clients/:id`, `/admin/client-preview/:id`, `/admin/upload-reports`, `/admin/reports`, `/admin/disputes`, `/admin/documents`, `/admin/payments`, `/admin/agreements`, `/admin/activity`, `/admin/settings`, `/admin/tools`
- **Admin (legacy still mounted):** `/admin-dashboard`, `/admin/login`

**Component inventory:** ~120 components in `src/components/` including 18 admin-only modules (WarBoard, ProcessingGrid, CasePipelineDashboard, ReviewQueue, AutonomousControlPanel, AdminAIControlPanel, CIPExecutionCenter, AutomationControlCenter, BacklogTools, CRMFixedPanel, ClientEditor, ClientOverview, CreditReportManager, CreditReportUploader, DailyOps, DashboardComponents, DocumentList, DocumentUploader, FileUploader, MobileNav, NotesPanel, Panel, Reminders, ReviewQueue, TaskEngine), 10+ client-overlap components (ClientDashboard, ClientPortal, ClientDocumentManager, ClientProfileDetail, ClientProgressTracker, ClientActivityTimeline, ClientNotificationsPanel, ClientAgreementModal, ClientLogin), 9 payment components (new), 5 SBA components.

**Database (87 tables)** — already production. Manual override columns recently added to `clients` (starting/current scores per bureau, accounts_deleted_count, debt_removed_total, hard_inquiries_removed, personal_info_items_removed, remaining_negatives, current_dispute_round, mortgage_readiness_status, ftc_readiness_status, next_step_note, onboarding_status). Live tables for: payment_records, payment_activity_events, client_payment_summary, client_activity_timeline, dispute_cases, dispute_letters, flagged_disputes, credit_report_uploads, document_uploads, client_agreements, client_notifications, user_roles, profiles.

---

## 2. User Journey Audit (current state issues)

**Owner / Admin**
- Two competing dashboards (`/admin` vs `/admin-dashboard`) — confusion about which is canonical.
- Multiple client managers overlap: `AdminClients`, `AdminClientEditor`, `AdminClientOverview`, `AdminCRMFixedPanel`, `ClientProcessingGrid`, `AdminWarBoard`. Same client reachable via 4 routes.
- Reports, disputes, payments split between top-level admin pages, embedded panels in `/admin-dashboard`, and modules now hidden inside `/admin/tools`.
- "Upload Credit Report" workflow exists in 3 places: `AdminCreditReportUploader`, `AdminUploadReports`, `EnhancedCreditReportUpload`.

**Client**
- Two parallel portals: legacy `/client/:slug` (ClientPortals + ClientPortal/ClientDashboard) and new `/client/dashboard` set. Both wired to data; users may land on either depending on entry point.
- Onboarding (`/onboarding`) disconnected from `/client/dashboard` (no post-onboarding redirect contract documented).
- Client-facing routes outside the portal shell (`/upload-credit-report`, `/document-center`, `/payments`, `/dispute-center`, `/credit-monitoring`, `/credit-tracking`, `/score-tracker`, `/credit-building`, `/goodwill-letters`, `/education`, `/ai-assistant`) — same user, ten different chromes.

**Owner / role gating**
- No separate "Owner" role today (`user_roles` enum is admin/moderator/user). Owner = admin in practice. KPIs already wired via `useAdminMetrics`; mortgage-ready + revenue exist; FTC-ready aggregation does not.

---

## 3. Navigation Audit

Current admin sidebar already matches the target 11 items. Problems:
- `/admin-dashboard` (legacy) is still discoverable and contains widgets that duplicate Command Center.
- Client-side has no unified navigation — every legacy page renders its own header or none.
- Public site (`/`) advertises pages (`/credit-tracking`, `/credit-building`, `/goodwill-letters`, `/education`) that are technically client-portal features.

---

## 4. Component Audit — Disposition

| Disposition | Components |
|---|---|
| **Keep as primary** | `AdminShell`, `AdminSidebar`, `AdminCommandCenter`, `AdminKpiGrid`, `AdminClients`, `AdminClientEdit` (+`ResultsOverridePanel`), `AdminUploadReports` (+`ClientMatchEnginePanel`), `AdminReportsList`, `AdminDisputesPage`, `AdminDocumentsPage`, `AdminPaymentsPage` (+payments/* widgets), `AdminAgreementsPage`, `AdminActivityPage`, `AdminSettings`, `AdminTools`, `ClientPortalLayout`, `ClientPortalSidebar`, all `pages/client/*` |
| **Merge into primary** | `AdminClientOverview`, `AdminClientEditor`, `AdminCRMFixedPanel`, `ClientProfileDetail`, `ClientDetailOperations` → into `AdminClientEdit`. `AdminCreditReportUploader`, `AdminCreditReportManager`, `EnhancedCreditReportUpload`, `CreditReportUpload`, `UnifiedUploader` → into `AdminUploadReports`. `AdminDocumentList`, `AdminDocumentUploader`, `ClientDocumentManager`, `DocumentArchive`, `BulkDocumentIntelligence` → into `AdminDocumentsPage`. `FlaggedDisputesTable`, `DisputeCommandCenter`, `DisputeTimelineTracker`, `BulkDisputeWizard` → into `AdminDisputesPage`. `AdminTaskEngine`, `AdminReminders`, `AdminNotesPanel`, `AdminDailyOps`, `AdminAuditLogPanel`, `AdminPanel`, `AdminDashboardComponents` → distributed into Command Center / Activity / Settings. |
| **Move to `/admin/tools` (already done)** | War Board, Processing Grid, Case Pipeline, Review Queue, Autonomous, AI Control, CIP, Automation Center, Backlog Tools |
| **Remove from nav, keep file for now** | `AdminDashboard` (legacy `/admin-dashboard`), `AdminMobileNav` (replaced by sidebar), `ClientPortal`, `ClientDashboard` (legacy), `ClientNotificationsPanel` legacy widget, `ClientProgressTracker` standalone, `OpenAITestPanel`, `OnboardingTour` (re-evaluate later) |
| **Consolidate as client portal pages** | `CreditScoreTracker`, `CreditTracking`, `CreditMonitoring`, `CreditBuildingCenter`, `GoodwillLetters`, `Education`/`EducationCenter`, `DocumentUploadCenter`, `DocumentUpload`, `CreditReportUploadPage`, `AICreditAssistantPage`, `DisputeCenter`, `DataFreezeCenter`, `PaymentsPage`, `PaymentHistoryPage` → become tabs/sections under `/client/*` or removed from client nav |
| **Keep as separate sub-product** | All SBA pages (but dedupe `/sba` vs `/sba-portal` — pick one canonical) |

---

## 5. Route Audit — Proposed Disposition

**Remove from nav (return 301 → canonical):**
- `/admin-dashboard` → `/admin`
- `/sba-portal/*` → `/sba/*` (or reverse — pick one)
- `/payments`, `/payment-history` → `/client/payments`
- `/upload-credit-report`, `/document-center`, `/documents` → `/client/documents`
- `/dispute-center`, `/data-freeze` → `/client/disputes`
- `/credit-tracking`, `/credit-monitoring`, `/score-tracker` → `/client/results`
- `/credit-building`, `/goodwill-letters`, `/education` → `/client/resources` (new single page) or hide
- `/ai-assistant` → hide until Phase 10
- `/client-portals`, `/client/:slug` → `/client/dashboard` (admin-only preview keeps `/admin/client-preview/:id`)

**Keep:** `/`, `/membership`, `/onboarding`, `/admin/login`, all `/admin/*` canonical, all `/client/*` canonical, `/sba/*` canonical.

Result: ~55 routes → **~25 routes**.

---

## 6. Database Audit

Schema is sound. Findings:
- `clients` has the manual-override columns required for Phase 8. No new tables needed for Phases 1–9.
- Missing aggregate: FTC/605B readiness count — already a column (`ftc_readiness_status`), just needs to be added to `useAdminMetrics`.
- `client_activity_timeline` is in use; needs writes from upload/dispute/payment/agreement flows (most already covered by triggers; verify documents + agreements).
- `client_payment_summary` populated by triggers — verified.
- Duplicate concepts: `credit_reports` vs `Credit Reports` vs `credit_report_uploads`. Recommend standardizing reads on `credit_report_uploads` (already in use across new admin pages); leave the older tables untouched but stop writing to them.
- No schema migration is part of this plan. Any future change will be a separate approved migration.

---

## 7. Duplicate Functionality Report

| Area | Duplicates | Canonical |
|---|---|---|
| Admin dashboard | `/admin`, `/admin-dashboard` | `/admin` |
| Client portal | `/client/:slug`, `/client/dashboard` | `/client/dashboard` |
| Client edit | `AdminClientEdit`, `AdminClientEditor`, `AdminClientOverview`, `AdminCRMFixedPanel` | `AdminClientEdit` |
| Report upload | `AdminUploadReports`, `AdminCreditReportUploader`, `EnhancedCreditReportUpload`, `CreditReportUploadPage` | `AdminUploadReports` (admin) + `/client/reports` (client view) |
| Documents | `AdminDocumentsPage`, `DocumentUploadCenter`, `DocumentUpload`, `ClientDocumentManager`, `DocumentArchive` | `AdminDocumentsPage` + `/client/documents` |
| Disputes | `AdminDisputesPage`, `DisputeCommandCenter`, `DisputeCenter`, `BulkDisputeWizard`, `FlaggedDisputesTable` | `AdminDisputesPage` + `/client/disputes` |
| Payments | `AdminPaymentsPage`, `PaymentsPage`, `PaymentHistoryPage` | `AdminPaymentsPage` + `/client/payments` |
| Score views | `CreditScoreTracker`, `CreditTracking`, `CreditMonitoring`, `ScorePredictionCard` | `/client/results` |
| SBA | `/sba/*`, `/sba-portal/*` | `/sba/*` |

---

## 8. Dead / Abandoned Feature Report

- `OpenAITestPanel` — dev artifact
- `DemoUserBanner` + `demo_users` table — appears unused in current routes
- `OnboardingTour` — not wired to current portal shell
- `ChatHistoryPanel` + `chat_history` — present, unused outside AI assistant
- `FloatingChat` global — visible on every route, including admin and public site (decide: keep on client portal only)
- `MailingLabelGenerator`, `MailingBundleDownloader` — orphaned from new dispute flow
- `PlaidBankLink` + `create-plaid-link-token` + `exchange-plaid-token` edge functions — present but not surfaced anywhere
- `ReceiptGenerator` — not wired into payments flow
- `score_predictions`, `predict-credit-score` edge function — not surfaced

---

## 9. UX Problems Report

1. Two routes lead to "admin dashboard"; KPI numbers differ between them.
2. Client identity collision: some flows use `auth.uid()` / `profile.id`, others use `clients.id`. (Match engine + ResultsOverridePanel are correct; legacy pages need audit.)
3. No persistent shell on client pages outside `/client/*` — chrome changes per page.
4. Public marketing nav links to deep client features, breaking funnel.
5. Floating chat overlays admin tables.
6. Too many "upload" entry points produce inconsistent results across `credit_report_uploads`, `documents`, `document_uploads`, `bulk_upload_files`.
7. Admin sidebar exposes "Advanced Tools" — fine — but tool tabs themselves are not labeled as legacy.
8. Mobile: admin sidebar collapses, but tables overflow; client portal lacks bottom nav.
9. Empty-state copy is inconsistent ("No data", "Nothing yet", blank panels).
10. Loading states inconsistent — some pages show skeletons, others spinners, others nothing.

---

## 10. Proposed New Information Architecture

```text
Marketing
  /                       Landing
  /membership             Plans

Auth
  /admin/login            Owner/Admin login
  (client login lives in public site, redirects to /client/dashboard)

Client Portal              [shell: ClientPortalLayout]
  /client/dashboard        Hero + KPIs + Next Step + Activity
  /client/results          Bureau scores, deletions, debt removed, readiness
  /client/reports          Uploaded credit reports + history
  /client/disputes         Rounds, letters, status
  /client/documents        Required + uploaded + status
  /client/payments         Submit, history, receipts
  /client/agreements       Sign + view
  /client/messages         Notifications + admin notes (client-visible)
  /client/settings         Profile, security

Admin / Owner              [shell: AdminShell]
  /admin                   Command Center (13 KPIs, activity feed)
  /admin/clients           Single client list (search, filter)
  /admin/clients/:id       Single client edit (tabs: Overview, Results Override, Reports, Disputes, Documents, Payments, Agreements, Notes, Activity)
  /admin/upload-reports    Upload + Match Engine
  /admin/reports           All reports across clients
  /admin/disputes          All disputes across clients
  /admin/documents         Document review queue
  /admin/payments          Payment review + history
  /admin/agreements        Agreement status
  /admin/activity          Cross-client activity stream
  /admin/settings          Roles, branding, integrations
  /admin/tools             Advanced/legacy modules (War Board, Pipeline, etc.)

SBA sub-product
  /sba, /sba/precheck, /sba/consent, /sba/intake, /sba/documents, /sba/packet, /sba/dashboard, /sba/admin
```

---

## 11. Proposed New Navigation Structure

**Admin sidebar (already correct):** Dashboard, Clients, Upload Reports, Reports & Results, Disputes, Documents, Payments, Agreements, Activity, Settings, Advanced Tools.

**Client sidebar:** Dashboard, Results, Reports, Disputes, Documents, Payments, Agreements, Messages, Settings.

**Public top nav:** Home, Pricing, Login. (No deep links into client features.)

**Client `/admin/clients/:id` tabs:** Overview · Results Override · Reports · Disputes · Documents · Payments · Agreements · Notes · Activity.

---

## 12. Proposed New Admin Experience

After login (admin role) → `/admin` Command Center.

- Above the fold: 13 KPI tiles (already built) wired to `useAdminMetrics` + new FTC-ready aggregate.
- Row 2: Clients needing action (flagged disputes, payments needing review, documents pending) — each row is one click to that client.
- Row 3: Cross-client activity feed (latest 20 events from `client_activity_timeline`).
- Sidebar always visible; mobile collapses to icon rail.
- Every client reachable in ≤2 clicks: Command Center → Clients → row click; or Command Center → action card → client.

---

## 13. Proposed New Client Experience

After login (user role with `clients` row) → `/client/dashboard`.

Above the fold:
- Welcome + name + next-step banner.
- Score snapshot (Starting / Current / Change).
- Transformation tiles (Accounts Deleted, Debt Removed, Inquiries Removed, Personal Info Removed).

Below:
- Dispute Progress (round + remaining negatives + progress bar).
- Payment summary card.
- Documents needed, Agreements signed, Reports count (each one click to dedicated page).
- Activity timeline (latest 10).
- Empty-state copy when no data yet ("Your portal is set up…").

Visual language: midnight black + deep navy background, gold primary, electric-blue accent, glass cards, consistent spacing, single H1 per page.

---

## 14. Migration Plan (phased, surgical, no rebuilds)

Each phase ships independently and is reversible.

**M1 — Route consolidation (frontend only):**
- Add redirects from legacy routes to canonical (`/admin-dashboard` → `/admin`, `/payments` → `/client/payments`, etc.).
- Keep legacy components mounted but unreachable from nav.

**M2 — Client portal shell unification:**
- Wrap remaining client-facing legacy pages (CreditScoreTracker, CreditMonitoring, DocumentUploadCenter, etc.) in `ClientPortalLayout` or fold their content into existing `/client/*` pages, then redirect.

**M3 — Admin client edit consolidation:**
- Convert `AdminClientEdit` into a tabbed page; move content from `AdminClientEditor`, `AdminClientOverview`, `AdminCRMFixedPanel`, `ClientProfileDetail`, `ClientDetailOperations` into tabs; delete duplicate routes.

**M4 — Upload / Documents consolidation:**
- Make `AdminUploadReports` the only admin upload entry; route legacy uploaders to it. Same for documents.

**M5 — Public site cleanup:**
- Remove deep client-feature links from `Index`/marketing.
- Restrict `FloatingChat` to client portal only.

**M6 — KPI completeness:**
- Add FTC/605B-ready count to `useAdminMetrics`.
- Verify document + agreement events write to `client_activity_timeline`.

**M7 — Visual polish pass:**
- Standardize empty-states, loading states, table density, card radius, spacing tokens in `index.css` + `tailwind.config.ts`.

**M8 — Dead code removal (only after M1–M7 ship and bake):**
- Remove `OpenAITestPanel`, `DemoUserBanner`, orphaned mail/plaid/score-prediction surfaces (kept in git history).

**M9 (later) — AI roadmap:** out of scope here.

No database migration is part of M1–M8. No auth changes. No new tables. No new providers in `App.tsx`.

---

## 15. Risk Analysis

| Risk | Likelihood | Mitigation |
|---|---|---|
| Breaking a live client bookmark (e.g. `/payments`) | High | All legacy routes become **redirects**, not 404s. |
| Hidden dependency on `/admin-dashboard` widgets | Medium | Keep the page mounted but un-linked for 1 release; monitor logs. |
| Auth/role regression | High | Do not touch `AuthProvider`, `RolesProvider`, `ProtectedRoute`, `user_roles`, or RLS. |
| Client identity mix-up in consolidated edit page | High | All reads/writes continue to use `clients.id` + `client.user_id` as established in `ResultsOverridePanel` and `clientMatchEngine`. |
| Visual regression on public site | Low | Marketing edits are limited to nav links + chat scope. |
| Data loss on duplicate-component removal | Low | Removal happens last (M8), after redirects and consolidation are proven. |
| Mobile regressions | Medium | Each phase includes mobile QA at 375 / 768 / 1024. |

---

## 16. Implementation Roadmap (build only after you approve each phase)

1. **Approve plan** (this document).
2. **M1 — Route consolidation** (1 PR, no schema).
3. **M2 — Client shell unification** (1 PR).
4. **M3 — Admin client edit tabs** (1 PR).
5. **M4 — Upload/Documents consolidation** (1 PR).
6. **M5 — Public site cleanup + chat scope** (1 PR).
7. **M6 — KPI completeness** (1 PR; metric only, no schema).
8. **M7 — Visual polish tokens** (1 PR).
9. **M8 — Dead code removal** (1 PR).
10. **M9 — AI roadmap** (separate plan).

---

## What I need from you

Confirm one of:
- **A)** Approve the full plan and let me begin **M1 (route consolidation)** next.
- **B)** Approve the audit but reorder phases (tell me which to do first).
- **C)** Request changes to the disposition lists in §4/§5/§7 before any build.

No files will be changed until you choose.
