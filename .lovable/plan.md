

# Full Automation Layer Implementation

## Overview
Add a production-ready automation layer with event queuing, client activity timeline, multi-channel notifications (in-app now, SMS/email ready for future providers), score history tracking, score predictions, and an admin Automation Control Center. All layered on top of existing systems.

## 1. Database Migration (single migration file)

**New tables:**

- **`automation_events`** — Central event queue. Columns: `id`, `client_id` (uuid nullable), `user_id` (uuid nullable), `event_type` (text), `event_source` (text), `payload` (jsonb), `status` (text default 'pending'), `created_at`, `processed_at`, `error_message`. RLS: admin-only + service role.

- **`client_activity_timeline`** — Operational history feed. Columns: `id`, `client_id` (uuid nullable), `user_id` (uuid nullable), `activity_type` (text), `title` (text), `description` (text), `metadata` (jsonb), `visible_to_client` (boolean default true), `visible_to_admin` (boolean default true), `created_at`, `created_by_source` (text default 'system'). RLS: admin full access, users read own (where `visible_to_client = true` and `user_id = auth.uid()`).

- **`client_notifications`** — Multi-channel notification queue. Columns: `id`, `client_id` (uuid nullable), `user_id` (uuid nullable), `channel` (text — 'email'/'sms'/'in_app'), `notification_type` (text), `subject` (text), `message` (text), `payload` (jsonb), `status` (text default 'queued'), `provider` (text default 'internal'), `created_at`, `sent_at`, `error_message`. RLS: admin full access, users read own in_app notifications.

- **`notification_preferences`** — Per-client opt-in/out. Columns: `id`, `client_id` (uuid nullable), `user_id` (uuid nullable), `email_enabled` (boolean default true), `sms_enabled` (boolean default true), `in_app_enabled` (boolean default true), `marketing_enabled` (boolean default false), `transactional_enabled` (boolean default true), `updated_at`. RLS: admin full, users manage own. Unique on `user_id`.

- **`score_history`** — Bureau score over time. Columns: `id`, `client_id` (uuid nullable), `user_id` (uuid nullable), `bureau` (text), `score_value` (integer), `source` (text default 'manual'), `report_id` (uuid nullable), `recorded_at` (timestamp default now()). RLS: admin full, users read own.

- **`score_predictions`** — AI-estimated score ranges. Columns: `id`, `client_id` (uuid nullable), `user_id` (uuid nullable), `current_experian`/`current_equifax`/`current_transunion` (integer nullable), `predicted_experian_min`/`max`, `predicted_equifax_min`/`max`, `predicted_transunion_min`/`max` (integer nullable), `factors` (jsonb), `confidence_level` (numeric), `based_on_report_id` (uuid nullable), `created_at`. RLS: admin full, users read own.

- **`notification_templates`** — Admin-editable message templates. Columns: `id`, `event_type` (text unique), `channel` (text default 'in_app'), `subject_template` (text), `message_template` (text), `is_active` (boolean default true), `updated_at`, `updated_by` (uuid nullable). RLS: admin-only.

Seed `notification_templates` with default rows for each event type (document_uploaded, credit_report_analyzed, dispute_letter_generated, etc.) with sensible default messages.

Seed `notification_preferences` default row creation will happen on-demand via upsert in the edge function.

## 2. Edge Function: `process-automation-event`

Accepts: `{ event_type, client_id?, user_id?, payload?, source? }`

Logic:
1. Insert into `automation_events` (status: processing)
2. Insert into `client_activity_timeline` with appropriate title/description based on event_type mapping
3. Look up `notification_templates` for this event_type
4. If template active, check `notification_preferences` for the user
5. For `in_app` channel: insert into `client_notifications` with status='sent'
6. For `email` channel: attempt to invoke existing `send-notification-email` function; mark sent/failed
7. For `sms` channel: check if `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` secrets exist; if not, insert with status='skipped' and error_message='SMS provider not configured'; if yes, call Twilio API
8. Update `automation_events` to 'processed' or 'failed'
9. Return summary

This is the single dispatch point. All other edge functions and frontend actions call this to trigger automation.

## 3. Edge Function: `predict-credit-score`

Accepts: `{ client_id, user_id?, report_id? }`

Logic:
1. Fetch current scores from `client_credit_scores`
2. Fetch flagged disputes count from `flagged_disputes` for client
3. Fetch dispute cases count and status from `dispute_cases`
4. Use OpenAI (gpt-4o-mini) with a structured prompt to estimate score ranges based on: number of negative accounts, collections, charge-offs, projected removals, utilization
5. Insert into `score_predictions`
6. Trigger automation event `score_predicted`
7. Return prediction data

Include disclaimer text in the response.

## 4. New Component: `AutomationControlCenter.tsx`

Admin section with tabs:

**Overview Tab:**
- 6 stat cards: Notifications Sent Today, Pending Events, Failed Automations, Score Updates Today, Follow-ups Due, Active Automations
- All fetched from the new tables with date filters

**Event Queue Tab:**
- Table of `automation_events` with filters (All/Pending/Processed/Failed)
- "Re-run" button for failed events (re-invokes `process-automation-event`)

**Notifications Tab:**
- Table of `client_notifications` with channel/status filters
- Shows delivery status per channel

**Timeline Tab:**
- Searchable/filterable view of `client_activity_timeline` (admin-only entries included)

**Templates Tab:**
- Editable list of `notification_templates`
- Toggle active/inactive
- Edit subject/message templates inline

**Score Predictions Tab:**
- Table of latest predictions per client
- "Generate Prediction" button per client

**Provider Status:**
- Shows Email: configured/not, SMS/Twilio: configured/not (checks if secrets exist via a simple indicator)

## 5. New Component: `ClientActivityTimeline.tsx`

Reusable component that renders timeline entries for a given `client_id` or `user_id`.
- Vertical timeline with icons per activity_type
- Used in both admin views and client portal
- Accepts `showAdminOnly` prop to filter visibility

## 6. New Component: `ScorePredictionCard.tsx`

Displays score prediction ranges with visual bar indicators.
- Shows current vs predicted for each bureau
- Disclaimer: "AI-assisted estimates, not guaranteed outcomes"
- Used in both admin and client portal

## 7. New Component: `ClientNotificationsPanel.tsx`

Client-facing in-app notification list.
- Fetches from `client_notifications` where channel='in_app' and user_id matches
- Shows unread count badge
- Mark as read functionality (update status)

## 8. Dashboard Integration (`AdminDashboard.tsx`)

- Add `'automation'` to Section type
- Add nav item: `{ section: 'automation', label: 'Automation Center', icon: Zap, group: 'PRIORITY' }` and in WORKFLOW group
- Add COMMAND_CARD with Zap icon and green accent
- Add pinned action bar button: "Automation Center"
- Render `<AutomationControlCenter />` when `activeSection === 'automation'`

## 9. Client Portal Integration (`ClientPortal.tsx`)

- Add new tabs: 'timeline' (Activity Timeline) and 'notifications' (In-App Messages)
- Add `<ScorePredictionCard />` below credit scores on dashboard tab
- Add `<ClientActivityTimeline />` in timeline tab
- Add `<ClientNotificationsPanel />` in notifications tab
- Add realtime subscriptions on `client_activity_timeline`, `client_notifications`, `score_predictions`
- Show notification count badge on the notifications tab

## 10. Real-time Updates (`useRealtimeRefresh.tsx`)

Add subscriptions for: `automation_events`, `client_activity_timeline`, `client_notifications`, `score_predictions`, `score_history`

## 11. Automation Trigger Integration

Add calls to `process-automation-event` in key existing flows (via frontend `supabase.functions.invoke`):
- In `AdminFileUploader.tsx`: after upload success, fire `document_uploaded` event
- In `AutonomousControlPanel.tsx`: after AI match, fire `document_classified`/`document_matched`
- In `DisputeCommandCenter.tsx`: after dispute actions, fire appropriate events
- In `AdminClientEditor.tsx`: after save, fire `client_profile_updated` and `score_updated`

These are lightweight additions — just a `supabase.functions.invoke('process-automation-event', { body: {...} })` call after existing logic.

## Files to Create
- `supabase/migrations/[timestamp]_automation_layer.sql` — 7 tables + RLS + seed templates
- `supabase/functions/process-automation-event/index.ts` — event dispatcher
- `supabase/functions/predict-credit-score/index.ts` — score prediction engine
- `src/components/AutomationControlCenter.tsx` — admin UI
- `src/components/ClientActivityTimeline.tsx` — timeline component
- `src/components/ScorePredictionCard.tsx` — prediction display
- `src/components/ClientNotificationsPanel.tsx` — client notification inbox

## Files to Edit
- `src/pages/AdminDashboard.tsx` — add section, nav, command card, render
- `src/components/ClientPortal.tsx` — add tabs, components, realtime subscriptions
- `src/hooks/useRealtimeRefresh.tsx` — add new table subscriptions
- `src/components/DisputeCommandCenter.tsx` — add automation event triggers
- `src/components/AdminClientEditor.tsx` — add automation event triggers
- `src/components/AdminFileUploader.tsx` — add automation event trigger

## Safety
- All existing workflows untouched — automation is purely additive
- SMS gracefully skips if Twilio not configured (no errors, just logged as 'skipped')
- Admin-only access enforced via `has_role()` RLS
- Client portal only sees their own data with `visible_to_client = true` filter
- No secrets exposed in frontend

