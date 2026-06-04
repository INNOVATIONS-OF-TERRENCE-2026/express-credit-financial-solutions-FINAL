# 10 — Implementation Roadmap

Phased sequence. **Every phase is gated on explicit user approval.** No phase begins automatically.

Effort bands: **S** ≤2 days, **M** 3–10 days, **L** 2–4 weeks, **XL** >1 month.

## Phase 0 — Emergency security patches (gate: blocks everything else)

| # | Item | Refs | Effort |
|---|------|------|--------|
| 0.1 | Delete `generate-dispute-letter` edge function | P0-1 | S |
| 0.2 | Apply `<ProtectedRoute>` to admin + client + `/sba/admin` routes | P0-4, P0-5 | S |
| 0.3 | Add RLS policies to the 18 silent-denial tables | P0-6 | M |
| 0.4 | Fix `SecureVerificationUpload` to insert into `client_verification_secure` | P0-8 | S |
| 0.5 | Encrypt existing Plaid tokens; switch insert path to `encrypt_plaid_token()` | P0-3 | M |
| 0.6 | Rotate SSN encryption to vault-managed key + re-encrypt all rows | P0-2 | M |
| 0.7 | Stop `AdminClients` bulk action from inserting proof-less `payment_records`; route to a separate `admin_payment_adjustments` table or attach synthetic proof reference | P0-7 | S |

**Exit gate:** zero P0s open. All changes verified in production via audit log spot-checks.

## Phase 1 — Consolidation (depends on Phase 0)

The big cleanup. No new features.

| # | Item | Refs | Effort |
|---|------|------|--------|
| 1.1 | Frontend dead-code purge (orphans, dead pages, dead hooks) | report 03 F-1..F-6, P2-1..P2-3 | S |
| 1.2 | Edge-function consolidation (letter generation, doc AI, automation) | report 03, P1-2, P1-7 | M |
| 1.3 | Align `clientMatchEngine.ts` with `match-report-to-client` weights | P1-1 | S |
| 1.4 | Tables: payments → `payment_records` canonical (view alias for `payments`) | D-1 | M |
| 1.5 | Tables: docs → `document_archive` canonical (views for `documents`, `document_uploads`) | D-2 | M |
| 1.6 | Tables: scores → `score_history` canonical (views for `credit_scores`, `client_credit_scores`) | D-3 | M |
| 1.7 | Tables: notifications → `client_notifications` canonical (view for `payment_notifications`) | D-5 | M |
| 1.8 | Tables: activity → `client_activity_timeline` canonical (view for `client_timeline`) | D-6 | S |
| 1.9 | Storage: 15 buckets → 7 | report 03 storage | M |
| 1.10 | Sweep `is_admin()` → `has_role(uid,'admin')` in all policies | P1-6 | S |
| 1.11 | Add `log_security_event` to WF-2 + WF-3 workflows | P1-5 | S |

**Exit gate:** zero legacy writes for 7 days. Schema diagram updated.

## Phase 2 — Navigation (depends on Phase 1.1)

| # | Item | Refs | Effort |
|---|------|------|--------|
| 2.1 | Reorganize admin sidebar into 10 categories | report 05 | S |
| 2.2 | Reorganize client sidebar with outcome-centric labels | report 05 | S |
| 2.3 | Wire `GlobalSearchCommand` to `AdminShell` (⌘K) | report 07 friction | S |
| 2.4 | Add `/admin/team` (roles management UI) | report 07 friction | M |
| 2.5 | Sub-navs for Reports / Documents / Disputes / Payments / Tools | report 05 | M |
| 2.6 | Redirect map for all moved routes | report 05 | S |

**Exit gate:** every old admin URL still resolves. Click-counts for the 7 critical jobs match report 07 targets.

## Phase 3 — Client experience rebuild (depends on Phase 2)

| # | Item | Refs | Effort |
|---|------|------|--------|
| 3.1 | Add `clients.mortgage_readiness_band` + `next_milestone_label` + `next_milestone_target_score` | report 06 | S |
| 3.2 | Create `client_outcome_dashboard` view (single-row snapshot per client) | report 06 | M |
| 3.3 | Persistent client-header strip (score · delta · readiness · next milestone) | report 06 | M |
| 3.4 | Credit Score Center (new `/client/dashboard`) | report 06 | M |
| 3.5 | Progress Center hero (Before/After + counters + chart) | report 06 | M |
| 3.6 | Document Vault upload-status badges (depends on P0-8 fix) | report 06 | S |
| 3.7 | Credit Coach (rename Messages, polish AI assistant flow) | report 06 | M |

## Phase 4 — Admin experience rebuild (depends on Phase 2)

| # | Item | Refs | Effort |
|---|------|------|--------|
| 4.1 | Unified client profile (tabbed: Overview/Reports/Disputes/Documents/Payments/Activity/Notes) | report 07 | L |
| 4.2 | Admin operational inbox (review queue across payments + docs + disputes + verification) | report 07 | M |
| 4.3 | Saved filters / segments on Clients, Reports, Disputes, Payments | report 07 | M |
| 4.4 | Daily ops view on `/admin` | report 07 | M |
| 4.5 | Reconciliation reports (payments + dispute outcomes) | report 07 | M |
| 4.6 | Extend the bulk-confirmation modal pattern to dispute mailing + document approval | report 07 | S |

## Phase 5 — Report intelligence engine (depends on Phase 1 + Phase 4.1)

| # | Item | Refs | Effort |
|---|------|------|--------|
| 5.1 | Single canonical match pipeline (shared weights file consumed by both edge fn and frontend preview) | P1-1 | M |
| 5.2 | Auto-extract: name, address, bureau, scores, accounts, balances, collections, charge-offs, inquiries, personal info, payment histories | directive Phase 7 | L |
| 5.3 | Auto-version + auto-compare across uploads | directive Phase 7 | M |
| 5.4 | Auto-detect score change, debt removed, accounts deleted, inquiries removed | directive Phase 7 | M |
| 5.5 | Auto-update client portal counters + timeline + Progress Center | directive Phase 7 | M |
| 5.6 | Auto-generate progress summary (AI letter, client-facing) | directive Phase 7 | M |

## Phase 6 — Premium visual rip-and-replace (depends on Phases 2, 3, 4)

Approved direction (user): **full rip-and-replace**. See `_stream-d-ux.md` §8 for the readiness brief and the design-tokens to introduce.

| # | Item | Refs | Effort |
|---|------|------|--------|
| 6.1 | New design tokens (ivory, white, champagne, platinum, navy, charcoal, gold) in `index.css` + `tailwind.config.ts` | stream-d §8 | M |
| 6.2 | Typography: pair selection + load | TBD via design-direction skill | S |
| 6.3 | Component variant pass (cards, buttons, badges, tables, modals) toward private-banking register | stream-d §8 | L |
| 6.4 | Per-page redesign — Admin pages | stream-d §8 | L |
| 6.5 | Per-page redesign — Client pages (private-client portal feel) | stream-d §8 | L |
| 6.6 | Motion register (champagne-tier easings, restrained micro-interactions) | stream-d §8 | M |
| 6.7 | Accessibility audit pass post-redesign | stream-d §9 | S |

## Phase 7 — Scale (depends on Phase 5)

| # | Item | Effort |
|---|------|--------|
| 7.1 | Materialized views for KPIs (replace 5-table joins on `/admin` mount) | M |
| 7.2 | Caching layer for `useAdminMetrics`, `useClientPortalData` | M |
| 7.3 | Index review on hot tables (`payment_records`, `credit_report_uploads`, `client_activity_timeline`, `audit_logs`) | S |
| 7.4 | Mobile app foundations (RN scaffold reusing existing Supabase client + auth) | XL |
| 7.5 | Partner / Realtor / Loan officer portals (white-label theme variants) | XL |
| 7.6 | API layer (REST/GraphQL exposure for franchise expansion) | XL |

## Dependency graph

```text
Phase 0 ──┬──> Phase 1 ──┬──> Phase 2 ──┬──> Phase 3
          │              │              ├──> Phase 4 ──> Phase 5
          │              │              │
          │              │              └──> Phase 6 (waits on 3 + 4)
          │              │
          │              └──> (consolidations enable everything)
          │
          └─> (security gate; nothing ships until clear)

Phase 7 ── waits on Phase 5
```

## Approval gates

You approve each phase explicitly before it begins. Within a phase, you approve each migration via the standard Supabase migration-tool review flow.

Suggested cadence: 1 phase per 2-week sprint, with Phase 0 frontloaded as an emergency hot-patch sprint.
