# 07 — Admin Experience

Per-screen and per-task analysis. Source: `_stream-d-ux.md` §4.

## Admin surface (13 routes)

| Route | Page | Purpose | Strength | Friction |
|-------|------|---------|----------|----------|
| `/admin` | AdminCommandCenter | KPIs + recent activity + payment metrics + funnel | Solid single-screen overview | KPIs query 5 tables on every mount; no caching |
| `/admin/clients` | AdminClients | Client list + bulk actions | Bulk preview modal (June 4) | No saved filters/segments |
| `/admin/clients/:id` | AdminClientEdit | Edit profile + scores + agreements + payments | Confirmation modal (June 4) | Modal opens before route-level dirty check |
| `/admin/client-preview/:id` | AdminClientPreview | View as client | Useful | Hidden — only reachable from deep link |
| `/admin/upload-reports` | AdminUploadReports | Bulk PDF ingest + match preview | Real workflow | Match engine divergence (P1-1) means preview ≠ assignment |
| `/admin/reports` | AdminReportsList | All reports across clients | Searchable | No per-client filter; no score-delta column |
| `/admin/disputes` | AdminDisputesPage | Dispute queue | Has review state | Status filter via query string; no saved views |
| `/admin/documents` | AdminDocumentsPage | Document review | Wired to `document_archive` | Verification uploads invisible (P0-8) |
| `/admin/agreements` | AdminAgreementsPage | Signed agreements | Simple list | No reminder workflow for unsigned |
| `/admin/payments` | AdminPaymentsPage | Payment review queue | `AdminPaymentReviewModal` is well-built | No reconciliation report |
| `/admin/activity` | AdminActivityPage | System feed | Pulls `audit_logs` | WF-2 and WF-3 don't log (P1-5) — feed is incomplete |
| `/admin/settings` | AdminSettings | Account, branding | Functional | No team/role mgmt UI |
| `/admin/tools` | AdminTools | AI control, war board, backlog, etc. | Power-user surface | 8+ panels stacked vertically; needs sub-nav |
| `/client-portals` | ClientPortalLinks | Per-client portal URLs | Convenient | Should live under `/admin/clients` |

## 7 critical admin jobs — time to task

Measured as **clicks + page loads** from `/admin`.

| # | Job | Today | Target |
|---|-----|-------|--------|
| 1 | Find client by name | 2 clicks (Clients → search field) | 1 — global ⌘K search (`GlobalSearchCommand.tsx` exists, not wired) |
| 2 | Open specific client profile | 3 clicks (Clients → row → Edit) | 1 — direct from ⌘K |
| 3 | Upload credit report for client | 4 (Upload Reports → choose client → file → confirm) | 2 — from client profile, "Upload" button |
| 4 | Edit client personal info | 4 (Clients → row → Edit → field → Save → Confirm modal) | 3 — combine confirm modal with the same edit page |
| 5 | Review pending payment | 3 (Payments → row → modal) | 3 ✔ (good) |
| 6 | Send dispute letter | 5+ (Disputes → case → generate → review → confirm → send) — and which of 4 letter functions runs is unclear | 3 with single canonical letter pipeline |
| 7 | See full activity for a client | 4 (Activity → filter by client → scroll) — and it's incomplete (P1-5) | 1 — Activity tab inside client profile |

**Headline:** 4 of 7 jobs take >3 clicks. Target ≤2 for read jobs, ≤3 for write jobs.

## Friction inventory

- **Global search not wired.** `src/components/GlobalSearchCommand.tsx` exists with a full command-palette skeleton; no mount in `AdminShell`.
- **No per-client tabbed profile.** Today the admin bounces between `/admin/clients/:id`, `/admin/payments`, `/admin/documents`, `/admin/activity` filtered by client. A single client profile with tabs (Overview / Reports / Disputes / Documents / Payments / Activity / Notes) collapses 6 destinations into 1.
- **Bulk action confirmation modal (June 4)** is solid; replicate the pattern for bulk dispute mailing and bulk document approval.
- **No saved filters / segments** anywhere. Admins re-type "needs review" daily.
- **Notifications inbox missing** — admin gets no aggregated "things needing review" inbox. `client_notifications` exists but is client-only.
- **Tools page is a dumping ground** — needs sub-categories matching the 10-category nav (Automation tools, AI tools, Maintenance tools).
- **No team management UI.** Adding/removing admins requires SQL today.

## What admins want (inferred from directive)

1. Salesforce-grade global search (⌘K, fuzzy, multi-entity).
2. One-screen client profile with everything.
3. Operational inbox: review queue across payments + documents + disputes + verification.
4. Daily ops view: today's milestones, today's deadlines, today's mailings.
5. Team & roles UI.
6. Reconciliation reports for payments + dispute outcomes.

## Where current admin UX is genuinely good (keep)

- `AdminCommandCenter` layout (KPI grid + funnel + quick actions + recent activity) is a strong skeleton.
- `AdminPaymentReviewModal` flow is enterprise-grade.
- Bulk preview confirmation modal pattern (June 4) is the right primitive — extend it.
- `useAdminMetrics` / `useAdminPayments` hooks are cleanly separated and re-usable.

## Where current admin UX must change (phase 4)

- Unify client profile into tabbed view (Phase 4-A).
- Wire `GlobalSearchCommand` to `AdminShell` (Phase 4-B).
- Add Tools sub-nav (Phase 4-C).
- Add Team page (Phase 4-D, depends on `user_roles` UI).
- Add reconciliation reports (Phase 4-E).

Sequenced in report 10.
