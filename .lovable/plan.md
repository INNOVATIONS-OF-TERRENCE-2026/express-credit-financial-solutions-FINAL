## Phase 1 — Discovery (complete)

Three parallel investigators mapped the platform. Anchors of reachability:

- **Admin**: `/admin` → `AdminCommandCenter` (sidebar in `src/components/admin/AdminSidebar.tsx`, 11 links — all resolve)
- **Client**: `/client/*` → `client/*.tsx` (sidebar in `src/components/client/ClientPortalSidebar.tsx`, 9 links — all resolve)
- **Public**: `/` → `Index.tsx` (header in `src/components/NavigationHeader.tsx` — 9 links still go through legacy redirect routes)
- **SBA**: `/sba/*` — self-contained, all routes active

All routes resolve. No 404s. No missing element files. The fragmentation is in the **components and tables behind** the routes, not the routes themselves.

## Phase 2 — Autopsy (findings by domain)

### Orphans (unreachable from any nav anchor) — 13 files
```text
src/pages/CreditReportUploadPage.tsx
src/pages/DisputeCenter.tsx
src/pages/DocumentUpload.tsx
src/pages/DocumentUploadCenter.tsx
src/pages/PaymentHistoryPage.tsx
src/pages/AICreditAssistantPage.tsx
src/pages/CreditBuildingCenter.tsx
src/pages/CreditMonitoring.tsx
src/pages/CreditScoreTracker.tsx
src/pages/CreditTracking.tsx
src/pages/DataFreezeCenter.tsx
src/pages/Education.tsx
src/pages/EducationCenter.tsx
src/pages/GoodwillLetters.tsx
src/pages/PaymentsPage.tsx        (legacy mounted at /payments only)
src/components/UnifiedUploader.tsx
src/components/AdminClientOverview.tsx
src/components/DocumentArchive.tsx
src/components/DisputeTimelineTracker.tsx
src/components/AICreditAssistant.tsx
```

### Duplicate components (still reachable only via legacy `AdminDashboard` shell)
`AdminCreditReportUploader`, `AdminCreditReportManager`, `EnhancedCreditReportUpload`, `BulkDocumentIntelligence`, `DisputeCommandCenter`, `NotificationCenter`, `AdminReminders`, `AdminFileUploader`, `ClientProfileDetail`, `ClientDetailOperations`. Retiring the legacy `AdminDashboard` route is one cut that orphans all of them.

### Orphan database surface (defined in `types.ts`, zero `.from()` calls in repo)
- **Tables**: `Credit Reports`, `document_uploads`, `client_documents`, `dispute_docs`, `identity_docs`, `ai_dispute_letters`, `dispute_timeline`, `dispute_cases`, `notification_preferences`, `client_action_tracker`, `client_payment_summary`, `cashapp_orders`
- **Storage buckets**: `document-uploads`, `document-archive`, `verification-docs`, `identity-docs`, `ssn-docs`, `utility-bills`, `admin-docs` (no `.upload()` targets them; canonical buckets are `client-documents` and `credit-reports`)
- **Edge functions**: `preview-dispute-letter` (duplicate of `generate-dispute-preview`), `bulk-document-intelligence-processor` (only consumer is legacy `BulkDocumentIntelligence`), `education-content` (consumer is orphan `Education.tsx`)

### Public marketing nav is lying
`NavigationHeader.tsx` advertises `/sba-portal`, `/data-freeze`, `/dispute-center`, `/documents`, `/upload-credit-report`, `/education`, `/credit-building`, `/ai-assistant`, `/credit-monitoring` — all of which only exist as redirects. Marketing nav should point at canonical paths or drop the link entirely.

## Phase 3 — Single Source of Truth (target state)

| Domain | One canonical page | One canonical component | Tables kept | Tables retired |
|---|---|---|---|---|
| Reports | `AdminUploadReports` + `AdminReportsList` + `client/Reports.tsx` | `CreditReportUpload` (+ `CreditReportVersionHistory`) | `credit_report_uploads`, `credit_reports` | `Credit Reports` (view) |
| Documents | `AdminDocumentsPage` + `client/Documents.tsx` | `AdminDocumentList` (admin) + `SecureVerificationUpload` (client) | `document_archive`, `client_verification_secure` | `document_uploads`, `client_documents`, `dispute_docs`, `identity_docs` |
| Disputes | `AdminDisputesPage` + `client/Disputes.tsx` | merge `FlaggedDisputesTable` + `BulkDisputeWizard` INTO `AdminDisputesPage` | `dispute_letters`, `flagged_disputes`, `ai_letter_previews`, `violation_flags` | `dispute_cases`, `ai_dispute_letters`, `dispute_timeline`, `dispute_docs` |
| Notifications | `client/Messages.tsx` + inline admin reminders on `AdminCommandCenter` | `ClientNotificationsPanel` + `ClientActivityTimeline` | `client_notifications`, `notification_templates`, `payment_notifications`, `payment_activity_events` | `notification_logs`, `notification_preferences`, `admin_notifications` |
| Clients | `AdminClients` + `AdminClientEdit` + `client/Dashboard.tsx` | `AdminClientEditor` + `ClientPortal` | `clients`, `profiles`, `user_roles`, `client_intelligence_packets`, `demo_users` | `client_action_tracker` |
| AI / Automation | `AdminTools` | `AdminAIControlPanel`, `AutomationControlCenter`, `AutonomousControlPanel`, `CIPExecutionCenter` | — | — |
| Payments | `AdminPaymentsPage` + `client/Payments.tsx` | `ClientPaymentWidget` + `PaymentHistoryList` + `AdminPaymentsTable` | `payment_records`, `payment_receipts`, `payment_notifications`, `payment_activity_events`, `payments`, `purchases` | `client_payment_summary`, `cashapp_orders` |

## Phase 4 — Admin shell (substantially complete; residual work)

M1–M8 already collapsed admin to: Command Center · Clients · Reports · Disputes · Documents · Payments · Activity · Agreements · Settings · Tools. Remaining:

1. Drop the `/admin-dashboard-legacy` route and delete `src/pages/AdminDashboard.tsx`. This is the single deletion that orphans 7 duplicate components.
2. Move `FlaggedDisputesTable` + `BulkDisputeWizard` into `AdminDisputesPage` as tabs (kills the orphan `DisputeCenter` shell).
3. Surface admin reminders inline on `AdminCommandCenter` (kills `AdminReminders`).

## Phase 5 — Client home rebuild (zero schema changes)

The 14 required metrics already exist on `clients` and three supporting tables. Implementation is a hook extension + UI render only.

| # | Metric | Source | Status |
|---|---|---|---|
| 1 | current_score | `clients.current_score_eq/tu/ex` | already in hook |
| 2 | score_change | computed `currentScore − startingScore` | already in hook |
| 3 | debt_removed | `clients.debt_removed_total` | already in hook |
| 4 | accounts_deleted | `clients.accounts_deleted_count` | already in hook |
| 5 | remaining_negatives | `clients.remaining_negatives` | already in hook |
| 6 | hard_inquiries_removed | `clients.hard_inquiries_removed` | already in hook |
| 7 | personal_info_removed | `clients.personal_info_items_removed` | already in hook |
| 8 | mortgage_readiness | `clients.mortgage_readiness_status` | **add to hook + UI** |
| 9 | current_status | `clients.status` + `clients.workflow_status` | **add to hook + UI** |
| 10 | latest_update | `client_activity_timeline.created_at` newest | **add query + render** |
| 11 | next_action | `clients.next_action` (+ `next_step_note`) | partial — concat note |
| 12 | upcoming_milestones | `pipeline_stages` where `status != 'completed'` via `purchases` join | **add query + render** |
| 13 | timeline_of_progress | `score_history` ordered by `recorded_at` | **add query + render** |
| 14 | recent_activity | `client_activity_timeline` where `visible_to_client = true` | hook field exists but is empty — **populate** |

Net work: extend `src/hooks/useClientPortalData.ts` with three new queries, rewrite `src/pages/client/Dashboard.tsx` to the new layout (Hero score, Removed-vs-Remaining grid, Status + Next Action, Milestones, Timeline, Activity).

## Phase 6 — Credit Report Intelligence Engine (net new work)

Deterministic matcher between an uploaded report and a client:

1. **New edge function** `match-report-to-client` — input: `credit_report_uploads.id` (or freshly parsed extract). Steps:
   - Normalize candidate name + DOB + address from the parsed report.
   - Score against every `clients` row: exact `dob` match = +60, normalized full-name match = +25 (Levenshtein ≤ 2 = +18), normalized address street+zip match = +15.
   - Confidence ≥ 70 → auto-link (set `credit_report_uploads.client_id`). Confidence 40–69 → write a row to a new `document_match_reviews` (already in DB, 9 cols — repurpose) for admin disambiguation. < 40 → leave unmatched, flag in admin queue.
2. **Versioning + history**: `credit_reports.is_current` + `credit_reports.version` already exist (auto-bumped by `bump_credit_report_version` trigger). Add a `credit_report_snapshots` view that joins versions + diffs (accounts added/removed, score delta per bureau).
3. **Before/after diff component** on `AdminReportsList` and `client/Reports.tsx` — reuses existing `CreditReportVersionHistory`, extended with a diff renderer fed by the snapshots view.
4. **Auto-progress writer**: when a newer version posts a score delta, insert a row into `client_activity_timeline` (`activity_type='score_change'`, `visible_to_client=true`) and update the matching `clients.current_score_*` columns. This automatically feeds Phase 5's metrics 1, 2, 10, 13, 14.

Schema impact: **one optional FK** (`pipeline_stages.client_id` to avoid the `purchases` join), **one view** (`credit_report_snapshots`), **one new edge function**. No new tables.

## Phase 7 — White-label enterprise UX (design system replacement)

Goal: replace the design language without rewriting routes or components.

1. **New token layer** in `src/index.css` and `tailwind.config.ts`: executive palette (deep navy + paper-white + warm gold accents), 8-pt spacing scale, 0–24px radius scale, two type families (Söhne-class display + Inter body), surface elevation tokens, motion tokens (200/320/480 ms).
2. **shadcn variants only**: extend `Button`, `Card`, `Badge`, `Input`, `Select`, `Table` with `enterprise` variants. Existing components keep working; pages opt in by switching variant prop.
3. **AdminShell + ClientPortalLayout chrome rewrite**: full-height sidebar with grouped sections, contextual breadcrumbs, command-K palette (already exists in `GlobalSearchCommand`), persistent right rail for quick actions on detail pages.
4. **Density**: data tables get sticky headers, zebra rows off, hover row reveal of actions, per-column sort.
5. **Hard rule** carried from the existing critical-instruction set: no raw color classes in components — every color goes through HSL semantic tokens.

This is the largest visual lift but touches only tokens + 3 shell files + shadcn primitives. Application pages inherit it.

## Phase 8 — Migration order (low → high blast radius)

```text
Step 1  Delete orphans (no consumer to break)
        - 15 orphan page files
        - 5 orphan components
        - 3 orphan edge functions
        - public marketing nav cleaned up

Step 2  Retire AdminDashboard legacy route
        - Drop /admin-dashboard-legacy
        - Delete 7 duplicate admin components in same commit

Step 3  Disputes consolidation
        - Move FlaggedDisputesTable + BulkDisputeWizard into AdminDisputesPage tabs
        - Delete DisputeCenter page + DisputeCommandCenter + DisputeTimelineTracker

Step 4  DB cleanup migration (irreversible, run last among cleanup)
        - DROP TABLE: Credit Reports, document_uploads, client_documents,
          dispute_docs, identity_docs, ai_dispute_letters, dispute_timeline,
          dispute_cases, notification_preferences, client_action_tracker,
          client_payment_summary, cashapp_orders
        - Delete 7 orphan storage buckets (after listing object counts to confirm zero)

Step 5  Client home rebuild (Phase 5)
        - Extend useClientPortalData (3 new queries, 6 new fields)
        - Rewrite client/Dashboard.tsx to 14-metric layout
        - Keep client/Results.tsx as the per-bureau detail view

Step 6  Report Intelligence Engine (Phase 6)
        - New edge fn match-report-to-client
        - credit_report_snapshots view
        - Diff component + auto-progress writer
        - Optional FK pipeline_stages.client_id

Step 7  Design system swap (Phase 7)
        - New tokens
        - shadcn enterprise variants
        - Rewrite AdminShell + ClientPortalLayout chrome
        - Roll page by page, starting with /admin and /client/dashboard
```

## Deliverables map (the 9 reports requested in Phase 8 of the brief)

| # | Report | Lives in this plan as |
|---|---|---|
| 1 | Architecture Report | Phase 1 + Phase 3 SSOT table |
| 2 | Broken Systems Report | Phase 2 — orphans + lying nav |
| 3 | Duplicate Systems Report | Phase 2 — duplicate components + Phase 3 retirement table |
| 4 | Database Refactor Report | Phase 3 (tables kept/retired) + Migration Step 4 |
| 5 | Navigation Refactor Report | Phase 2 nav-lying section + Migration Step 1 (public nav cleanup) |
| 6 | UX Refactor Report | Phase 7 |
| 7 | Client Portal Refactor Report | Phase 5 |
| 8 | Admin Portal Refactor Report | Phase 4 + Migration Steps 2–3 |
| 9 | Migration Plan + Implementation Order | Phase 8 |

## Acceptance gates

- After Step 1: route smoke test (existing `src/test/smoke.e2e.test.ts`) still green; UI tests still green; build clean.
- After Step 2: admin sidebar count unchanged; no broken imports; `bun run build` succeeds.
- After Step 4: zero `.from('<dropped table>')` references in repo; storage buckets list shows only canonical 2.
- After Step 5: all 14 Phase-5 fields render with real data on `client/dashboard` for a seeded client; UI test asserts each.
- After Step 6: uploading a known-client report auto-links with confidence ≥ 70 in ≤ 5 s; an intentionally ambiguous report routes to `document_match_reviews`.
- After Step 7: zero raw color/font classes in `src/pages/**` and `src/components/**` (lint rule); contrast AA passes in light + dark.

## Out of scope (call out, do not silently build)

- New AI modules
- Realtime everywhere (current explicit Refresh pattern stays)
- Mobile app
- Multi-tenant / white-label per-client branding (the brief asks for enterprise *look*, not multi-tenant infrastructure)
- Stripe checkout rewrite (existing flow stays)
- Email template overhaul (keeps current `send-notification-email`)

No code changes will be made under this plan until you approve it and then approve each migration step in order.
