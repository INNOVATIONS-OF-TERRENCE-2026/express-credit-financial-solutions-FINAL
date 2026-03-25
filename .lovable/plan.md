

# Full Credit Automation System Upgrade

## Overview
Add autonomous dispute generation, admin client editing with credit score overrides, and live client portal sync — all layered on top of existing systems without breaking anything.

## 1. Database Migration

**New table: `dispute_cases`**
- `id` uuid PK, `client_id` uuid, `user_id` text
- `bureau` text (Experian/Equifax/TransUnion)
- `account_name` text, `account_number_last4` text
- `violation_type` text, `dispute_reason` text
- `status` text default 'pending' (pending/generated/sent/completed)
- `source` text default 'manual' (manual/ai_auto)
- `flagged_dispute_id` uuid nullable (link to existing flagged_disputes)
- `created_at` timestamp
- RLS: admin-only + user can read own (via user_id match)

**New table: `ai_dispute_letters`**
- `id` uuid PK, `client_id` uuid, `user_id` text
- `dispute_case_id` uuid references dispute_cases
- `letter_content` text, `letter_type` text
- `bureau` text, `confidence_score` numeric
- `status` text default 'draft' (draft/approved/sent)
- `generated_at` timestamp default now()
- RLS: admin-only + user can read own

**New table: `client_credit_scores`** (separate from existing `credit_scores` which uses different schema)
- `id` uuid PK, `client_id` uuid references clients
- `user_id` uuid
- `experian_score` integer, `equifax_score` integer, `transunion_score` integer
- `source` text default 'manual' (manual/ai_parsed)
- `updated_at` timestamp, `updated_by` uuid
- RLS: admin full access, user can read own
- Unique constraint on `client_id` (one active row per client)

## 2. Edge Function: `generate-dispute-ai`

Accepts: `{ client_id, flagged_accounts?: array, mode: 'auto' | 'manual' }`

Logic:
1. Auth check (admin or service role)
2. Fetch client data from `clients` table
3. Fetch flagged disputes for client from `flagged_disputes`
4. For each flagged account: call OpenAI to generate a bureau-specific dispute letter (605B/611/623 based on `violation_type`)
5. Insert into `dispute_cases` with status='generated'
6. Insert generated letter into `ai_dispute_letters`
7. If autonomous mode ON and confidence > threshold: auto-approve
8. Otherwise: set to needs_admin_review
9. Return summary of generated cases

Reuses the existing letter generation prompt patterns from `generate-dispute-letter-secure`.

## 3. New Component: `AdminClientEditor.tsx`

Full client profile editor accessible from admin Users section:
- Opens as a dialog/sheet when clicking a client row
- Editable fields: full_name, email, phone, address, dob, ssn_last4, membership_plan
- Credit score section: experian_score, equifax_score, transunion_score (reads/writes `client_credit_scores`)
- Save button updates `clients` table + `client_credit_scores` via upsert
- "Generate Disputes" button triggers `generate-dispute-ai` for this client

## 4. New Component: `DisputeCommandCenter.tsx`

New admin section ('dispute-command') showing:
- **Stats row**: Total cases, Pending, Generated, Sent, Completed
- **Table**: All dispute_cases joined with ai_dispute_letters
  - Columns: Client, Bureau, Account, Violation, Status, Letter Preview, Actions
  - Actions: Approve, Regenerate, Mark Sent, Mark Completed
- **Bulk actions**: "Generate All Pending" button runs AI on all clients with flagged disputes that lack cases
- Filter tabs: All / Pending / Generated / Sent / Completed
- Uses `useRealtimeRefresh` on `dispute_cases` and `ai_dispute_letters`

## 5. Dashboard Integration

In `AdminDashboard.tsx`:
- Add `'dispute-command'` and `'client-editor'` to Section type
- Add nav items for Dispute Command Center (Gavel icon, WORKFLOW group + PRIORITY group)
- Add COMMAND_CARD for "Dispute Command Center"
- Add pinned action bar button: "Generate Disputes"
- Render `<DisputeCommandCenter />` and `<AdminClientEditor />` for their sections
- Update Users section: add Edit button per row that opens `AdminClientEditor` as a dialog

## 6. Client Portal Live Sync

In `ClientPortal.tsx`:
- Add Supabase realtime subscription on `client_credit_scores` filtered by user_id
- Add subscription on `dispute_cases` filtered by user_id
- Fetch and display credit scores from `client_credit_scores`
- Show dispute cases with their status in the Disputes tab
- All data auto-refreshes via realtime — no manual refresh needed

## 7. Auto-Dispute Pipeline Integration

In `AutonomousControlPanel.tsx` and the autonomous edge function flow:
- After credit report analysis completes (existing `analyze-credit-report` function), if autonomous mode is ON, automatically invoke `generate-dispute-ai` for the client
- This chains: Upload → Parse → Flag Accounts → Generate Disputes → Review Queue
- Add a checkbox in autonomous settings: `auto_generate_disputes` boolean (default false)

## 8. Real-time Updates

Add `dispute_cases` and `ai_dispute_letters` to `useRealtimeRefresh.tsx` subscriptions.

## Files to Create
- `supabase/migrations/[timestamp]_dispute_automation.sql` — 3 tables + RLS
- `supabase/functions/generate-dispute-ai/index.ts` — AI dispute engine
- `src/components/AdminClientEditor.tsx` — client edit dialog with score overrides
- `src/components/DisputeCommandCenter.tsx` — dispute management panel

## Files to Edit
- `src/pages/AdminDashboard.tsx` — add sections, nav, command cards, render new components
- `src/components/ClientPortal.tsx` — add credit score display + realtime subscriptions
- `src/hooks/useRealtimeRefresh.tsx` — add new table subscriptions
- `src/components/AutonomousControlPanel.tsx` — add auto_generate_disputes toggle
- `src/integrations/supabase/types.ts` — auto-updates after migration

## Safety
- All existing dispute_letters, flagged_disputes, and manual workflows remain untouched
- New tables are additive — no schema changes to existing tables
- Admin client editing writes to the existing `clients` table (which already has admin RLS)
- Credit scores use a new dedicated table to avoid conflicts with existing `credit_scores`

