# Phase 2 — Operations Polish

Phase 2 is too large for one turn without risking regressions. I'll batch the work into three focused passes so you can review between each. No DB, auth, Stripe, RLS, route-path, or upload-handler changes — visual + structural UX only, reusing existing components and data.

## Pass A — Foundation primitives (this turn)

Build the reusable parts every page in Phase 2 will consume, so later passes are short and consistent:

1. **StatusBadge** (`src/components/luxury/StatusBadge.tsx`) — variants: active, pending, needs-review, completed, in-progress, missing, uploaded, signed, unsigned, paid, unpaid, elite, pro, basic. Gold/chrome/blue/green/amber/red mapped via design tokens.
2. **EmptyState** (`src/components/luxury/EmptyState.tsx`) — icon, title, body, primary + optional secondary CTA. Used on all empty surfaces.
3. **NextBestAction** (`src/components/client/NextBestActionCard.tsx`) — dynamic if data present (no signed agreement → sign agreement; no report uploaded → upload report; missing docs → upload docs; else "Contact your concierge"). Pure read of existing hooks (`useClientPortalData`, agreements, documents).
4. **ProgressTimeline** (`src/components/client/ProgressStageTimeline.tsx`) — 7-stage premium timeline with the user-specified labels.
5. **OnboardingChecklist v2** — luxury redesign of existing `OnboardingChecklist` (no logic change) with the 4 status states.

## Pass B — Client portal pages

Wire the primitives into:

- `pages/client/Dashboard.tsx` — status header, NextBestAction, ProgressTimeline, Quick-Actions tile grid, trust microcopy strip.
- `pages/client/Documents.tsx` (Document Center) — secure upload messaging, accepted-types card, checklist, luxury upload cards, empty + loading states.
- `pages/client/Reports.tsx` + `CreditReportUpload` — premium instructions, accepted-source list (Experian/Equifax/TU/IdentityIQ/SmartCredit/MyFreeScoreNow), empty state, analysis status pill.
- `pages/client/Disputes.tsx` — premium header, stage indicator, compliance disclaimer, polished CTAs.
- `ClientOnboarding.tsx` — welcome panel + upgraded checklist + clear completion state.
- AI Credit Assistant page (locate existing route) — premium header, 5 suggested-prompt tiles, compliance banner, empty state.
- Education Center (locate or scaffold within existing route) — card grid of topics with compliant summaries.

## Pass C — Admin portal pages

- `pages/AdminCommandCenter.tsx` — premium KPI grid (only real metrics from `useAdminMetrics`), recently-added-clients panel, dispute workflow widget, quick actions toolbar with gold/chrome treatment.
- `pages/AdminClientEdit.tsx` / `AdminClientPortalEditor.tsx` — overview card, contact, service status, doc/report/dispute status, notes panel (reuse `AdminNotesPanel`), timeline (reuse `ClientActivityTimeline`), quick-action toolbar.
- `AdminClients.tsx` — premium table styling (header chrome, row hover, status badges, responsive).
- `AdminDocumentsPage.tsx` + `AdminUploadReports.tsx` — verification-style review layout, badges.

## Guardrails (every pass)

- All status / progress / metric data sourced from existing hooks. If a value is unavailable, show a neutral fallback or hide it — never fabricate.
- Compliance copy only: never "guaranteed deletion / approval / score increase". Use the approved phrasing list.
- No route paths renamed, no Supabase calls changed, no upload handlers touched, no Stripe changes.
- TypeScript stays clean.

## This turn's deliverable

Pass A — the 5 primitives plus a documented inventory of existing routes/components that Passes B and C will reuse. After you say "go", I run Pass B; after review, Pass C.
