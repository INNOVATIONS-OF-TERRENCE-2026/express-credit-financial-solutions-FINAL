# 01 — Platform Inventory

Authoritative count of every artifact in the system. Cite this when reasoning about scope.

Full per-file detail in `_stream-a-frontend.md` (frontend) and `_stream-b-backend.md` (backend).

## Headline numbers

| Surface | Count |
|---------|-------|
| Routes registered in `src/App.tsx` | 64 (8 SBA + 22 admin + 9 client + 25 redirects/legacy) |
| Top-level pages (`src/pages/**`) | 33 |
| Components (`src/components/**`) | 81 (excl. `ui/`) |
| shadcn primitives (`src/components/ui/`) | 49 |
| Custom hooks (`src/hooks/`) | 15 |
| React contexts | 3 (`ClientContext`, `SBAConfig`, `ThemeContext`) |
| Edge functions (`supabase/functions/`) | 25 |
| Storage buckets | 15 |
| Public tables | 72 |
| Public DB functions | 22 |
| DB triggers | (per stream-b §7) all on `public.*`, none on reserved schemas |
| RLS policies | ~210 across 72 tables |

## Routes (App.tsx)

| Group | Count | Notes |
|-------|-------|-------|
| Public landing / auth | 5 | `/`, `/onboarding`, `/membership`, `/admin/login` |
| Admin | 13 | `/admin` + 12 children. All resolved at router layer with **no `<ProtectedRoute>` wrapper** (stream-a §1). |
| Client portal | 9 | `/client/*` flat namespace. |
| SBA module | 8 | `/sba/*`. **`/sba/admin` is unguarded** (P0). |
| Legacy redirects | 16 | `<Navigate replace>` to canonical paths. Working. |
| Catch-all | 1 | `/* → NotFound`. |
| `/client-portals` | 1 | Admin "client portal links" page. |
| `/client-portals-legacy/:clientSlug` | 1 | Old portal; reachable. |

`<ProtectedRoute>` is imported in `App.tsx:11` but **never applied** — every protected route relies on in-page guards via `useAuth`. P1.

## Pages

| Page | Route | Status |
|------|-------|--------|
| `Index.tsx` | `/` | live |
| `ClientOnboarding.tsx` | `/onboarding` | live |
| `MembershipPricing.tsx` | `/membership` | live |
| `AdminLogin.tsx` | `/admin/login` | live |
| `AdminCommandCenter.tsx` | `/admin` | live (canonical admin home) |
| `AdminPaymentsPage.tsx` | `/admin/payments` | live |
| `AdminUploadReports.tsx` | `/admin/upload-reports` | live |
| `AdminReportsList.tsx` | `/admin/reports` | live |
| `AdminDisputesPage.tsx` | `/admin/disputes` | live |
| `AdminDocumentsPage.tsx` | `/admin/documents` | live |
| `AdminAgreementsPage.tsx` | `/admin/agreements` | live |
| `AdminActivityPage.tsx` | `/admin/activity` | live |
| `AdminClients.tsx` | `/admin/clients` | live |
| `AdminClientEdit.tsx` | `/admin/clients/:id` | live |
| `AdminClientPreview.tsx` | `/admin/client-preview/:id` | live |
| `AdminSettings.tsx` | `/admin/settings` | live |
| `AdminTools.tsx` | `/admin/tools` | live |
| `ClientPortalLinks.tsx` | `/client-portals` | live |
| `ClientPortals.tsx` | `/client-portals-legacy/:slug` | **legacy, deprecate** |
| `client/Dashboard.tsx` | `/client/dashboard` | live (canonical client home) |
| `client/Results.tsx` | `/client/results` | live |
| `client/Reports.tsx` | `/client/reports` | live |
| `client/Disputes.tsx` | `/client/disputes` | live |
| `client/Documents.tsx` | `/client/documents` | live |
| `client/Payments.tsx` | `/client/payments` | live |
| `client/Agreements.tsx` | `/client/agreements` | live |
| `client/Messages.tsx` | `/client/messages` | live |
| `client/Settings.tsx` | `/client/settings` | live |
| `ComingSoon.tsx` | — | **DEAD** (no route) |
| `PaymentsPage.tsx` | — | **DEAD** (no route; only consumer of `ApplePayCard`/`CashAppCard`) |
| `NotFound.tsx` | `*` | live |
| `sba/*` (8 files) | `/sba/*` | live (separate SBA loan module) |

## Component inventory (highlights — full list in stream-a §3-4)

| Cluster | Live | Orphaned | Notes |
|---------|------|----------|-------|
| Admin shells | `admin/AdminShell`, `admin/AdminSidebar` | `AdminPanel`, `AdminDashboardComponents` | Two old monolithic dashboards superseded by AdminCommandCenter. |
| Client dashboards | `client/ClientPortalLayout`, `pages/client/Dashboard` | `ClientPortal.tsx`, `ClientDashboard.tsx` | Legacy unified portal. |
| Upload widgets | `SecureVerificationUpload`, `AdminFileUploader`, `AdminDocumentUploader`, `BulkUpload*` (in `AdminUploadReports`) | `CreditReportUpload`, `FileUploader`, `components/sba/Uploader` | Five live, three orphaned. Consolidation in report 03. |
| Payment widgets | `payments/ClientPaymentWidget`, `payments/PaymentHistoryList`, `payments/PaymentStatusBadge`, `payments/ReplaceProofDialog`, `admin/AdminPaymentsTable`, `admin/AdminPaymentReviewModal` | `payments/ApplePayCard`, `payments/CashAppCard` (only used in dead `PaymentsPage`) | Cash App QR is now inline in `ClientPaymentWidget`. |
| Auth/login | `LoginForm`, `RegisterForm`, `AdminLogin` page | `ClientLogin.tsx` | `ClientLogin` orphaned by the unified `/onboarding`. |
| Signatures | `DigitalSignature` | — | **Orphaned** — `ClientAgreementModal` uses a different inline signature. |
| Admin operations | `AdminPanel`, `AdminWarBoard`, `AdminTaskEngine`, `AdminReviewQueue`, `AdminCRMFixedPanel`, `AdminAIControlPanel`, `AdminBacklogTools`, `AdminDailyOps`, `AdminAuditLogPanel`, `AdminNotesPanel` | most are wired into `AdminTools` but several have zero callers | Stream-a §3 confirms 25+ orphan components total. |

## Hooks

| Hook | Live | Notes |
|------|------|-------|
| `useAuth` | ✅ | Canonical auth context |
| `useAdminClientDocuments` | ✅ | |
| `useAdminMetrics` | ✅ | |
| `useAdminPayments` | ✅ | |
| `useAuditLog` | ✅ | |
| `useClientAgreement` | ✅ | |
| `useClientPortalData` | ✅ | Aggregates score, debt, accounts, payment, activity |
| `useFileUploadSecurity` | ✅ | |
| `useMembership` | ✅ | |
| `usePayments` | ✅ | |
| `useRealtimeRefresh` | ✅ | |
| `useRoles` | ✅ | |
| `useDebounce` | ❌ | **Orphan** |
| `useLocalStorage` | ❌ | **Orphan** |
| `use-mobile` / `use-toast` | ✅ | shadcn defaults |

## Edge functions (all 25)

Grouped by purpose. Detail in stream-b §8.

| Cluster | Functions | Canonical |
|---------|-----------|-----------|
| AI credit analysis | `analyze-credit-report`, `analyze-credit-scan`, `analyze-credit-violations` | TBD (report 03) |
| AI letter generation | `generate-dispute-letter` (**unguarded, P0**), `generate-dispute-letter-secure`, `generate-dispute-ai`, `generate-dispute-preview`, `ai-letter-preview` | `generate-dispute-letter-secure` + `ai-letter-preview` |
| AI assistant | `ai-credit-assistant`, `gpt-assistant`, `chat-history-manager` | `gpt-assistant` + `chat-history-manager` |
| Document AI | `analyze-document`, `process-document-autonomous` | `analyze-document` |
| Automation | `orchestrate-ai-workflow`, `process-automation-event` | both, distinct roles |
| Matching | `match-report-to-client` | canonical |
| Plaid | `create-plaid-link-token`, `exchange-plaid-token` | canonical |
| Scoring | `predict-credit-score`, `sync-credit-data` | both |
| Notifications | `new-user-notification`, `send-notification-email` | both |
| Cron / housekeeping | `expire-vip-trials`, `hide-lovable-badge` | both |
| Misc | `submit-au-request` | canonical |

## Storage buckets (15)

| Bucket | Linked tables (rg in src/) | Canonical? |
|--------|----------------------------|------------|
| `client-documents` | `document_archive`, `document_uploads` | ✅ keep |
| `client-agreements` | `client_agreements` | ✅ keep |
| `signatures` | `client_agreements.signature_path` | ✅ keep |
| `cashapp-proofs` | `payment_records.proof_path` | ✅ keep |
| `credit-reports` | `credit_report_uploads`, `credit_reports` | ✅ keep |
| `dispute-uploads` | `dispute_letters` | ✅ keep |
| `dispute-letters` | `dispute_letters` mailing | redundant with `dispute-uploads` |
| `verification-docs` | `client_verification_secure` | ✅ keep |
| `identity-docs` | (referenced in `SecureVerificationUpload`) | overlap with `verification-docs` |
| `ssn-docs` | (referenced in `SecureVerificationUpload`) | overlap with `verification-docs` |
| `utility-bills` | (referenced in `SecureVerificationUpload`) | overlap with `client-documents` |
| `admin-docs` | admin uploads | low usage |
| `documents` | generic | **redundant** |
| `document-archive` | generic | **redundant** |
| `document-uploads` | generic | **redundant** |

5 of 15 buckets overlap. See report 03 cluster D-1.

## Public tables (72) — categorized

| Category | Tables |
|----------|--------|
| Identity | `profiles`, `clients`, `user_roles`, `demo_users`, `client_verification_secure`, `verification_codes` |
| Credit data | `credit_reports`, `credit_report_uploads`, `credit_scores`, `client_credit_scores`, `credit_scan_summaries`, `credit_analysis`, `credit_monitoring`, `credit_alerts`, `credit_api_credentials`, `experian_credentials`, `score_history`, `score_predictions` |
| Disputes | `dispute_letters`, `flagged_disputes`, `violation_flags`, `mailing_bundles` |
| Documents | `documents`, `document_archive`, `document_ai_results`, `document_classification_results`, `document_match_reviews` |
| Payments | `payments`, `payment_records`, `payment_receipts`, `payment_activity_events`, `payment_notifications` |
| Agreements | `agreements`, `client_agreements` |
| Notifications | `client_notifications`, `payment_notifications`, `messaging_log`, `notification_templates` |
| Activity / audit | `audit_logs`, `client_activity_timeline`, `client_timeline`, `case_workflow_log` |
| Admin ops | `admin_notes`, `admin_reminders`, `admin_tasks`, `client_notes`, `execution_queue`, `task_templates` |
| AI | `ai_agent_runs`, `ai_analysis_results`, `ai_letter_previews`, `ai_workflows`, `automation_events`, `autonomous_jobs`, `autonomous_settings`, `chat_history` |
| Membership / billing | `subscriptions`, `purchases`, `products`, `referrals`, `bank_links` |
| Client lifecycle | `client_processing_cycles`, `client_intelligence_packets`, `client_search_filters`, `client_timers`, `pipeline_stages` |
| Uploads (bulk) | `bulk_upload_batches`, `bulk_upload_files` |
| Onboarding | `user_onboarding`, `education_progress` |
| Achievements | `achievements` |
| Misc | `file_upload_config`, `au_requests` |

Consolidation targets in report 03; canonical mapping in report 08.

## DB functions (22 — full bodies in `<db-functions>` context)

| Function | Purpose | Hot? |
|----------|---------|------|
| `has_role(uid, role)` | RBAC check, security definer | ✅ canonical |
| `get_current_user_role()` | Returns highest role | secondary |
| `log_security_event(...)` | Writes to `audit_logs` | hot |
| `handle_new_user()` | Creates `profiles` row on signup | hot |
| `handle_new_user_role()` | Assigns default `user` role + logs | hot |
| `update_updated_at_column()` | Generic updated_at trigger | hot |
| `prevent_user_id_change()` | Now admin-bypass aware (June 4 patch) | hot |
| `create_pipeline_stages()` | Trigger on purchase | per-purchase |
| `create_client_timer()` | Trigger on purchase | per-purchase |
| `create_required_documents()` | Trigger on purchase | per-purchase |
| `expire_vip_trials()` | Cron candidate | scheduled |
| `rls_auto_enable()` | DDL event trigger that auto-enables RLS on new tables | infrastructure |
| `encrypt_plaid_token` / `decrypt_plaid_token` / `decrypt_plaid_token_with_audit` | Plaid token crypto | sensitive |
| `encrypt_ssn_secure` / `decrypt_ssn_secure` | SSN crypto | **uses static key — P0** |
| `log_client_data_access()` | Trigger on clients table | hot |
| `validate_case_transition()` | Workflow state machine | per-case |
| `bump_credit_report_version()` | Trigger on credit_reports | per-upload |
| `tg_document_archive_alias()` | Backfills doc_type↔document_type | per-doc |
| `tg_payment_after_insert()` / `tg_payment_after_update()` | Payment notifications | per-payment |
