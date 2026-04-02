

# Express Credit Command Center — Full System Upgrade

## What this builds

A production-ready admin "War Board" with real client data, workflow pipeline, action trackers, score management, and an unlinked accounts tool — all layered on top of the existing CRM without breaking current functionality.

## 1. Database Migration

### Alter `clients` table — add operational columns
```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS workflow_status text DEFAULT 'monitor';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS round_number integer DEFAULT 1;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS priority_level text DEFAULT 'normal';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_action text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes_summary text;
```

### New table: `client_action_tracker`
Tracks per-client operational checklist (identity docs, freezes, 605B, FTC, etc.).
- `id`, `client_id` (FK to clients, unique), boolean columns for each step, `updated_at`

### New table: `client_notes`
- `id`, `client_id`, `note_body`, `note_type`, `created_by`, `created_at`

### New table: `client_timeline`
- `id`, `client_id`, `event_type`, `event_label`, `event_meta` (jsonb), `created_at`

### Seed master client list
Upsert all 35 clients from the master list with correct `workflow_status` values:
- completed, ready_to_push, ready_for_605b, needs_credit_report, round_2, cfpb_escalation, monitor
- Set `membership_plan = 'active'` for all
- Wire confirmed email mappings to `email` column
- For clients with confirmed auth account matches, set `user_id` by looking up profiles by email
- Handle name aliases (James Ivy = James O'Neal Ivy, Charles Goosby = Charles Timothy Goosby, Titus Williams Jr = Titus L Williams JR)

RLS: Admin full access on all new tables; clients read own via `client_id` match.

## 2. New Component: `AdminWarBoard.tsx`

The centerpiece admin view. A full-width board with:

**Top stat strip** — 9 large premium cards:
- Total Clients, Active Memberships, Completed, Ready To Push, Ready For 605B, Needs Credit Report, Round 2, CFPB Escalation, Monitor/Check Status
- Each card is clickable to filter the board below
- Counts are live from the `clients` table grouped by `workflow_status`

**Pipeline columns** (horizontal scrollable):
- COMPLETED | READY TO PUSH | READY FOR 605B | NEEDS CREDIT REPORT | ROUND 2 | CFPB ESCALATION | MONITOR
- Each column shows client cards with: name, membership badge (ACTIVE green), workflow badge, last updated, next action, score summary if present, quick-open button
- Admin can change a client's status via a dropdown on each card (no drag-and-drop initially — dropdown is more reliable and production-safe; drag-and-drop can be added later)

**Search + Filter bar** — search by name, filter by status/round/priority, sort by name/date/urgency

**Quick Actions bar** — sticky buttons: Add Client, Upload Credit Report, Generate 605B, View Score Tracker, Open War Board

## 3. New Component: `ClientProfileDetail.tsx`

Full client profile page rendered inside the admin dashboard when clicking a client card. Tabs:

1. **Overview** — Name, email, membership badge, credit score cards (Experian/Equifax/TU with delta badges), workflow status, next action
2. **Action Tracker** — Toggle switches for each step (Identity Docs, Credit Report, LexisNexis Frozen, Innovis Frozen, Work Number Frozen, 605B Generated, FTC Completed, Experian Upload Completed). Each toggle change updates `client_action_tracker` and inserts a `client_timeline` entry.
3. **Documents** — Existing `ClientDocumentManager` embedded for this client
4. **Scores** — Score history from `credit_scores` table, score cards with gain/loss badges, manual override inputs
5. **Notes/Timeline** — Notes creation form + timeline feed from `client_timeline`
6. **Admin Controls** — Edit PII, change workflow status, change round, set priority, set next action

## 4. New Component: `UnlinkedAuthAccounts.tsx`

Admin tool showing auth accounts (from `profiles`) that do NOT have a matching `clients` record (where no client row has `user_id` = profile's `user_id` AND no client row has matching `email`).

Displays: email, user_id, created date, suggested client match (fuzzy name match against clients with null user_id — displayed as suggestion only).

"Link" button: admin selects a client from dropdown, confirms, and the system updates `clients.user_id` and `clients.email`.

## 5. Credit Report Upload + Score Extraction

New component: `AdminCreditReportUploader.tsx`

Flow:
1. Admin searches and selects exact client from dropdown
2. Admin uploads PDF file to `credit-reports` bucket under `{client_id}/{timestamp}-report.pdf`
3. DB record created in `credit_report_uploads` linked to `client_id`
4. Calls existing `analyze-credit-report` edge function
5. After analysis, extracts scores from the AI response and upserts into `client_credit_scores`
6. Also inserts into `credit_scores` (score history)
7. Creates `client_timeline` entry
8. Shows success with extracted scores

Manual override: If parsing fails, admin can manually enter scores which also create history records.

## 6. Dashboard Integration (`AdminDashboard.tsx`)

- Add `'war-board'`, `'client-profile'`, `'unlinked-accounts'`, `'credit-upload'` to Section type
- Add nav items: War Board (PRIORITY), Unlinked Accounts (MANAGEMENT), Credit Upload (PRIORITY)
- Add COMMAND_CARD for "War Board Command Center"
- Render new components for their sections
- War Board becomes the default overview when admin opens `'war-board'` section
- Add War Board link to the pinned action bar

## 7. Client Portal Upgrades (`ClientPortal.tsx`)

- Add ACTIVE membership badge (green) prominently in the welcome header
- Add score delta badges (+68 green, -22 red) next to each bureau score
- Add "Next Action" card if `next_action` is set on the client record
- Improve empty states with motivating messages

## 8. Luxury UI Styling

Apply across new components:
- `bg-slate-950` / `bg-navy-950` deep backgrounds
- Gold accent color `#D4AF37` for highlights and badges
- Glassmorphism cards with `backdrop-blur-xl bg-card/40 border-border/30`
- Bold stat numbers with `text-3xl font-bold`
- Smooth `animate-fade-in` transitions
- Premium spacing and typography hierarchy

No new CSS framework needed — use existing Tailwind + glass-card classes + custom gold accent via inline styles or a small CSS addition.

## Files to Create
- `supabase/migrations/[timestamp]_command_center.sql` — schema + seed data
- `src/components/AdminWarBoard.tsx` — war board UI
- `src/components/ClientProfileDetail.tsx` — client detail view
- `src/components/UnlinkedAuthAccounts.tsx` — unlinked accounts tool
- `src/components/AdminCreditReportUploader.tsx` — targeted credit report upload

## Files to Edit
- `src/pages/AdminDashboard.tsx` — add sections, nav items, command cards, render new components
- `src/components/ClientPortal.tsx` — add membership badge, score deltas, next action card
- `src/index.css` — add gold accent CSS variable

## Safety
- All existing manual workflows, autonomous systems, dispute engines, and automation layers remain untouched
- Master client seed uses UPSERT (ON CONFLICT on full_name) to avoid duplicates
- Email linking only for explicitly confirmed mappings
- No Stripe logic added anywhere
- No auth changes
- All new tables have RLS with admin gating via `has_role()`

