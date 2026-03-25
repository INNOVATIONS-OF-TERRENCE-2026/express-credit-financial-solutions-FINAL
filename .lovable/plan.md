

# Autonomous Processing System — Hybrid Mode Addition

## Overview
Add an AI-powered autonomous document processing pipeline that runs alongside the existing manual workflow. New documents trigger background AI classification, client matching, and dispute queue preparation — all controllable via an admin toggle.

## 1. Database Tables (Migration)

**`autonomous_jobs`** — Tracks each background processing job:
- `id` uuid PK, `client_id` uuid nullable, `document_upload_id` uuid nullable
- `status` text (pending/processing/completed/failed), `job_type` text (document_parse/client_match/dispute_prep)
- `confidence_score` numeric, `result_data` jsonb, `error_message` text
- `created_at`, `completed_at` timestamps
- RLS: admin-only via `has_role()`

**`document_ai_results`** — Stores AI extraction output per document:
- `id` uuid PK, `document_id` uuid (references source upload id)
- `extracted_name`, `extracted_address`, `extracted_ssn_last4`, `extracted_dob` text fields
- `detected_doc_type` text, `confidence_score` numeric
- `matched_client_id` uuid nullable, `match_reason` text
- `is_verified` boolean default false, `verified_by` uuid, `verified_at` timestamp
- `created_at` timestamp
- RLS: admin-only

**`autonomous_settings`** — Single-row config table for the toggle:
- `id` uuid PK, `autonomous_enabled` boolean default false
- `auto_attach_threshold` integer default 85, `review_threshold` integer default 60
- `updated_by` uuid, `updated_at` timestamp
- RLS: admin-only
- Seed with one default row

## 2. Edge Function: `process-document-autonomous`

Secure edge function that:
1. Accepts `document_id`, `file_url`, `file_name`, `file_type`
2. Checks `autonomous_settings.autonomous_enabled` — exits if OFF
3. Creates an `autonomous_jobs` row (status: processing)
4. Sends file content to OpenAI (gpt-4o-mini) for classification + extraction (name, address, SSN last4, DOB, doc type)
5. Queries `clients` table for multi-signal matching (reuses fuzzy logic from existing `bulk-document-intelligence-processor`)
6. Inserts into `document_ai_results`
7. Applies threshold logic:
   - Score >= `auto_attach_threshold`: auto-assigns to client, updates `credit_report_uploads` or `identity_docs`, sets job completed
   - Score >= `review_threshold`: creates `document_match_reviews` entry, sets job to "review"
   - Below threshold: sets job to "needs_manual"
8. Updates `autonomous_jobs` with final status
9. Auth: requires admin JWT or service-role key

## 3. Frontend Trigger Integration

In `AdminFileUploader.tsx` and `BulkDocumentIntelligence.tsx`, after successful upload to storage:
- Check if autonomous mode is enabled (query `autonomous_settings`)
- If enabled, invoke `process-document-autonomous` edge function with the uploaded file metadata
- This is additive — existing upload flow remains unchanged

## 4. Admin UI: Autonomous Control Panel Component

New component: `src/components/AutonomousControlPanel.tsx`

**Top section — Control Toggle:**
- Switch component bound to `autonomous_settings.autonomous_enabled`
- Threshold sliders for auto-attach (default 85%) and review (default 60%)
- Save button updates the settings row

**Middle section — Live Stats (4 cards):**
- Documents processed today (count from `autonomous_jobs` where created_at = today)
- Auto-matched clients (completed jobs with confidence >= threshold)
- Pending review items (jobs with status = review)
- Failed jobs (status = failed)
- Uses `useRealtimeRefresh` hook on `autonomous_jobs` table

**Bottom section — Recent AI Decisions Table:**
- Columns: Document, Detected Type, Extracted Name, Matched Client, Confidence, Status, Actions
- Filter tabs: All / Auto-Matched / Needs Review / Failed
- Actions per row: Approve, Reject, Reassign (opens client selector)
- Approve: sets `is_verified = true` in `document_ai_results`, attaches doc to client
- Reject: marks job as rejected, unlinks document
- Reassign: admin picks correct client, updates `matched_client_id`, marks verified

## 5. Dashboard Integration

In `AdminDashboard.tsx`:
- Add `'autonomous'` to the `Section` type
- Add nav item: `{ section: 'autonomous', label: 'Autonomous Mode', icon: Bot, group: 'WORKFLOW' }`
- Add to PRIORITY group in sidebar
- Add COMMAND_CARDS entry with Bot icon and purple accent
- Render `<AutonomousControlPanel />` when `activeSection === 'autonomous'`
- Add "Autonomous Mode" button to the pinned action bar

## 6. Real-time Updates

Add `autonomous_jobs` and `document_ai_results` to the `useRealtimeRefresh` hook subscriptions so the control panel and dashboard counts update live.

## Files to Create
- `supabase/migrations/[timestamp]_autonomous_system.sql` — tables + RLS + seed
- `supabase/functions/process-document-autonomous/index.ts` — AI engine
- `src/components/AutonomousControlPanel.tsx` — admin UI

## Files to Edit
- `src/pages/AdminDashboard.tsx` — add section, nav, command card, render
- `src/hooks/useRealtimeRefresh.tsx` — add new table subscriptions
- `src/components/AdminFileUploader.tsx` — optional AI trigger after upload
- `src/integrations/supabase/types.ts` — will auto-update after migration

## Safety
- Manual workflows untouched — autonomous is purely additive
- Admin toggle controls whether AI runs
- All AI decisions flow through review queue before final attachment (except high-confidence auto-attach, which is configurable)
- Admin always has approve/reject/reassign control

