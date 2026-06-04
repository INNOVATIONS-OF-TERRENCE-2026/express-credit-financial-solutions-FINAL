
# Execute Full Transformation — All 7 Phases

The forensic audit is complete (`docs/audit/`). This plan executes every phase end-to-end. Given the scope (security patches, schema consolidation across 72 tables, navigation rebuild, client + admin UX rebuild, report intelligence engine, full visual rip-and-replace, scalability), this will run as a sequenced multi-phase build with approval gates **only at destructive checkpoints** (schema drops, bucket merges, route removals). Everything else proceeds straight through.

## Phase 0 — Emergency Security (P0 patches)

- Add JWT validation to `generate-dispute-letter` and audit every other edge function for missing `getClaims()`; patch all gaps.
- Move SSN encryption key from hard-coded constant to Supabase Vault / edge secret; rotate `encrypt_ssn_secure` + `decrypt_ssn_secure` to read from env.
- Migrate Plaid plaintext tokens → `encrypt_plaid_token` at rest; backfill existing rows; force `decrypt_plaid_token_with_audit` on read.
- Wrap every `/admin/*` and `/client/*` route in `<ProtectedRoute>` with role check.
- Write RLS policies for the 18 tables with RLS enabled + zero policies (identified in `04-database-architecture.md`); add missing GRANTs.
- Fix `SecureVerificationUpload` to create DB row in same transaction as storage upload (or delete object on failure).

**Gate:** security scan must return zero P0 before Phase 1.

## Phase 1 — Schema & Backend Consolidation

- Collapse duplicate tables per `03-duplicate-systems.md` using view-based aliasing (preserve all reads):
  - `documents` + `document_archive` + `client_documents` → canonical `document_archive`
  - `payments` + `payment_records` + `payment_receipts` → canonical `payment_records`
  - `credit_scores` + `client_credit_scores` + `score_history` → canonical `credit_scores`
  - `notifications` family → canonical `client_notifications`
- Reduce edge functions 25 → 18 (merge duplicate dispute-letter generators, consolidate upload handlers).
- Reduce storage buckets 15 → 7 (consolidate `*-docs`, `*-uploads` into `document-archive` + `identity-docs` + `credit-reports` + `dispute-letters` + `signatures` + `cashapp-proofs` + `admin-docs`); migrate objects; update all references.
- Delete 25+ orphan components flagged in `_stream-a-frontend.md`.

**Gate:** approval before dropping deprecated tables/buckets.

## Phase 2 — Navigation Reorganization

- Implement the 10-category nav tree from `05-navigation-architecture.md`.
- Add redirect map for every old route → new route (zero broken links).
- Single `AppShell` with role-aware sidebar replacing the current 4 nav patterns.

## Phase 3 — Client Experience Rebuild

- Outcome-centric dashboard: score delta, debt removed, mortgage readiness, next milestone, before/after.
- Unified `/client` shell — remove duplicate client dashboards.
- Real-time progress timeline driven by `client_activity_timeline` + `pipeline_stages`.

## Phase 4 — Admin Experience Rebuild

- Single `/admin` command center replacing fragmented admin pages.
- Time-to-task optimized flows for the 7 critical jobs identified in `07-admin-experience.md`.
- War Board, Review Queue, and Client Editor unified with the bulk-action confirmation modal already shipped.

## Phase 5 — Report Intelligence Engine

- Automated tradeline matching (frontend ↔ edge function logic unified).
- Auto-classification of uploaded reports → dispute-ready packets.
- Score prediction surfaced in client + admin views.

## Phase 6 — Visual Rip-and-Replace (Luxury / Executive)

- New design system: ivory / champagne / navy / platinum tokens in `index.css` + `tailwind.config.ts`.
- Replace every shadcn variant with executive-tier styling.
- Typography: editorial serif headings + premium sans body (final pair chosen via design directions before build).
- Motion language: subtle, deliberate, Apple/Stripe register.
- Migrate every screen in one sweep — no dual-system period.

## Phase 7 — Scalability & API Surface

- Public API layer for franchise/partner future.
- Rate limiting, audit-log expansion, multi-tenant readiness scaffolding.
- Performance pass: route-level code splitting, image optimization, query batching.

## Execution Posture

- Phases 0 → 7 run sequentially. Each phase opens with a checklist and closes with verification (security scan, lint, build, targeted smoke tests).
- Approval gates only at: dropping tables, deleting buckets, removing routes, and **before Phase 6 visual rip-and-replace** (design directions presented first).
- Every change preserves existing data, RLS, auth context, and route guards per project rules.
- No new Supabase clients, no new routers, no new auth systems.

## Confirm to proceed

Reply **"go"** to start Phase 0 immediately. If you want to alter the approval gates (e.g. pause after each phase, or remove the Phase 6 design-direction gate), say so before I begin.
