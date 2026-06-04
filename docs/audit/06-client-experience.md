# 06 — Client Experience

Every screen reachable by a logged-in client. What data shows, what's missing for an outcome-centric experience.

Source detail in `_stream-d-ux.md` §3 (client journey map).

## Current client surface

| Route | Page | Pulls from | Outcome-centric? |
|-------|------|------------|------------------|
| `/client/dashboard` | `pages/client/Dashboard.tsx` | `useClientPortalData` (clients, score, payment, activity) | Partial |
| `/client/results` | `pages/client/Results.tsx` | clients.accounts_deleted, debt_removed, etc. | Partial |
| `/client/reports` | `pages/client/Reports.tsx` | `credit_report_uploads` | Tool-centric (file list) |
| `/client/disputes` | `pages/client/Disputes.tsx` | `dispute_letters` | Tool-centric |
| `/client/documents` | `pages/client/Documents.tsx` | `SecureVerificationUpload` | Tool-centric (and broken — P0-8) |
| `/client/payments` | `pages/client/Payments.tsx` | `payment_records`, `client_payment_summary` | Outcome-centric ✔ |
| `/client/agreements` | `pages/client/Agreements.tsx` | `client_agreements` | Tool-centric |
| `/client/messages` | `pages/client/Messages.tsx` | `chat_history` | Tool-centric |
| `/client/settings` | `pages/client/Settings.tsx` | `profiles` | Tool-centric (acceptable here) |

## Outcome-centric data — gap analysis

The user directive lists what every client should see immediately. Mapped to what the DB already holds:

| Outcome | DB source | Currently shown? | Gap |
|---------|-----------|------------------|-----|
| Current Score | `clients.current_score_eq/tu/ex` (averaged in `useClientPortalData`) | ✅ on dashboard | — |
| Score Increase (delta) | derived: current − starting (already in hook) | ✅ | — |
| Debt Removed | `clients.debt_removed_total` | ✅ on results page | not surfaced on dashboard |
| Accounts Deleted | `clients.accounts_deleted_count` | ✅ results | not surfaced on dashboard |
| Hard Inquiries Removed | `clients.hard_inquiries_removed` | ✅ results | not on dashboard |
| Personal Info Removed | `clients.personal_info_items_removed` | ✅ results | not on dashboard |
| Current Status | `profiles.payment_status` ("paid" / "inactive"), `clients.status` ("Active") | partial — June 4 patches made status display as "Active" | OK |
| Mortgage Readiness | **No column exists** | ❌ | NEW: `clients.mortgage_readiness_score` (computed from current_score + debt + accounts) |
| Latest Update | `client_activity_timeline` (latest row) | partial | — |
| Next Milestone | **No column exists** | ❌ | NEW: `clients.next_milestone_label` + `next_milestone_target_score` |
| Next Action | `clients.next_step_note` | ✅ | underused — promote to hero card |
| Home Buying Progress | derived from score + debt-to-income (not stored) | ❌ | NEW derived view; DTI requires Plaid data (already integrated) |
| Credit Transformation Timeline | `score_history` | partial — not visualized | NEW: line chart in Progress Center |
| Approval Progress | derived from mortgage readiness band | ❌ | NEW visualization |
| Before vs After | `clients.starting_score_*` vs `current_score_*` | ✅ data exists, not visualized | NEW: hero before/after split card |
| Paid-in-full $600 + date + tx ref | `payment_records` (June 4 patches) | ✅ | shipped |

## What's broken in the current client UX

1. **Documents tab is a black hole** — `SecureVerificationUpload` writes to storage but creates no DB row (P0-8). Clients upload IDs and never know if they were received.
2. **No clear "what's next" CTA** on `/client/dashboard`. The `next_step_note` field exists but is rendered as muted secondary text, not a primary call-to-action.
3. **Score deltas are unstyled** — current code uses small text; no visual reward for +80 points.
4. **Activity feed pulls only one of two tables** (`client_activity_timeline` only; `client_timeline` rows invisible — P1-10).
5. **Messages tab is wired to `chat_history` but the AI assistant** writes via `gpt-assistant` direct insert in some paths, so chronology may be off.
6. **Mortgage readiness** is the explicit user goal of the entire CRM but has zero presence in the client portal.

## Recommended target client portal

Reframe the 9 routes (no new routes, just renamed UX intent — see report 05):

| Route | New name | Hero |
|-------|----------|------|
| `/client/dashboard` | Credit Score Center | Big tri-bureau score gauge + delta vs starting |
| `/client/results` | Progress Center | Before/After + Debt Removed + Accounts Deleted + Inquiries Removed |
| `/client/reports` | My Reports | Latest report card, version comparison toggle |
| `/client/disputes` | Disputes & Letters | Letters sent / pending / outcomes |
| `/client/documents` | Document Vault | Upload status + verification badge |
| `/client/payments` | Payment Center | (already strong) |
| `/client/agreements` | Agreement Center | Signed/Pending |
| `/client/messages` | Credit Coach | AI assistant + human-coach handoff |
| `/client/settings` | Account | Profile, notifications |

Add a **persistent header strip** on every client page showing: current score · delta · mortgage readiness band · next milestone. One glance answers "am I winning?".

## Data we already have (no new tables needed for most)

- Scores: `clients.{starting,current}_score_{eq,tu,ex}` + `score_history`
- Deletions/removals: `clients.accounts_deleted_count`, `debt_removed_total`, `hard_inquiries_removed`, `personal_info_items_removed`, `remaining_negatives`
- Round: `clients.current_dispute_round`
- Next step: `clients.next_step_note`
- Payment: `payment_records` + `client_payment_summary` view + `profiles.payment_status`
- Activity: `client_activity_timeline`

## Minimal NEW data (proposed for Phase 3, not built in audit)

- `clients.mortgage_readiness_band` (enum: `not_ready`, `building`, `near_ready`, `ready`) — derived nightly from score + DTI + remaining_negatives.
- `clients.next_milestone_label` (text) + `next_milestone_target_score` (int).
- View `client_outcome_dashboard` — single-row-per-client materialized snapshot for the header strip (avoids 9-table join on every page load).

These are documented for future phases; not created in this audit.
