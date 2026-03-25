

# Plan: Build Complete Credit CRM Platform — Express Credit Financials

## Summary
The current codebase has basic scaffolding (auth, routes, simple admin dashboard, basic edge functions) but is missing major pieces from the specification: the case workflow system, dispute workflow service, AI analysis components, real-time subscriptions, admin AI control panel, and several admin/client components. This plan covers everything needed, excluding Stripe (per user instruction).

## Phase 1: Database Migrations (4 migrations)

### Migration 1: `fix_critical_rls_policies`
- Tighten RLS on `dispute_letters`: add proper admin SELECT/UPDATE via `has_role('admin')`
- Fix `profiles` and any overly permissive policies
- Ensure `audit_logs` has proper service_role write + admin read

### Migration 2: `add_case_workflow_system`
- Create `case_status` enum: `intake_received`, `documents_missing`, `extracted`, `validation_failed`, `validation_passed`, `draft_generated`, `needs_admin_review`, `approved`, `exported`, `followup_due`
- ALTER `dispute_letters` ADD: `case_status` (default `intake_received`), `status_updated_at`, `assigned_admin` (uuid), `admin_review_notes`, `auto_send` (boolean)
- CREATE TABLE `case_workflow_log`: id, dispute_letter_id, from_status, to_status, changed_by, metadata (jsonb), created_at
- RLS: user sees own via join, admin sees all, service_role manages all
- CREATE FUNCTION `validate_case_transition(from, to)` — whitelist 13 legal transitions
- CREATE TRIGGER `trg_case_status_change` — validates transition + logs

### Migration 3: `add_ai_workflow_columns`
- `flagged_disputes` ADD: `extraction_version` (int default 1), `validated_data` (jsonb), `violation_type`, `recommended_dispute_type`
- `dispute_letters` ADD: `draft_version` (int), `previous_drafts` (jsonb default '[]'), `letter_type`
- Create indexes on `flagged_disputes` for admin review + user status

### Migration 4: `create_ai_analysis_results`
- CREATE TABLE `ai_analysis_results`: id (uuid PK), user_id, credit_report_id, analysis_type, flagged_count, fcra_violation_count, overall_utilization (numeric), summary (jsonb), raw_result (jsonb), model_used, created_at
- RLS: users read own, service_role insert

## Phase 2: Dispute Workflow Service

### New file: `src/services/disputeWorkflow.ts`
- Types: `CaseStatus` (10 values), `DisputeLetterRow`, `WorkflowLogEntry`, `BacklogCounts`, `AutoDisputeResult`
- Constants: `CASE_STATUS_LABELS`, `CASE_STATUS_VARIANTS`
- Functions:
  - `transitionDisputeStatus(id, newStatus, userId, metadata)`
  - `adminApproveDispute(id, adminId, notes)`
  - `adminRejectDispute(id, adminId, notes)`
  - `getAdminReviewQueue()` — fetches `needs_admin_review` disputes
  - `getAllDisputesWithEmails()` — joins with profiles
  - `getWorkflowLog(disputeId)` — fetches log entries
  - `getBacklogCounts()` — counts per status
  - `triggerExtraction(reportId)` — invokes `analyze-credit-report`
  - `triggerLetterGeneration(disputeId, letterType)` — invokes `generate-dispute-letter-secure`
  - `triggerLetterPreview(disputeId)` — invokes `preview-dispute-letter`
  - `autoCreateDisputesFromFlags(userId, reportId)` — creates dispute_letters from flagged items

## Phase 3: New Admin Components

### `src/components/AdminAIControlPanel.tsx`
- Double-gated: `useRoles().isAdmin()` + email check
- 3 tabs: Credit Analysis, Violation Detection, Letter Generation (6 letter types)
- Fetches credit_report_uploads + profiles + dispute_letters
- Invokes `analyze-credit-report`, `analyze-credit-violations`, `generate-dispute-letter-secure`

### `src/components/AdminReviewQueue.tsx`
- Shows `needs_admin_review` disputes using `getAdminReviewQueue()`
- Approve/reject actions with notes textarea

### `src/components/CasePipelineDashboard.tsx`
- Kanban-style view of all 10 case statuses
- Cards showing dispute info, counts per column

### `src/components/BacklogOverview.tsx`
- Summary cards with counts per status, trends
- Uses `getBacklogCounts()`

### `src/components/AIAnalysisViewer.tsx`
- Shows flagged items with FCRA violation badges, confidence scores
- "Create Dispute" button per item with recommended letter type
- Real-time subscription on `flagged_disputes`
- Works in both admin and client contexts

## Phase 4: Update AdminDashboard

### Modify `src/pages/AdminDashboard.tsx`
- Add tabs: "Review Queue", "Pipeline", "AI Analysis", "AI Ops"
- Import and wire new components: `BacklogOverview`, `AdminReviewQueue`, `CasePipelineDashboard`, `AIAnalysisViewer`, `AdminAIControlPanel`
- Add real-time subscriptions on `dispute_letters` + `profiles`

## Phase 5: Update ClientPortal with Real-Time

### Modify `src/components/ClientPortal.tsx`
- Add tabs: Credit Reports, AI Analysis, Dispute Letters
- Wire to `credit_report_uploads`, `dispute_letters`, `flagged_disputes`
- Add real-time subscriptions on these tables filtered by user_id
- Integrate `AIAnalysisViewer` in client mode

## Phase 6: Fix Edge Function Security

### Fix `analyze-credit-violations/index.ts`
- Add JWT authentication
- Add input validation

### Fix `generate-dispute-preview/index.ts`
- Add JWT authentication
- Add Zod-style input validation with length limits
- Sanitize prompt inputs

### Fix `preview-dispute-letter/index.ts`
- Add input validation (length limits on all fields)

### Fix `analyze-credit-report/index.ts`
- Fix the `insertPromises.map()` bug where insert errors aren't caught per-row
- Add file ownership validation (path must start with `userId/`)

## Phase 7: Update Edge Functions

### Update `generate-dispute-letter-secure/index.ts`
- Support 6 letter types: `605B_time_barred`, `611_verification`, `623_furnisher_dispute`, `validation_letter`, `standard_dispute`, `goodwill_letter`
- Each with specific FCRA/FDCPA citation instructions

## Phase 8: Remaining Components & Wiring

### `src/components/BulkDisputeWizard.tsx` — enhance
- Multi-step wizard calling `generate-dispute-letter-secure` and `preview-dispute-letter`

### `src/components/DisputeTimelineTracker.tsx` — wire to `case_workflow_log`
- Show chronological entries from the workflow log table

### Move `FloatingChat` inside `BrowserRouter` in App.tsx

### Add real-time subscriptions pattern throughout:
- AdminDashboard: `dispute_letters` + `profiles`
- ClientPortal: `credit_report_uploads` + `dispute_letters` + `flagged_disputes`
- AIAnalysisViewer: `flagged_disputes`

## Technical Details

- ~15 files created, ~10 files modified
- 4 database migrations
- 4 edge functions patched for security
- 1 new service file (`disputeWorkflow.ts`)
- 5 new components (AdminAIControlPanel, AdminReviewQueue, CasePipelineDashboard, BacklogOverview, AIAnalysisViewer)
- No Stripe changes (per user instruction)
- No new npm dependencies needed
- All components use shadcn/ui
- All real-time subscriptions follow the `supabase.channel().on('postgres_changes').subscribe()` pattern with cleanup

## Implementation Order
1. Migrations (must be first — schema changes)
2. disputeWorkflow service (shared logic)
3. New components (depend on service + schema)
4. AdminDashboard update (imports new components)
5. ClientPortal update (real-time + new tabs)
6. Edge function security fixes
7. App.tsx fix (FloatingChat inside BrowserRouter)

