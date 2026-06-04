# MASTER ADMIN + CLIENT PORTAL REBUILD PROMPT

## Original [ExpressCreditFinancials.org](http://ExpressCreditFinancials.org) Supabase Master Build

YOU ARE [LOVABLE.DEV](http://LOVABLE.DEV)’S CURRENT MOST ADVANCED AI MODEL OPERATING AS A SENIOR PRINCIPAL SOFTWARE ENGINEER, SUPABASE ARCHITECT, ENTERPRISE CRM ENGINEER, CREDIT REPAIR PLATFORM ARCHITECT, PRODUCT DESIGNER, DATABASE CLEANUP SPECIALIST, AND PRODUCTION-GRADE SAAS REFACTORING EXPERT.

PROJECT:

Express Credit & Financial Solutions original master build

DOMAIN:

[https://expresscreditfinancials.org](https://expresscreditfinancials.org)

BACKEND:

Supabase

IMPORTANT:

This is the original production build.

Do NOT use Lovable Cloud for this task.

Do NOT create a new app.

Do NOT rebuild from scratch.

Do NOT disconnect Supabase.

Do NOT destroy existing data.

Do NOT create duplicate auth.

Do NOT create duplicate Supabase clients.

Do NOT add more clutter.

Do NOT create fake/demo dashboard data.

Do NOT implement AI first.

MISSION:

Fully audit, clean, simplify, redesign, and repair the entire admin dashboard and client portal system so Express Credit & Financial Solutions operates like a premium white-label credit repair CRM.

The current system has too many disconnected modules, incorrect dashboard metrics, broken client workflows, weak portal UI, duplicate routes, confusing navigation, and inconsistent client/user/profile mapping.

Your job is to turn the original master build into a clean, premium, working operating system.

==================================================

PHASE 0 — DATABASE TRUTH AUDIT FIRST

====================================

Before changing any code, perform a full Supabase database truth audit.

Audit every Supabase table.

Identify:

* duplicate client tables

* duplicate profile tables

* orphaned auth users

* orphaned client records

* orphaned profile records

* broken foreign key relationships

* tables with no active code references

* tables used by old/deprecated modules

* dead tables

* active tables

* legacy tables

* tables feeding real dashboards

* tables not feeding anything

* tables containing client portal data

* tables containing uploaded documents

* tables containing credit reports

* tables containing dispute data

* tables containing payment data

* tables containing agreement/signature data

* tables containing audit/activity logs

Generate a DATABASE TRUTH REPORT with:

1. Table name

2. Purpose

3. Record count

4. Primary key

5. Relationship to clients/profiles/auth users

6. Files using this table

7. Routes using this table

8. Status:

   * Active

   * Legacy

   * Duplicate

   * Dead

   * Needs repair

9. Recommended action:

   * Keep

   * Merge

   * Hide

   * Refactor

   * Leave untouched

Do NOT delete tables.

Do NOT drop columns.

Do NOT weaken RLS.

This phase is audit-only unless a safe additive migration is explicitly required later.

==================================================

PHASE 1 — FULL CODEBASE AUDIT

=============================

Audit the entire existing build before implementation.

Inspect:

1. All admin dashboard routes

2. All client portal routes

3. All sidebar navigation items

4. All dashboard components

5. All client management components

6. All portal management components

7. All upload/report components

8. All document components

9. All dispute components

10. All payment components

11. All agreement/signature components

12. All activity timeline components

13. All auth/session logic

14. All Supabase client logic

15. All Supabase queries

16. All role logic

17. All client/user/profile mapping

18. All route guards

19. All hardcoded/demo/static data

20. All dead buttons

21. All duplicate dashboards

22. All duplicate portals

23. All duplicate admin surfaces

Current known issues to verify:

* AdminDashboard.tsx is too large and overloaded

* Admin nav has too many disconnected modules

* `/admin`, `/admin-dashboard`, `/admin/clients`, and inline admin sections compete with each other

* liveCounts incorrectly derives totals from profiles instead of clients

* onboarding counts are not accurate

* client identity mapping drifts between auth.uid(), profiles.user_id, [clients.id](http://clients.id), and route params

* resolveClient exists but is not used consistently

* client portal uses hardcoded recent activity and static progress

* ClientDashboard and ClientPortal duplicate logic

* some modules render empty because queries do not match schema

* admin has to click too deeply to manage clients

* edit/view/upload workflows are not cleanly connected

* client portal does not feel premium or data-driven

==================================================

PHASE 2 — ROOT ARCHITECTURE DECISION

====================================

Preserve:

* Supabase Auth

* existing AuthProvider

* existing RolesProvider

* existing user_roles table

* existing has_role() function

* existing Supabase client

* existing payments system if working

* existing agreements/signatures if working

* existing document uploads if working

* existing client data

* existing credit report uploads

Do NOT create replacement auth.

Do NOT introduce a new backend.

Do NOT destroy existing business logic.

Consolidate the app into two clean experiences:

1. ADMIN COMMAND CENTER

2. PREMIUM CLIENT PORTAL

Everything else must be merged, hidden, or moved to Advanced Tools.

==================================================

PHASE 3 — ADMIN COMMAND CENTER REBUILD

======================================

Replace the overloaded admin experience with one clean Admin Command Center.

Route:

/admin

The Admin Command Center must show real Supabase data only.

No fake numbers.

No static dashboard metrics.

No demo arrays.

Top KPI cards:

* Total Clients

* Active Clients

* New Onboarding Clients

* Clients Needing Review

* Reports Uploaded

* Disputes In Progress

* Documents Pending Review

* Payments Pending

* Agreements Pending

* Total Debt Removed

* Total Deleted Accounts

* Mortgage Ready Clients

* Clients Ready for FTC / 605B Review

Owner business intelligence cards:

* Monthly Revenue

* Lifetime Revenue

* Pending Payments

* Approved Payments This Month

* Average Score Increase

* Total Accounts Deleted

* Total Negative Debt Removed

* Clients Needing Action Today

Primary admin navigation must be simplified to:

1. Command Center

2. Clients

3. Upload Reports

4. Reports & Results

5. Disputes

6. Documents

7. Payments

8. Agreements

9. Activity / Audit Logs

10. Settings

11. Advanced Tools

Remove from primary navigation:

* War Board

* Processing Grid

* Pipeline

* Review Queue

* Autonomous Mode

* AI Execution

* Client Portal Management

* Full Admin Dashboard

* Admin Client Manager

* CIP Execution

* Backlog Tools

* Automation Center

If these components contain useful logic, merge them into the simplified sections.

If broken/static/duplicate, hide under `/admin/tools`.

==================================================

PHASE 4 — ADMIN CLIENT MANAGEMENT REBUILD

=========================================

Create one direct client management route:

/admin/clients

The admin must not have to dig through multiple dashboards to reach clients.

Client table must show:

* client full name

* email

* phone

* portal status

* onboarding status

* payment/membership status

* last report upload

* last activity

* current score if available

* documents pending

* disputes in progress

* next action

* action buttons

Action buttons:

* View Portal

* Edit Client

* Upload Report

* Documents

* Disputes

* Payments

* Notes

All buttons must work.

Rules:

* Edit Client routes to `/admin/clients/:clientId`

* View Portal routes to `/admin/client-preview/:clientId`

* Upload Report routes to `/admin/upload-reports?clientId=<clientId>`

* Documents routes to `/admin/documents?clientId=<clientId>`

* Disputes routes to `/admin/disputes?clientId=<clientId>`

* Payments routes to `/admin/payments?clientId=<clientId>`

All row actions must pass `clients.id`.

Never use admin auth.uid() as the selected client.

==================================================

PHASE 5 — CLIENT IDENTITY NORMALIZATION

=======================================

Normalize all identity mapping.

The system must clearly distinguish:

* [auth.users.id](http://auth.users.id)

* profiles.user_id

* [clients.id](http://clients.id)

* clients.user_id

* route clientId

* portal clientSlug

* report client_id

* document client_id

* payment client_id

* agreement client_id

* dispute client_id

Rules:

Admin-side:

* Always use explicit `clientId`

* `clientId` means `clients.id`

* Admin preview uses `/admin/client-preview/:clientId`

* Admin mutation components accept `clientId` as a required prop

Client-side:

* Client portal resolves current client once using authenticated user id

* Use `resolveClient(user.id)`

* Store resolved client in `ClientContext`

* Pass `client.id` and `client.user_id` through the client portal

Uploaders:

* Always insert both `client_id` and `user_id` when available

* No implicit auth.uid() fallback in admin upload tools

Required utility:

Create or harden:

`src/contexts/ClientContext.tsx`

`src/lib/resolveClient.ts`

Use them consistently.

==================================================

PHASE 6 — PREMIUM CLIENT PORTAL REBUILD

=======================================

Create a premium client portal layout.

Canonical route:

/client/dashboard

Client routes:

/client/dashboard

/client/results

/client/reports

/client/disputes

/client/documents

/client/payments

/client/agreements

/client/messages

/client/settings

Legacy route:

/client/:clientSlug

Keep for backwards compatibility, but redirect correctly:

* client owner → `/client/dashboard`

* admin → `/admin/client-preview/:clientId`

Client portal must look like a premium white-label fintech dashboard.

Visual style:

* midnight black/navy background

* gold accents

* electric blue accents

* glass cards

* premium sidebar

* clean top nav

* notification bell

* mobile responsive

* no clutter

* no admin tools visible to clients

Client dashboard must show:

Hero:

“Welcome back, [Client Name]”

“Your credit progress is being actively managed.”

Cards:

* Starting Score

* Current Score

* Score Change

* Accounts Deleted

* Debt Removed

* Hard Inquiries Removed

* Personal Info Items Removed

* Remaining Negative Accounts

* Current Dispute Round

* Next Step

Sections:

1. Credit Transformation Snapshot

2. Before vs Current Results

3. Deleted Accounts

4. Remaining Negative Accounts

5. Hard Inquiry Updates

6. Personal Information Updates

7. Dispute Progress

8. Documents Needed

9. Signed Agreements

10. Payment Status

11. Activity Timeline

12. Notifications / Updates

IMPORTANT:

NO STATIC CLIENT PORTAL DATA.

Every client portal metric must come from:

* credit reports

* score history

* dispute records

* document records

* payment records

* agreement records

* activity logs

* manual admin override fields

No fake activity arrays.

No demo metrics.

No static dispute progress.

No placeholder results unless clearly shown as empty state.

==================================================

PHASE 7 — REAL DATA METRICS + HOOKS

===================================

Create:

`src/hooks/useAdminMetrics.ts`

`src/hooks/useClientPortalData.ts`

Admin metrics must query real Supabase data:

* Total Clients: clients count

* Active Clients: clients where status = active

* New Onboarding: onboarding_status != complete

* Clients Needing Review: flagged disputes + dispute letters needing review + payment needs_review + documents pending

* Reports Uploaded: credit_report_uploads count

* Disputes In Progress: active dispute_cases

* Documents Pending Review: document_uploads pending

* Payments Pending: payment_records pending

* Agreements Pending: client_agreements unsigned

* Debt Removed: client override fields or resolved dispute result fields

* Accounts Deleted: client override fields or resolved dispute result fields

Client metrics must query real client data:

* Starting score: first score_history or manual override

* Current score: latest score_history or manual override

* Score change: calculated

* Accounts deleted: manual override or result records

* Debt removed: manual override or result records

* Inquiries removed: manual override or result records

* Personal info removed: manual override or result records

* Remaining negatives: manual override or current report/account state

* Current dispute round: latest dispute_case

* Next step: client next_step_note or latest activity/task

==================================================

PHASE 8 — BEFORE / AFTER + MANUAL OVERRIDE SYSTEM

=================================================

Because AI should be last, build manual/admin-controlled results first.

Add safe additive columns to `clients` if missing:

* starting_score_eq

* starting_score_tu

* starting_score_ex

* current_score_eq

* current_score_tu

* current_score_ex

* accounts_deleted_count

* debt_removed_total

* hard_inquiries_removed

* personal_info_items_removed

* remaining_negatives

* current_dispute_round

* next_step_note

* mortgage_readiness_status

* ftc_605b_readiness_status

Do not drop anything.

Admin Client Edit page must include:

“Portal Results Override” section.

Admin can manually update:

* starting scores

* current scores

* accounts deleted

* debt removed

* hard inquiries removed

* personal info removed

* remaining negatives

* dispute round

* next step

* mortgage readiness

* FTC / 605B readiness

Client portal reads these values immediately.

This guarantees the portal can be accurate before AI automation exists.

==================================================

PHASE 9 — UPLOAD REPORT WORKFLOW REPAIR

=======================================

Route:

/admin/upload-reports

Workflow:

1. Admin opens client row

2. Clicks Upload Report

3. Route opens with selected client preloaded

4. Admin chooses:

   * Before Report

   * Updated Report

   * Current Report

   * Final Report

5. Admin chooses bureau:

   * Experian

   * Equifax

   * TransUnion

   * 3-Bureau

6. Upload saves to correct client

7. Upload writes to report table

8. Upload writes to storage

9. Upload inserts activity timeline event

10. Client portal updates reports page

Uploader must accept explicit `clientId`.

No implicit admin user id.

==================================================

PHASE 10 — CLIENT MATCH ENGINE WITHOUT AI FIRST

===============================================

Build deterministic client matching first.

When a report is uploaded:

Match using:

1. selected clientId from admin action

2. email if extracted or entered

3. full name

4. DOB if available

5. SSN last 4 if available

6. address if available

Confidence score:

* 100% = selected clientId direct match

* 95%+ = strong match

* 80–94% = require confirmation

* below 80% = manual selection required

Never silently attach a report to the wrong client.

If confidence is below 95%, show admin confirmation.

AI extraction comes later.

==================================================

PHASE 11 — FILE ORGANIZATION SYSTEM

===================================

Organize uploads automatically.

Logical folder structure per client:

Client Name

├── Before Reports

├── Updated Reports

├── Final Reports

├── Documents

├── FTC

├── 605B

├── Agreements

├── Payments

├── Notes

├── AI Audits

Every upload should be tagged with:

* client_id

* user_id

* file_type

* bureau

* upload_stage

* uploaded_by

* created_at

If actual Supabase Storage folder paths are already established, preserve them and add metadata.

Do not break old file URLs.

==================================================

PHASE 12 — PAYMENTS, AGREEMENTS, DOCUMENTS

==========================================

Preserve working payment system.

Payments:

* client sees own payment history

* admin sees all payments

* pending/approved/rejected statuses work

* dashboard cards use payment_records and client_payment_summary

Agreements:

* client sees signed/pending agreements

* admin sees signed/pending

* status appears on dashboard

Documents:

* client can upload documents

* admin can review documents

* pending documents appear on admin dashboard

* needed documents appear on client dashboard

==================================================

PHASE 13 — ACTIVITY + AUDIT LOGS

================================

Create unified activity pages.

Admin:

/admin/activity

Shows:

* audit_logs

* client_activity_timeline

* payment events

* document events

* report uploads

* agreement events

* dispute updates

Client:

Activity Timeline on dashboard.

Client only sees visible_to_client = true events.

==================================================

PHASE 14 — ADVANCED TOOLS CONSOLIDATION

=======================================

Move old experimental modules to:

/admin/tools

Include:

* War Board

* Processing Grid

* Pipeline

* Review Queue

* Autonomous Mode

* AI Execution

* CIP Execution

* Automation Center

* Backlog Tools

* Bulk Document Intelligence

Only if they still compile.

Otherwise hide from navigation but do not delete files.

Primary admin users should not see clutter.

==================================================

PHASE 15 — AI LAST

==================

AI is LAST in this plan.

Do not build AI automation until:

1. database truth audit is complete

2. admin dashboard is clean

3. client portal is rebuilt

4. client identity mapping is normalized

5. manual before/after override works

6. upload report flow works

7. payments/documents/agreements work

8. activity logs work

9. real data dashboards work

After all above is stable, then plan AI.

Future AI phase only:

* credit report parser

* report extraction

* before/current comparison

* deleted account detection

* inquiry removal detection

* personal info removal detection

* dispute recommendations

* client update summaries

* mortgage readiness summaries

Do NOT implement AI in this build unless specifically approved later.

==================================================

FILES TO MODIFY / ADD

=====================

Modify:

* src/App.tsx

* src/pages/AdminDashboard.tsx

* src/pages/AdminClients.tsx

* src/components/ClientDashboard.tsx

* src/components/ClientPortal.tsx

* src/pages/ClientPortals.tsx

* src/components/AdminCreditReportUploader.tsx

* src/components/SecureVerificationUpload.tsx

Verify unchanged:

* src/integrations/supabase/client.ts

Add:

* src/contexts/ClientContext.tsx

* src/hooks/useAdminMetrics.ts

* src/hooks/useClientPortalData.ts

* src/components/admin/AdminCommandCenter.tsx

* src/components/admin/AdminKpiGrid.tsx

* src/components/admin/AdminClientsTable.tsx

* src/components/admin/AdminSidebar.tsx

* src/pages/AdminUploadReports.tsx

* src/pages/AdminReportsList.tsx

* src/pages/AdminDisputesPage.tsx

* src/pages/AdminDocumentsPage.tsx

* src/pages/AdminAgreementsPage.tsx

* src/pages/AdminActivityPage.tsx

* src/components/client/ClientPortalLayout.tsx

* src/components/client/ClientPortalSidebar.tsx

* src/pages/client/Dashboard.tsx

* src/pages/client/Results.tsx

* src/pages/client/Reports.tsx

* src/pages/client/Disputes.tsx

* src/pages/client/Documents.tsx

* src/pages/client/Payments.tsx

* src/pages/client/Agreements.tsx

* src/pages/client/Messages.tsx

* src/pages/client/Settings.tsx

==================================================

RISK / SAFETY PLAN

==================

* All migrations additive only

* No DROP statements

* No destructive RLS changes

* Keep old components on disk

* Hide deprecated modules from primary nav

* Preserve single AuthProvider

* Preserve single Supabase client

* Preserve existing payment hooks

* Preserve existing agreement system

* Preserve existing upload storage URLs

* Add fallback route `/admin-dashboard?legacy=1` or preserve legacy admin access temporarily

* Use feature-safe route transition

==================================================

IMPLEMENTATION PHASING

======================

Phase 0:

Database Truth Audit

Phase 1:

Full codebase audit and architecture map

Phase 2:

Client identity normalization

Phase 3:

Admin Command Center shell and real KPI hooks

Phase 4:

Admin Clients Table and row actions

Phase 5:

Upload Report workflow repair

Phase 6:

Manual Before/After Results Override

Phase 7:

Premium Client Portal Layout and dashboard

Phase 8:

Client section pages

Phase 9:

Payments/Documents/Agreements integration cleanup

Phase 10:

Activity/Audit Logs

Phase 11:

Move legacy modules into Advanced Tools

Phase 12:

Regression testing

Phase 13:

AI planning only, no AI implementation yet

==================================================

PLAN MODE OUTPUT REQUIRED

=========================

Before building, return:

1. Database Truth Report

2. Root Cause Summary

3. Current Architecture Map

4. Active Tables

5. Legacy/Duplicate/Dead Tables

6. Components to Keep

7. Components to Merge

8. Components to Hide

9. Components to Rebuild

10. Exact Files to Modify

11. Exact Files to Add

12. Exact Additive Migrations Needed

13. Exact Route Changes

14. Supabase Query Repair Plan

15. Client Identity Normalization Plan

16. Admin Dashboard Rebuild Plan

17. Client Portal Rebuild Plan

18. Manual Results Override Plan

19. Report Upload Workflow Plan

20. Payment/Document/Agreement Preservation Plan

21. Risk/Safety Plan

22. Test Plan

DO NOT BUILD UNTIL PLAN IS APPROVED.

==================================================

BUILD MODE OUTPUT REQUIRED

==========================

After implementation, return:

1. Files changed

2. Routes changed

3. Components created

4. Components hidden/consolidated

5. Supabase queries repaired

6. Migrations applied

7. Workflows fixed

8. Admin test checklist

9. Client test checklist

10. Known remaining issues

11. AI phase deferred items

==================================================

TEST PLAN

=========

Admin tests:

1. Login as admin

2. Open `/admin`

3. Verify KPI counts are real

4. Open `/admin/clients`

5. Search client

6. Edit client

7. Update portal results override

8. Upload report for selected client

9. Verify report attaches to correct client

10. View client preview

11. Review payments

12. Review documents

13. Review agreements

14. Check activity logs

Client tests:

1. Login as client

2. Open `/client/dashboard`

3. Verify dashboard loads real client data

4. Verify no fake activity

5. Open results

6. Open reports

7. Open documents

8. Open payments

9. Open agreements

10. Confirm client cannot access another client’s data

Security tests:

1. Non-admin cannot access `/admin`

2. Client cannot access another client portal by URL

3. Admin preview works without becoming the client

4. RLS remains intact

5. Supabase keys are not exposed

Mobile tests:

1. Admin sidebar collapses

2. Client sidebar collapses

3. Tables become mobile cards

4. Uploads are mobile usable

5. Portal remains premium on phone

==================================================

FINAL DIRECTIVE

===============

Operate like the strongest senior software engineer and enterprise SaaS architect available.

This is a production Supabase system with real clients and real data.

Do not patch randomly.

Do not add clutter.

Do not build AI first.

Do not break working systems.

First audit the database truth.

Then audit the full codebase.

Then normalize client identity.

Then rebuild admin dashboard.

Then rebuild client portal.

Then repair workflows.

Then preserve payment/document/agreement systems.

Then test everything.

AI comes last.

The final product must feel like a premium white-label credit repair operating system, not a cluttered beginner dashboard.