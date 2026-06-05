# Luxury White-Label Experience Rebuild

A full visual replacement of the admin and client portal so the platform reads as **Experian Premium / Amex / Chase Private Client**, not a CRM/SaaS dashboard. **Zero changes** to auth, data, RLS, routes, hooks, edge functions, payment logic, report matching, or any business behavior. Every page keeps the same data sources and props it already uses — only the presentation layer is replaced.

## 1. Foundation: luxury design system

Update `src/index.css` and `tailwind.config.ts` with a new semantic token set + executive typography, then convert all surfaces to use the new tokens.

- **Palette (HSL tokens, light-first):** `--ivory`, `--champagne`, `--platinum`, `--midnight`, `--midnight-2`, `--emerald`, `--emerald-deep`, `--gold-soft`, `--gold-deep`. Remap the existing `--background`, `--foreground`, `--card`, `--primary`, `--accent`, `--border`, `--muted`, `--sidebar-*` tokens to these so every existing shadcn component inherits the new look without touching component files.
- **Default theme** flips from `dark` to `light` in `App.tsx`'s `ThemeProvider`. Dark stays available but the portals render against the ivory/platinum surface.
- **Typography:** swap Inter/Poppins for **Fraunces** (display, serif) for h1–h3 and **Inter Tight** for body. Add `font-display` and `font-sans` Tailwind families. Generous tracking, looser leading.
- **Spacing rhythm:** add `--space-section` (96/128px), wider container max-widths, larger card radius (`--radius: 1rem`), subtle layered shadows (`--shadow-soft`, `--shadow-card`, `--shadow-elevated`) — no glow, no neon.
- **Premium primitives** in `src/components/luxury/`:
  - `LuxuryCard` (ivory surface, hairline border, soft shadow, optional gold rule)
  - `LuxurySection` (generous vertical rhythm + eyebrow + title)
  - `LuxuryStat` (large numeral, eyebrow label, delta chip)
  - `ScoreGauge` (FICO-style 300–850 arc, current score, delta, range label)
  - `BeforeAfterPanel` (left/right comparison with diff column)
  - `ProgressTimeline` (vertical luxury timeline with dot markers and gold accent on milestones)
  - `DeltaChip`, `EyebrowLabel`, `SectionDivider`
- These primitives are pure presentation — they accept the existing data shapes returned by `useClientPortalData`, `useAdminMetrics`, `usePayments`, etc.

## 2. Admin shell — Command Center IA

Rebuild only the chrome and visuals; every page underneath keeps its existing data + actions.

- **`AdminSidebar`** groups become exactly:
  - **Overview** → Command Center
  - **Clients** → Directory (`/admin/clients`), Portal Editor (`/admin/client-registry`), Reports (`/admin/reports`), Documents (`/admin/documents`), Payments (`/admin/payments`)
  - **Operations** → Disputes (`/admin/disputes`), Work Queue (`/admin/disputes?status=review`), Processing (`/admin/upload-reports`)
  - **Analytics** → Revenue (`/admin/payment-summary`), Deletions, Score Growth, Mortgage Readiness *(new analytics sub-views read from existing tables; no new schema)*
  - **System** → Reconciliation, Registry (`/admin/client-registry`), Audit Reports (`/admin/activity`)
  - **Settings** (`/admin/settings`)
- **`AdminShell`** gets an ivory background, taller header (h-16), serif page title, micro-eyebrow subtitle, right-aligned action slot, hairline border, narrow gold accent under the active sidebar item.
- **`AdminCommandCenter`** is recomposed using `LuxurySection` + `LuxuryStat` + `LuxuryCard`: hero row with 4 large executive KPIs (Active Clients, Open Disputes, Revenue MTD, Avg Score Lift), a wide "Today" panel (queue + recent activity), and a right-rail "Funding Readiness" snapshot. No removal of existing data — `AdminKpiGrid`, `AdminPaymentMetrics`, `MarketingFunnelCard`, and `RecentActivityFeed` are wrapped/restyled, not rewritten.
- All other admin pages (`AdminClients`, `AdminReportsList`, `AdminDisputesPage`, `AdminDocumentsPage`, `AdminPaymentsPage`, `AdminClientRegistry`, `AdminSettings`, `AdminTools`, `AdminActivityPage`, `AdminVerificationReport`, `AdminAgreementsPage`) keep their queries and tables; they're wrapped in `LuxurySection`, get serif headings, and their table/card chrome inherits the new tokens automatically.

## 3. Client portal — premium experience

`ClientPortalLayout` keeps its auth/loading/redirect logic untouched. Visual changes only.

- **Sidebar** (`ClientPortalSidebar`) renamed groups: Overview · Credit Center · Vault · Account · Concierge. "Documents" item is relabeled **Secure Document Vault**. Logo mark becomes a refined gold monogram, not the spark icon.
- **Header** becomes a premium top bar: serif page title, "Welcome back, {first name}" eyebrow, right-side bell + avatar.

### Dashboard (`pages/client/Dashboard.tsx`)
Recomposed using existing `useClientPortalData` only:

1. **Welcome hero** — serif "Welcome back, {fullName}", funding/mortgage readiness status pill, "Last updated {date}" timestamp.
2. **Credit Score Center (largest component on page)** — three large `ScoreGauge` cards side-by-side for **Experian / Equifax / TransUnion**, each with: arc gauge, current score, previous score, point gain, range label (Poor → Exceptional), and a 6-month sparkline. On mobile they stack and swipe. Where per-bureau data isn't yet recorded (`client_credit_scores` keyed by bureau), the three gauges render the existing single score across all bureaus with a "tri-bureau update pending" note — no schema change.
3. **Before vs After transformation panel** — `BeforeAfterPanel` with three rows: Score, Negatives, Debt. Pulls from `startingScore`, `currentScore`, original totals already in `useClientPortalData`.
4. **Results Center** — premium grid: Accounts Deleted, Debt Removed, Inquiries Removed, Personal Info Removed, Current Negatives, Dispute Round — each as a `LuxuryStat` with before/current/difference.
5. **Credit Progress Timeline** — `ProgressTimeline` with rounds + milestones (Reports Uploaded, Round 1/2/3, Mortgage Ready, Vehicle Ready, Funding Ready) computed from existing `activity` feed and `currentDisputeRound`.
6. **Next action + concierge CTA** — keeps existing `nextStep` field, styled as a private-banking advisory card.

### Other client pages (data untouched, chrome replaced)
- **Results** — full premium build of the Results Center above.
- **Reports** — premium "Credit File" page: per-bureau cards with last upload, match status (`MatchStatusBadge` reused), download/refresh actions.
- **Disputes** — luxury case list, round-by-round timeline view.
- **Documents → Secure Document Vault** — vault metaphor: categorized sections (Identity, Income, Statements, Disputes), drag-zone styled as a wax-seal envelope, existing `ClientDocumentManager` upload logic reused.
- **Payments → Account & Billing** — private banking layout: current plan card, balance, ledger of transactions, payment method tiles, receipts. Wraps existing `ClientPaymentWidget`, `PaymentHistoryList`, `ReplaceProofDialog`.
- **Agreements / Messages / Settings** — restyled headers and cards; existing forms/components unchanged.

## 4. Mobile-first pass

Every new luxury primitive is built mobile-first, then upgraded at `md`/`lg`. Specific commitments:

- Sidebar collapses to a bottom tab bar on small screens for the client portal (Dashboard · Score · Vault · Payments · More).
- Score gauges become a horizontal snap-scroll carousel under 768px.
- Hero stats reflow to a 2×2 grid; before/after becomes stacked rows with a delta divider.
- Touch targets ≥ 44px, type scale clamps with `clamp()` to avoid desktop-compressed feeling.
- New `e2e/portal-luxury-responsive.spec.ts` checks the dashboard at 375 / 414 / 768 / 1280 for layout integrity and no horizontal overflow.

## 5. Hard guardrails

- No changes to `useAuth`, `useRoles`, `RouteGuards`, `ProtectedRoute`, `ClientContext`, `useClientPortalData`, `useAdminMetrics`, any hook in `src/hooks/`, any file in `src/integrations/supabase/`, any edge function, any RLS policy, any route path.
- No new tables, no migrations.
- No removal of existing components — only wrapping/restyling. The legacy components (`AdminWarBoard`, `AdminCRMFixedPanel`, `CasePipelineDashboard`, `ClientProcessingGrid`, `AdminReviewQueue`) are simply no longer surfaced in navigation; their files stay for rollback.
- No tone shift in copy beyond the labels listed above.

## Technical notes

- Token-driven theming means most shadcn components (`Card`, `Button`, `Badge`, `Progress`, `Table`, `Sidebar`) inherit the new look with no per-file edits. Only pages composing layout change.
- `ScoreGauge` is pure SVG (no chart library) so it stays fast and renders identically on mobile.
- Fonts are loaded via a single `@import` in `index.css` with `display=swap`.
- All new components live under `src/components/luxury/` so they're easy to locate and audit.
- `AuthDebugPanel`, Playwright suites, SEO meta, and all existing Vitest tests remain valid.

## Out of scope (will not be touched)

- Database schema, RLS, edge functions, secrets
- Auth flows, route guards, role checks, session handling
- Report matching engine, dispute generation, payment processing
- Public marketing homepage (`/`) — it was just refined in the previous funding-readiness pass
- SBA portal (`/sba/*`)
