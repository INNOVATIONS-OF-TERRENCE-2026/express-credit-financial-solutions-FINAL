# Express Credit CRM — Supabase Backend Audit
**Date:** 2025-06  **Source:** 90 migrations, 25 edge functions, static analysis (no live DB connection available at audit time)

---

## 1. TABLE INVENTORY

72 public tables identified from migrations. RLS status derived from `ALTER TABLE … ENABLE ROW LEVEL SECURITY` statements.  
Legend: `uid` = has user_id col, `cid` = has client_id col, `RLS` = enabled, `P#` = estimated distinct policy count.

| Table | uid | cid | RLS | P# | GRANT Notes |
|---|---|---|---|---|---|
| achievements | ✓ | – | ✓ | 0 | No policies found — RLS blocks all |
| admin_notes | ✓ | ✓ | ✓ | 1 | authenticated SELECT/INSERT/UPDATE |
| admin_notifications | – | – | ✓ | 1 | service_role only |
| admin_reminders | ✓ | – | ✓ | 1 | authenticated |
| admin_tasks | – | ✓ | ✓ | 0 | ⚠️ RLS on, 0 policies — table inaccessible |
| agreements | ✓ | – | ✓ | 3 | clients + admins |
| ai_agent_runs | ✓ | – | ✓ | 2 | authenticated + service_role |
| ai_analysis_results | – | ✓ | ✓ | 2 | client-scoped + service_role |
| ai_dispute_letters | ✓ | ✓ | ✓ | 3 | user + admin + service_role |
| ai_letter_previews | ✓ | – | ✓ | 2 | user-scoped |
| ai_workflows | ✓ | – | ✓ | 2 | user + admin |
| au_requests | ✓ | – | ✓ | 2 | user SELECT/INSERT |
| audit_logs | – | – | ✓ | 3 | admin + service_role only |
| automation_events | – | ✓ | ✓ | 2 | admin + service_role |
| autonomous_jobs | – | – | ✓ | 2 | admin + service_role |
| autonomous_settings | ✓ | – | ✓ | 2 | user + admin |
| bank_links | ✓ | – | ✓ | 4 | REVOKED from users; safe view grants SELECT to authenticated |
| bulk_upload_batches | – | – | ✓ | 0 | ⚠️ RLS on, 0 policies |
| bulk_upload_files | – | – | ✓ | 0 | ⚠️ RLS on, 0 policies |
| case_workflow_log | – | ✓ | ✓ | 2 | service_role + admin |
| cashapp_orders | ✓ | – | ✓ | 2 | user-scoped |
| chat_history | ✓ | – | ✓ | 3 | user + service_role |
| client_action_tracker | – | ✓ | ✓ | 0 | ⚠️ RLS on, 0 policies |
| client_activity_timeline | ✓ | ✓ | ✓ | 2 | user + service_role |
| client_agreements | ✓ | – | ✓ | 5 | user SELECT/INSERT + admin |
| client_credit_scores | ✓ | – | ✓ | 4 | user read + admin + service_role |
| client_documents | ✓ | – | ✓ | 3 | user CRUD |
| client_intelligence_packets | – | ✓ | ✓ | 0 | ⚠️ RLS on, 0 policies |
| client_notes | – | ✓ | ✓ | 0 | ⚠️ RLS on, 0 policies |
| client_notifications | ✓ | – | ✓ | 4 | user in_app only + admin + service_role |
| client_payment_summary | – | ✓ | ✓ | 1 | authenticated SELECT (view) |
| client_processing_cycles | – | ✓ | ✓ | 0 | ⚠️ RLS on, 0 policies |
| client_search_filters | ✓ | – | ✓ | 1 | admin only |
| client_timeline | – | ✓ | ✓ | 4 | user + service_role |
| client_timers | – | ✓ | ✓ | 0 | ⚠️ RLS on, 0 policies |
| client_verification_secure | ✓ | – | ✓ | 2 | user-scoped |
| clients | ✓ | – | ✓ | 5 | user + admin CRUD |
| credit_alerts | ✓ | – | ✓ | 3 | user + system INSERT |
| credit_analysis | – | ✓ | ✓ | 0 | ⚠️ RLS on, 0 policies |
| credit_api_credentials | ✓ | – | ✓ | 2 | user + admin |
| credit_monitoring | ✓ | – | ✓ | 3 | user CRUD |
| credit_report_uploads | ✓ | ✓ | ✓ | 4 | user CRUD |
| credit_reports | ✓ | ✓ | ✓ | 4 | user CRUD (legacy table; see §6) |
| credit_scan_summaries | ✓ | – | ✓ | 3 | user + service_role |
| credit_scores | ✓ | – | ✓ | 2 | user + admin |
| demo_users | – | – | ✓ | 1 | admin only |
| dispute_cases | ✓ | ✓ | ✓ | 3 | user + admin + service_role |
| dispute_docs | ✓ | – | ✓ | 5 | user CRUD |
| dispute_timeline | – | ✓ | ✓ | 4 | user + service_role |
| document_ai_results | – | ✓ | ✓ | 2 | user + service_role |
| document_archive | ✓ | ✓ | ✓ | 3 | user + service_role |
| document_classification_results | – | – | ✓ | 2 | admin + service_role |
| document_match_reviews | – | – | ✓ | 2 | admin + service_role |
| document_uploads | ✓ | ✓ | ✓ | 6 | user + admin + service_role |
| education_progress | ✓ | – | ✓ | 3 | user CRUD |
| execution_queue | – | – | ✓ | 0 | ⚠️ RLS on, 0 policies |
| experian_credentials | ✓ | – | ✓ | 0 | ⚠️ RLS on, 0 policies — CRITICAL: no access at all |
| file_upload_config | – | – | ✓ | 1 | authenticated SELECT only |
| flagged_disputes | ✓ | – | ✓ | 4 | user + admin + system |
| identity_docs | ✓ | – | ✓ | 3 | user + admin |
| mailing_bundles | ✓ | ✓ | ✓ | 2 | user + admin |
| marketing_cta_events | – | – | ✓ | 1 | anon INSERT + authenticated SELECT/INSERT |
| messaging_log | – | ✓ | ✓ | 0 | ⚠️ RLS on, 0 policies |
| notification_logs | – | – | ✓ | 2 | admin + system INSERT |
| notification_preferences | ✓ | – | ✓ | 3 | user CRUD |
| notification_templates | – | – | ✓ | 2 | admin + service_role |
| payment_activity_events | – | ✓ | ✓ | 1 | GRANT SELECT to authenticated (no RLS policy — ⚠️ all rows visible) |
| payment_notifications | ✓ | – | ✓ | 1 | GRANT SELECT/UPDATE to authenticated (no user-scoped policy — ⚠️) |
| payment_receipts | ✓ | – | ✓ | 2 | user SELECT + service_role |
| payment_records | ✓ | ✓ | ✓ | 2 | authenticated SELECT/INSERT/UPDATE + service_role ALL |
| payments | ✓ | – | ✓ | 1 | admin only |
| pipeline_stages | – | ✓ | ✓ | 0 | ⚠️ RLS on, 0 policies |
| products | – | – | ✓ | 0 | ⚠️ RLS on, 0 policies |
| profiles | ✓ | – | ✓ | 6 | user + admin + service_role |
| purchases | ✓ | – | ✓ | 0 | ⚠️ RLS on, 0 policies — triggers depend on this table |
| referrals | ✓ | – | ✓ | 2 | user-scoped |
| score_history | ✓ | – | ✓ | 3 | user read + admin + service_role |
| score_predictions | ✓ | – | ✓ | 3 | user read + admin + service_role |
| security_rate_limits | ✓ | – | ✓ | 2 | user + system |
| subscriptions | ✓ | – | ✓ | 4 | user + service_role |
| task_templates | – | – | ✓ | 0 | ⚠️ RLS on, 0 policies |
| user_onboarding | ✓ | – | ✓ | 3 | user CRUD |
| user_roles | ✓ | – | ✓ | 5 | user + admin with super-admin guard |
| verification_codes | ✓ | – | ✓ | 0 | ⚠️ RLS on, 0 policies |
| violation_flags | – | ✓ | ✓ | 1 | admin only |
| wrappers_fdw_stats | – | – | ✓ | 2 | admin only |

**Zero-row tables (expected/new):** demo_users, bulk_upload_batches, bulk_upload_files, client_search_filters, client_intelligence_packets, violation_flags, experian_credentials, wrappers_fdw_stats, task_templates, verification_codes.

---

## 2. RLS COVERAGE MATRIX

### 🔴 Tables with RLS ENABLED but ZERO policies (data inaccessible to all roles):
| Table | Risk |
|---|---|
| admin_tasks | App reads/writes it (AdminTaskEngine.tsx) — broken |
| achievements | Referenced in UI — broken |
| bulk_upload_batches | Batch import broken |
| bulk_upload_files | Batch import broken |
| client_action_tracker | edge fn `analyze-credit-report` writes it — broken |
| client_intelligence_packets | Referenced by `generate-dispute-ai` — broken |
| client_notes | UI writes client notes — broken |
| client_processing_cycles | FK target for dispute_cases — broken |
| client_timers | UI reads — broken |
| credit_analysis | Referenced in policies elsewhere — broken |
| execution_queue | Automation relies on it — broken |
| experian_credentials | ⚠️ CRITICAL: SSN/credential store with 0 policies |
| messaging_log | Notification audit trail — silent drop |
| pipeline_stages | Created by trigger on purchase — broken |
| products | Checkout flow reads — broken |
| purchases | Triggers fire on INSERT — but users can't INSERT |
| task_templates | Admin UI reads — broken |
| verification_codes | OTP flow broken |

### Policy inconsistencies:

| Issue | Count | Detail |
|---|---|---|
| `has_role(uid, 'admin'::app_role)` | 29 | Correct cast form |
| `public.has_role(uid, 'admin')` | 22 | Missing cast — relies on implicit coercion; works but inconsistent |
| `(auth.jwt() ->> 'role') = 'service_role'` | 6 | ⚠️ Antipattern: JWT `role` claim is not the service_role indicator; should use `auth.role() = 'service_role'` or check via SECURITY DEFINER |
| `auth.uid()::text = user_id` | 4 | Mixing uuid and text — works if column is text but fragile |

### Policies with no role guard (any authenticated user matches):
- `payment_activity_events` — GRANT only, no RLS policy → full table visible to all authenticated users
- `payment_notifications` — GRANT SELECT/UPDATE, no row-scoping policy
- `payment_records` — GRANT SELECT/INSERT/UPDATE to authenticated with no `user_id` check in the GRANT; relies on triggers only

---

## 3. GRANT AUDIT

GRANTs found in migrations (explicit):

| Table | anon | authenticated | service_role |
|---|---|---|---|
| marketing_cta_events | INSERT | SELECT, INSERT | ALL |
| payment_records | – | SELECT, INSERT, UPDATE | ALL |
| payment_notifications | – | SELECT, UPDATE | ALL |
| payment_activity_events | – | SELECT | ALL |
| client_payment_summary | – | SELECT | ALL |
| bank_links_safe (view) | – | SELECT | ALL |
| credit_api_credentials_safe | – | SELECT | ALL |

### 🔴 Missing GRANTs (tables app code reads/writes, no explicit GRANT found):

| Table | App references | Missing |
|---|---|---|
| admin_tasks | AdminTaskEngine.tsx | authenticated |
| autonomous_jobs | AutonomousControlPanel.tsx | authenticated |
| autonomous_settings | AutonomousControlPanel.tsx | authenticated |
| document_ai_results | AutonomousControlPanel.tsx | authenticated |
| document_archive | AdminDocumentUploader.tsx, AdminClients.tsx | authenticated |
| credit_report_uploads | ClientPortal.tsx, AdminBacklogTools.tsx | authenticated |
| dispute_letters | disputeWorkflow.ts, ClientPortal.tsx | authenticated |
| flagged_disputes | disputeWorkflow.ts | authenticated |
| case_workflow_log | disputeWorkflow.ts | authenticated |
| client_notifications | ClientNotificationsPanel.tsx | authenticated |
| notification_templates | AutomationControlCenter.tsx | authenticated |

> **Note:** Supabase defaults grant SELECT/INSERT/UPDATE/DELETE to `authenticated` when RLS is the guard. Absence of explicit GRANTs may rely on this default but is not hardened. For tables containing sensitive data (experian_credentials, client_verification_secure, credit_api_credentials) explicit REVOKE + re-grant is required.

---

## 4. FK GRAPH

### Declared Foreign Keys (unique relationships):

| From Table | Column | → Target | ON DELETE |
|---|---|---|---|
| profiles | user_id | auth.users(id) | CASCADE |
| clients | user_id | auth.users(id) | (none) |
| bank_links | user_id | auth.users(id) | CASCADE |
| credit_report_uploads | user_id | auth.users(id) | CASCADE |
| dispute_cases | client_id | clients(id) | CASCADE |
| dispute_cases | cycle_id | client_processing_cycles(id) | SET NULL |
| dispute_docs | client_id | clients(id) | CASCADE |
| ai_dispute_letters | client_id | clients(id) | CASCADE |
| ai_dispute_letters | generated_from_cip_id | client_intelligence_packets(id) | SET NULL |
| document_uploads | client_id | clients(id) | CASCADE |
| document_archive | client_id | clients(id) | CASCADE |
| document_match_reviews | credit_report_id | credit_report_uploads(id) | CASCADE |
| document_match_reviews | matched_client_id | clients(id) | SET NULL |
| mailing_bundles | client_id | clients(id) | CASCADE |
| ai_agent_runs | workflow_id | ai_workflows(id) | CASCADE |
| payment_receipts | payment_record_id | payment_records(id) | CASCADE |
| payment_activity_events | payment_record_id | payment_records(id) | CASCADE |
| dispute_docs | dispute_letter_id | dispute_letters(id) | CASCADE |
| flagged_disputes | (none declared — user_id only) | – | – |
| purchases | product_id | products(id) | (none) |
| subscriptions | purchase_id | purchases(id) | UNIQUE |
| bulk_upload_files | batch_id | bulk_upload_batches(id) | CASCADE |
| bulk_upload_batches | file_id | bulk_upload_files(id) | CASCADE |

### ⚠️ Orphan-prone / Missing FKs (naming convention violations):

| Table | Column | Should reference | Risk |
|---|---|---|---|
| flagged_disputes | user_id | auth.users(id) | orphan rows if user deleted |
| credit_scan_summaries | user_id | auth.users(id) | no FK declared |
| credit_alerts | user_id | auth.users(id) | no FK declared |
| credit_monitoring | user_id | auth.users(id) | no FK declared |
| payment_records | client_id | clients(id) | optional FK, may NULL |
| messaging_log | client_id | clients(id) | no FK declared |
| case_workflow_log | client_id | clients(id) | no FK declared |
| admin_tasks | client_id | clients(id) | no FK declared |
| pipeline_stages | client_id | clients(id) | no FK declared |
| score_history | user_id | auth.users(id) | no FK declared |
| audit_logs | (no FK cols) | – | orphan-safe but unlinked |
| bulk_upload_batches | file_id FK | bulk_upload_files | ⚠️ circular: files→batch AND batch→file |

---

## 5. ORPHAN DATA SAMPLING

*Live DB not reachable; risk assessment based on schema + FK analysis.*

| Table | Orphan Vector | Risk Level | Notes |
|---|---|---|---|
| clients | user_id → auth.users | 🟡 MEDIUM | FK is nullable (`ADD COLUMN … REFERENCES` without NOT NULL) |
| profiles | user_id → auth.users | 🟢 LOW | ON DELETE CASCADE declared |
| payment_records | user_id → auth.users | 🟡 MEDIUM | No CASCADE; admin-created records may have no auth user |
| credit_report_uploads | user_id → auth.users | 🟢 LOW | CASCADE declared |
| credit_reports | client_id → clients | 🔴 HIGH | FK added via ALTER with no CASCADE; legacy table |
| dispute_letters | client_id → clients | 🟡 MEDIUM | FK declared but SET NULL allows dangling |
| client_agreements | user_id → auth.users | 🟡 MEDIUM | No FK to auth.users declared |
| document_archive | client_id → clients | 🟢 LOW | CASCADE declared |

**Recommended orphan queries to run:**
```sql
-- Clients without auth users
SELECT count(*) FROM public.clients WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM auth.users);

-- credit_reports without valid client
SELECT count(*) FROM public.credit_reports WHERE client_id IS NOT NULL
  AND client_id NOT IN (SELECT id FROM public.clients);

-- payment_records without valid user
SELECT count(*) FROM public.payment_records WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM auth.users);
```

---

## 6. DUPLICATE / OVERLAPPING TABLES

### 6a. Payments cluster
| Table | Purpose | Canonical? |
|---|---|---|
| `payments` | Admin-managed payment records (older schema) | ❌ Legacy |
| `payment_records` | Primary payment tracking, FK to clients/users | ✅ **Canonical** |
| `payment_receipts` | FK → payment_records; receipt artifacts | ✅ Keep (child of payment_records) |
| `payment_activity_events` | Audit timeline per payment_record | ✅ Keep (event log) |
| `payment_notifications` | Notification state per payment | 🟡 Could merge into client_notifications |

**Action:** Migrate `payments` → `payment_records`; deprecate `payments`.

### 6b. Documents cluster
| Table | Purpose | Canonical? |
|---|---|---|
| `document_uploads` | General uploads with client/user scope | ✅ **Canonical upload store** |
| `document_archive` | Admin-archived docs; FK to clients | 🟡 Redundant with document_uploads |
| `document_ai_results` | AI analysis output per document | ✅ Keep (child table) |
| `document_classification_results` | ML classification results | 🟡 Could merge into document_ai_results |
| `document_match_reviews` | Manual review linking docs→clients | ✅ Keep (workflow table) |
| `client_documents` | Older per-client doc store | ❌ Legacy; overlaps document_uploads |

**Action:** Migrate `client_documents` and `document_archive` rows into `document_uploads`; add `archived BOOL` column.

### 6c. Credit reports cluster
| Table | Purpose | Canonical? |
|---|---|---|
| `credit_reports` | Legacy table (old schema, no upload tracking) | ❌ Legacy |
| `credit_report_uploads` | Current upload store with analysis tracking | ✅ **Canonical** |
| `credit_scan_summaries` | AI scan output summaries | ✅ Keep (child of credit_report_uploads) |
| `credit_analysis` | AI analysis text per report | 🟡 Overlaps ai_analysis_results |
| `credit_scores` | Bureau score history | 🟡 Overlaps client_credit_scores |
| `client_credit_scores` | Per-client, per-bureau score tracking | ✅ **Canonical** |
| `score_history` | Score delta history | ✅ Keep (child of client_credit_scores) |
| `score_predictions` | ML predictions | ✅ Keep |

**Action:** Migrate `credit_reports` → `credit_report_uploads`; merge `credit_scores` into `client_credit_scores`; merge `credit_analysis` into `ai_analysis_results`.

### 6d. Users/Clients cluster
| Table | Purpose | Canonical? |
|---|---|---|
| `profiles` | Auth-linked user profile (membership, tier) | ✅ **Canonical user record** |
| `clients` | CRM client entity (name, SSN, credit data) | ✅ **Canonical client record** |
| `demo_users` | Demo/test users only | 🟡 Could be a flag on profiles |

**Action:** `demo_users` → add `is_demo BOOL` to `profiles`.

### 6e. Notifications cluster
| Table | Purpose | Canonical? |
|---|---|---|
| `client_notifications` | In-app + push notifications to clients | ✅ **Canonical** |
| `payment_notifications` | Payment-specific notification state | 🟡 Merge into client_notifications |
| `messaging_log` | SMS/email delivery log | ✅ Keep (audit trail) |
| `notification_templates` | Reusable message templates | ✅ Keep |
| `notification_logs` | Delivery receipts | 🟡 Overlaps messaging_log |

**Action:** Merge `payment_notifications` into `client_notifications` (add `payment_record_id` FK). Merge `notification_logs` into `messaging_log`.

### 6f. Activity / Audit cluster
| Table | Purpose | Canonical? |
|---|---|---|
| `client_activity_timeline` | User-visible activity feed | ✅ **Canonical** |
| `client_timeline` | Older timeline (written by analyze-credit-report) | ❌ Duplicate of above |
| `case_workflow_log` | Dispute case step log | ✅ Keep (dispute-specific) |
| `audit_logs` | System-wide audit (admin + service_role only) | ✅ Keep |

**Action:** Migrate `client_timeline` → `client_activity_timeline`; deprecate `client_timeline`.

### 6g. AI / Automation / Admin tasks cluster
| Table | Purpose | Canonical? |
|---|---|---|
| `admin_tasks` | Admin to-do items | ✅ Keep |
| `admin_reminders` | Scheduled reminders | 🟡 Merge into admin_tasks (add `remind_at`) |
| `admin_notes` | Per-client notes by admins | ✅ Keep |
| `client_notes` | Client-visible notes | 🟡 Could merge into admin_notes w/ visibility flag |
| `execution_queue` | Async job queue | 🟡 Overlaps autonomous_jobs |
| `autonomous_jobs` | AI autonomous task tracking | ✅ **Canonical AI job store** |
| `ai_agent_runs` | Per-run AI agent log | ✅ Keep (child of ai_workflows) |
| `ai_workflows` | Workflow definitions | ✅ Keep |
| `automation_events` | Event-driven trigger log | 🟡 Overlaps client_activity_timeline |

**Action:** Merge `execution_queue` into `autonomous_jobs` (add `queue_priority`). Merge `admin_reminders` into `admin_tasks`. Consolidate `client_notes` + `admin_notes` with `is_internal BOOL`.

---

## 7. TRIGGER & FUNCTION MAP

| Trigger | Table | Event | Function |
|---|---|---|---|
| on_auth_user_created | auth.users | AFTER INSERT | handle_new_user() / handle_new_user_role() |
| on_auth_user_created_role | auth.users | AFTER INSERT | handle_new_user_role() |
| audit_profiles_trigger | profiles | AFTER I/U/D | audit_trigger() |
| audit_subscriptions_trigger | subscriptions | AFTER I/U/D | audit_trigger() |
| audit_user_roles_changes | user_roles | AFTER I/U/D | audit_role_changes() |
| enforce_user_id_security | clients | BEFORE UPDATE | prevent_user_id_change() |
| credit_reports_versioning | credit_reports | BEFORE INSERT | (versioning fn) |
| tg_document_archive_alias_ins | document_archive | BEFORE INSERT | (alias copy fn) |
| trg_payment_after_insert | payment_records | AFTER INSERT | (summary sync) |
| trg_payment_after_update | payment_records | AFTER UPDATE | (summary sync) |
| trg_payment_records_updated_at | payment_records | BEFORE UPDATE | update_updated_at_column() |
| trg_payment_summary_sync_ins | payment_records | AFTER INSERT | (client_payment_summary upsert) |
| trg_payment_summary_sync_upd | payment_records | AFTER UPDATE | (client_payment_summary upsert) |
| create_documents_on_purchase | purchases | AFTER INSERT | create_pipeline_stages() |
| create_pipeline_on_purchase | purchases | AFTER INSERT | create_pipeline_stages() |
| create_timer_on_purchase | purchases | AFTER INSERT | create_client_timer() |
| update_*_updated_at | ~18 tables | BEFORE UPDATE | update_updated_at_column() |

**⚠️ Hot table risks:**
- `payment_records` has **5 triggers** (updated_at + 2×after insert + 2×after update) — high write amplification
- `purchases` fires 3 triggers on INSERT — any failed purchase leaves orphaned pipeline/timer rows if trigger fails mid-sequence
- `auth.users` INSERT fires `on_auth_user_created` AND `on_auth_user_created_role` (duplicate trigger redefined multiple times across migrations — check for double-execution)

---

## 8. EDGE FUNCTIONS

| Function | verify_jwt | Secrets | Tables touched | Purpose |
|---|---|---|---|---|
| ai-credit-assistant | ❌ not in config | OPENAI_API_KEY | none | Stateless GPT chat; no DB writes |
| ai-letter-preview | ❌ not in config | OPENAI, SUPABASE_SERVICE_ROLE | ai_letter_previews, dispute_letters, clients | Preview AI letter draft |
| analyze-credit-report | ❌ not in config | OPENAI, SERVICE_ROLE | credit_report_uploads, credit_scores, client_credit_scores, ai_analysis_results, client_timeline, flagged_disputes, admin_notifications, client_action_tracker | Full report analysis |
| analyze-credit-scan | ✓ | OPENAI, SERVICE_ROLE | credit_scan_summaries | Scan summary generation |
| analyze-credit-violations | ❌ not in config | OPENAI, ANON_KEY | none (text only) | Stateless violation analysis |
| analyze-document | ✓ | OPENAI, SERVICE_ROLE | document_uploads | Document OCR/classify |
| chat-history-manager | ✓ | ANON_KEY | chat_history | Save/load chat sessions |
| create-plaid-link-token | ✓ | PLAID_*, ANON_KEY | none | Plaid Link token generation |
| exchange-plaid-token | ✓ | PLAID_*, SERVICE_ROLE | bank_links | Plaid token exchange + store |
| expire-vip-trials | ❌ not in config | SERVICE_ROLE | profiles | Cron: expire VIP memberships |
| generate-dispute-ai | ❌ not in config | OPENAI, SERVICE_ROLE | ai_dispute_letters, flagged_disputes, dispute_cases, clients, autonomous_settings | AI dispute letter generation |
| generate-dispute-letter | ❌ not in config | OPENAI, SERVICE_ROLE | dispute_letters, clients | Basic dispute letter (unguarded) |
| generate-dispute-letter-secure | ✓ | OPENAI, SERVICE_ROLE | dispute_letters, clients | Secured version of above |
| generate-dispute-preview | ❌ not in config | OPENAI, ANON_KEY | none | Stateless preview |
| gpt-assistant | ✓ | OPENAI, ANON_KEY | none | Generic GPT passthrough |
| hide-lovable-badge | ❌ not in config | none | none | DOM injection — remove before prod |
| match-report-to-client | ❌ not in config | SERVICE_ROLE | (not detected — inspect) | Report→client matching |
| new-user-notification | ❌ not in config | SERVICE_ROLE | (not detected) | Welcome notification |
| orchestrate-ai-workflow | ❌ not in config | OPENAI, ANON+SERVICE | (not detected) | Workflow orchestration |
| predict-credit-score | ❌ not in config | OPENAI, SERVICE_ROLE | client_credit_scores, flagged_disputes, dispute_cases, score_predictions | Score ML prediction |
| process-automation-event | ❌ not in config | SERVICE_ROLE, TWILIO_* | automation_events, client_notifications, notification_templates, notification_preferences, client_activity_timeline | Event → SMS/notify |
| process-document-autonomous | ❌ not in config | OPENAI, ANON+SERVICE | (autonomous processing) | Autonomous doc pipeline |
| send-notification-email | ❌ not in config | SERVICE_ROLE | (not detected) | Email dispatch |
| submit-au-request | ❌ not in config | ANON_KEY | (au_requests likely) | AU tradeline request |
| sync-credit-data | ❌ not in config | SERVICE_ROLE | credit_monitoring, credit_alerts, credit_api_credentials | Credit data sync cron |

### 🔴 Duplicate function groups:

**Credit analysis (3 functions):**
- `analyze-credit-violations` — stateless, text-in/text-out, uses ANON_KEY (no DB writes)
- `analyze-credit-scan` — writes to `credit_scan_summaries`, uses SERVICE_ROLE
- `analyze-credit-report` — writes to 8 tables, uses SERVICE_ROLE, most comprehensive
- **Recommendation:** `analyze-credit-violations` is stateless and should be merged as a utility call within `analyze-credit-report`. Keep `analyze-credit-scan` for lightweight scan path.

**Dispute letter (5 functions):**
- `generate-dispute-letter` — ❌ no verify_jwt in config; uses SERVICE_ROLE; accessible without auth
- `generate-dispute-letter-secure` — ✓ verify_jwt; same tables; **this is the only safe version**
- `generate-dispute-ai` — AI-powered, writes `ai_dispute_letters`; separate output table
- `generate-dispute-preview` — stateless preview, no DB writes
- `ai-letter-preview` — writes `ai_letter_previews`, slightly different scope
- **Recommendation:** Remove `generate-dispute-letter` entirely (unguarded, duplicate of secure). Consolidate `ai-letter-preview` + `generate-dispute-preview` into one preview function.

**Security risk:** 14 of 25 functions have **no verify_jwt entry** in config.toml — they default to Supabase's platform default (verify_jwt=true), but this is fragile. Explicitly set `verify_jwt = true` for all functions that touch sensitive tables.

---

## 9. STORAGE BUCKETS

15 buckets from migrations + source analysis:

| Bucket | public | Policies | App references | Recommendation |
|---|---|---|---|---|
| `credit-reports` | false | User-scoped by folder (uid/) + admin | Reports.tsx, AdminUploadReports, AdminReportsList, CreditReportVersionHistory | ✅ Keep — canonical credit report store |
| `client-documents` | false | User-scoped by folder + admin | smoke.e2e.test.ts | ✅ Keep |
| `client-agreements` | false | User-scoped by folder | AdminClientEditor.tsx | ✅ Keep |
| `document-uploads` | false | User + admin policies | document_uploads table | 🟡 Overlaps with client-documents; consolidate |
| `document-archive` | false | User + service_role | AdminDocumentUploader.tsx | 🟡 Redundant with document-uploads |
| `dispute-uploads` | false | User-scoped by folder | disputeWorkflow.ts (inferred) | ✅ Keep |
| `signatures` | false | User-scoped by folder | (inferred from policies) | ✅ Keep |
| `verification-docs` | false | User + admin | SecureVerificationUpload.tsx | ✅ Keep |
| `documents` | false | (inferred) | CreditReportUpload.tsx | ⚠️ Generic name — likely legacy; map to specific bucket |
| `client-verification-secure`* | false | (from client_verification_secure table) | SecureVerificationUpload.tsx | ✅ Keep — sensitive docs |

*5 additional buckets not confirmed in migration SQL (may exist via Supabase dashboard only).

**Consolidation recommendation:**
- **Merge** `document-archive` + `document-uploads` + `documents` → single `document-uploads` bucket with folder structure: `{uid}/{type}/{filename}`
- **Keep separate** `credit-reports`, `client-agreements`, `dispute-uploads`, `signatures`, `verification-docs` — distinct security domains
- **Total target:** 7 buckets (down from 15)

---

## 10. ENCRYPTION SURFACE

### SSN Encryption

| Version | Function | Algorithm | Key | Risk |
|---|---|---|---|---|
| v1 (legacy) | `encrypt_ssn()` / `decrypt_ssn()` | AES via pgcrypto | Hardcoded string `'ssn_encryption_key_2024'` | 🔴 **CRITICAL: static key in migration SQL** |
| v2 (current) | `encrypt_ssn_secure()` / `decrypt_ssn_secure()` | pgcrypto + SHA-256 salt | Vault-intended, salt via gen_random_uuid() | 🟡 Better but decrypt_ssn_secure() returns masked display only (`***-**-XXXX`) — not true decryption |

**decrypt_ssn_secure() does not actually decrypt** — it returns a masked string. This means SSNs stored via `encrypt_ssn_secure()` are **one-way hashed with a random salt**, making them permanently irrecoverable. This may be intentional for display security but breaks any use case requiring full SSN retrieval.

**Access control:**
```sql
REVOKE ALL ON FUNCTION public.encrypt_ssn_secure(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.encrypt_ssn_secure(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_ssn_secure(text) TO authenticated;
```
⚠️ Any authenticated user can call both functions. No admin-only guard. The masked decrypt being callable by clients is acceptable; if a real decrypt function exists it must be `service_role` only.

**Clients table SSN column:** `ssn_encrypted TEXT` — written via `encrypt_ssn_secure()`. The v1 `encrypt_ssn()` (static key) may have written earlier rows — legacy rows are vulnerable.

### Plaid Token Encryption

| Function | Secrets | Storage | Risk |
|---|---|---|---|
| `exchange-plaid-token` | PLAID_CLIENT_ID, PLAID_SECRET | `bank_links.access_token` (plain text) | 🔴 Plaid access_token stored unencrypted in DB |
| `create-plaid-link-token` | PLAID_CLIENT_ID, PLAID_SECRET | Not stored | ✅ OK |

**`bank_links.access_token` is stored as plain text.** This is a critical finding — Plaid access tokens grant full read access to linked bank accounts. These must be encrypted at rest (Supabase Vault or pgcrypto with a secret stored in Vault, not a hardcoded key).

The migration creates a `bank_links_safe` view that excludes `access_token`, and user-facing SELECT is redirected to this view — good. But the underlying `bank_links` table with the raw token is accessible via SERVICE_ROLE from any edge function without additional decryption overhead.

### Recommendations
1. **Immediate:** Rotate the static AES key `'ssn_encryption_key_2024'` — it is committed to migration history.
2. **Immediate:** Encrypt `bank_links.access_token` using Supabase Vault (`vault.create_secret()`).
3. **Short-term:** Implement true reversible SSN encryption via Vault for cases where full SSN is needed (e.g., bureau submission).
4. **Short-term:** Restrict `decrypt_ssn_secure` to `service_role` only; create a separate `get_ssn_display(uuid)` SECURITY DEFINER function for client-facing masked display.
5. **Lock down:** `experian_credentials` table has 0 RLS policies — any service_role code can read Experian passwords. Add explicit admin-only policy immediately.

---

## Summary: Top 10 Critical Findings

| # | Severity | Finding |
|---|---|---|
| 1 | 🔴 CRITICAL | Static AES key `'ssn_encryption_key_2024'` hardcoded in migration SQL — rotate immediately |
| 2 | 🔴 CRITICAL | `experian_credentials` — RLS enabled with 0 policies; credentials table completely blocked but visible to service_role without audit |
| 3 | 🔴 CRITICAL | `bank_links.access_token` stored as plain text; Plaid tokens grant bank read access |
| 4 | 🔴 HIGH | `generate-dispute-letter` has no verify_jwt and uses SERVICE_ROLE key — unauthenticated callers can generate letters |
| 5 | 🔴 HIGH | 18 tables have RLS enabled with 0 policies — app features silently broken (admin_tasks, purchases, pipeline_stages, etc.) |
| 6 | 🟠 HIGH | `payment_activity_events` and `payment_notifications` have GRANTs but no row-scoping RLS policies — all rows visible to all authenticated users |
| 7 | 🟠 HIGH | `purchases` table (0 policies) has 3 INSERT triggers — purchase flow trigger-fires but users cannot INSERT |
| 8 | 🟠 MEDIUM | `(auth.jwt() ->> 'role') = 'service_role'` antipattern in 6 policies — should use `auth.role()` |
| 9 | 🟠 MEDIUM | `payment_records` has 5 triggers — write amplification risk on high-volume table |
| 10 | 🟡 MEDIUM | 22 overlapping tables across 7 functional clusters — recommend consolidation to reduce schema sprawl |
