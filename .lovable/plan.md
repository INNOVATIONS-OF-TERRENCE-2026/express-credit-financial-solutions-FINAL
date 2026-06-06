# Express Credit & Financial Solutions — White-Label Luxury UI Upgrade

This is a UI/branding pass over the existing CRM. No Supabase schema, auth, Stripe, RLS, route, or business-logic changes. Existing components are reused; only styling, copy, and a few thin presentation primitives change.

## Scope guardrails (non-negotiable)

- No changes to: `src/integrations/supabase/*`, auth context (`useAuth`), route guards, RLS, edge functions, Stripe/payments logic, table/bucket/column names, dispute workflow services, document upload pipelines, agreement signing flow.
- No new routes, no removed routes, no renamed files unless required to swap branding.
- TypeScript must stay clean; no business logic moved.

## Phase 1 — Foundation (design tokens + branding)

1. Audit current tokens in `src/index.css` and `tailwind.config.ts` (already has midnight/gold/ivory/champagne/platinum). Tighten them into a coherent luxury palette: midnight base, gold accent, chrome/silver dividers, glass surfaces, soft glow shadows.
2. Add reusable utility classes for: glass card, gold accent border, chrome divider, premium button variants (primary gold-gradient, secondary midnight-glass, danger, success, disabled).
3. Remove Lovable branding everywhere:
   - `index.html` meta tags, title, og tags → Express Credit & Financial Solutions
   - `public/robots.txt`, `public/llms.txt`, `public/sitemap.xml` references
   - Any "Made with Lovable" / "Powered by Lovable" footer text
   - Strip placeholder/demo copy in `ClientLogin.tsx`, dashboards, empty states
4. Standardize brand strings: "Express Credit & Financial Solutions", "Client Portal", "Admin Command Center", "Credit Repair Dashboard", "Document Center", "Dispute Center", "AI Credit Assistant", "Education Center", "Compliance Center", "Progress Tracker".

## Phase 2 — App shell & navigation

- `ClientPortalLayout` + `ClientPortalSidebar` + `ClientMobileNav`: apply midnight gradient background, gold active-state accent (already partially there), chrome divider rules, refined header typography.
- `AdminShell` + `AdminSidebar` + `AdminMobileNav`: same treatment, labeled "Admin Command Center".
- Ensure mobile nav stays usable; sticky top header with glass blur.

## Phase 3 — Auth pages

- `ClientLogin.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`, `AdminLogin.tsx`: replace yellow-on-black with the unified midnight+gold token system, glass card, gold focus ring on inputs, premium primary button, compliance-safe microcopy. Keep all auth handlers intact.

## Phase 4 — Client portal pages

Polish (visual only) for: `Dashboard`, `Results`, `Reports`, `Disputes`, `Documents`, `Payments`, `Agreements`, `Messages`, `Settings`, `ClientOnboarding`. Apply LuxuryCard, EyebrowLabel, consistent page header pattern, polished empty + loading states, compliance-tone copy.

## Phase 5 — Admin portal pages

Polish: `AdminCommandCenter`, `AdminClients`, `AdminClientEdit`, `AdminClientPortalEditor`, `AdminDocumentsPage`, `AdminDisputesPage`, `AdminPaymentsPage`, `AdminReportsList`, `AdminUploadReports`, `AdminSettings`, `AdminTools`. Same primitives; gold/chrome accents on tables and KPI cards.

## Phase 6 — Shared primitives

- Buttons: extend `button.tsx` variants with `premium` (gold gradient), `glass` (midnight), keep existing variants intact.
- Inputs: subtle dark-glass variant via className, no API break.
- Tables: add a `.lux-table` class set (header chrome, row hover, status badge tokens).
- Empty + loading states: a couple of small components reused across pages.

## Phase 7 — Compliance copy sweep

Replace any noncompliant language ("guaranteed deletion", "instant boost", etc.) with compliant alternatives ("targeted dispute workflow", "credit profile review", "progress tracking", "compliance-focused dispute preparation").

## Phase 8 — QA

- Build clean (typecheck via harness).
- Visual spot-check key pages at desktop + mobile via preview.
- Confirm no auth/route/Stripe regressions by inspection (no logic touched).

## Technical notes

- All new colors via HSL tokens in `index.css` + Tailwind config — no hardcoded hex in components.
- No new dependencies.
- No DB migrations.
- Changes are additive on tokens; existing class usage continues to work.

## Deliverable at the end

Summary listing: pages upgraded, branding removed/replaced, components modified, files changed, functionality preserved, and any issues observed but intentionally not changed.

## Suggested execution order in this session

Given the size, I recommend shipping Phase 1 + 2 + 3 (foundation, shell, auth) in this turn, then iterating phases 4–7 in follow-up turns so you can review the look between passes. Reply "go" to proceed with Phases 1–3, or tell me to bundle more/less per turn.
