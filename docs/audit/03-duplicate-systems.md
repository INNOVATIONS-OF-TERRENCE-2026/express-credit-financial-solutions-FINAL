# 03 — Duplicate Systems

Every cluster lists the files/tables involved, what each does, and the **canonical** recommended to survive consolidation. No deletions are proposed without a replacement path (see report 08 for the preservation contract).

## Frontend clusters

### F-1 Admin shells / dashboards

| File | Role | Status |
|------|------|--------|
| `src/pages/AdminCommandCenter.tsx` | Current `/admin` home | **CANONICAL** |
| `src/components/admin/AdminShell.tsx` | Layout wrapper around CommandCenter | **CANONICAL** |
| `src/components/admin/AdminSidebar.tsx` | Nav (11 items) | **CANONICAL** |
| `src/components/AdminPanel.tsx` | Old monolithic dashboard | DEPRECATE |
| `src/components/AdminDashboardComponents.tsx` | Older still | DEPRECATE |
| `src/components/AdminWarBoard.tsx` | Wired into AdminTools | KEEP (move under Tools) |
| `src/components/AdminMobileNav.tsx` | Mobile nav, separate from AdminSidebar | MERGE into AdminSidebar |

### F-2 Client portal / dashboard

| File | Role | Status |
|------|------|--------|
| `src/pages/client/Dashboard.tsx` | `/client/dashboard` | **CANONICAL** |
| `src/components/client/ClientPortalLayout.tsx` | Layout for all `/client/*` pages | **CANONICAL** |
| `src/components/client/ClientPortalSidebar.tsx` | Client nav | **CANONICAL** |
| `src/components/ClientPortal.tsx` | Legacy unified portal | DEPRECATE |
| `src/components/ClientDashboard.tsx` | Older dashboard | DEPRECATE |
| `src/pages/ClientPortals.tsx` | `/client-portals-legacy/:slug` | REMOVE route + page |
| `src/pages/ClientPortalLinks.tsx` | Admin overview of client portals | KEEP (admin-only tool) |

### F-3 Upload widgets

| File | Role | Status |
|------|------|--------|
| `src/pages/AdminUploadReports.tsx` (with `bulk_upload_*` flow) | Admin bulk credit-report ingest | **CANONICAL admin** |
| `src/components/admin/AdminFileUploader.tsx` | Generic admin upload | KEEP |
| `src/components/admin/AdminDocumentUploader.tsx` | Admin doc upload | KEEP |
| `src/components/SecureVerificationUpload.tsx` | Client identity upload | **CANONICAL client** (fix P0-8 first) |
| `src/components/CreditReportUpload.tsx` | Old client-side report upload | DEPRECATE |
| `src/components/FileUploader.tsx` | Generic | DEPRECATE |
| `src/components/sba/Uploader.tsx` | SBA-specific | KEEP (SBA scope) |

### F-4 Auth surfaces

| File | Role | Status |
|------|------|--------|
| `src/components/LoginForm.tsx` + `RegisterForm.tsx` | Used by `Index` / `ClientOnboarding` | **CANONICAL** |
| `src/pages/AdminLogin.tsx` | `/admin/login` | **CANONICAL admin** |
| `src/components/ClientLogin.tsx` | Old standalone client login | DEPRECATE |

### F-5 Payment widgets

| File | Role | Status |
|------|------|--------|
| `src/components/payments/ClientPaymentWidget.tsx` | Inline Cash App QR + proof upload | **CANONICAL** |
| `src/components/payments/PaymentHistoryList.tsx` | History | **CANONICAL** |
| `src/components/payments/PaymentStatusBadge.tsx` | Badge | **CANONICAL** |
| `src/components/payments/ReplaceProofDialog.tsx` | Replace flow | **CANONICAL** |
| `src/components/payments/ApplePayCard.tsx` | Apple Pay tile (dead page) | DEPRECATE |
| `src/components/payments/CashAppCard.tsx` | Cash App tile (dead page) | DEPRECATE |
| `src/components/admin/AdminPaymentsTable.tsx` + `AdminPaymentReviewModal.tsx` | Admin side | **CANONICAL** |
| `src/components/payments/ReceiptGenerator.tsx` | Receipt rendering | KEEP |

### F-6 Signatures

| File | Role | Status |
|------|------|--------|
| Inline signature in `ClientAgreementModal.tsx` | What ships today | **CANONICAL** |
| `src/components/DigitalSignature.tsx` | Orphan | DEPRECATE |

## Backend / database clusters

### D-1 Payments

| Table | Purpose | Status |
|-------|---------|--------|
| `payment_records` | Client-submitted proof, admin review, status flow | **CANONICAL** |
| `payment_activity_events` | Event stream per payment | KEEP (sidecar to canonical) |
| `payment_notifications` | Per-user notifications | KEEP (sidecar) |
| `payment_receipts` | Generated receipts | KEEP (sidecar) |
| `payments` | Pre-existing 5-column legacy table | DEPRECATE — migrate residual rows to `payment_records`, alias via view |

### D-2 Documents

| Table | Purpose | Status |
|-------|---------|--------|
| `document_archive` | Long-term doc store with AI classification linkage | **CANONICAL** |
| `document_ai_results` | AI extraction outputs | KEEP (sidecar) |
| `document_classification_results` | Classifier output | KEEP (sidecar) |
| `document_match_reviews` | Human review of match results | KEEP (sidecar) |
| `documents` | Old 6-column generic table | DEPRECATE → view |
| `document_uploads` (if present) | Intermediate | MERGE into `document_archive` |

`tg_document_archive_alias` trigger can be removed once `document_uploads` is gone.

### D-3 Credit data

| Table | Purpose | Status |
|-------|---------|--------|
| `credit_report_uploads` | Raw upload row, file path, match status, version | **CANONICAL ingest** |
| `credit_reports` | Parsed/processed report with `version` and `is_current` | **CANONICAL processed** |
| `credit_scan_summaries` | Summary card data per report | KEEP (sidecar) |
| `credit_analysis` | AI analysis output | KEEP (sidecar) |
| `score_history` | Time-series of bureau scores | **CANONICAL scores** |
| `score_predictions` | ML predictions | KEEP (sidecar) |
| `credit_scores` | Old per-bureau scores | DEPRECATE → backfill into `score_history` |
| `client_credit_scores` | Older still | DEPRECATE → backfill into `score_history` |
| `credit_alerts` | Bureau alerts | KEEP |
| `credit_monitoring` | Monitoring config | KEEP |

### D-4 Identity

| Table | Purpose | Status |
|-------|---------|--------|
| `profiles` | Auth-linked user record | **CANONICAL auth** |
| `clients` | Operational engagement record | **CANONICAL engagement** |
| `user_roles` | RBAC | **CANONICAL roles** |
| `demo_users` | Demo/seed accounts | DEPRECATE if unused (verify row count and last_seen) |
| `client_verification_secure` | ID verification records | **CANONICAL identity docs** |
| `verification_codes` | OTP codes | KEEP |

Two-table profile/client split is correct (admin can pre-create clients before signup). Do NOT merge.

### D-5 Notifications

| Table | Purpose | Status |
|-------|---------|--------|
| `client_notifications` | Generic per-client notification feed | **CANONICAL** |
| `payment_notifications` | Payment-specific | MIGRATE into `client_notifications` with `type='payment'` (the column already exists) |
| `messaging_log` | Outbound messages (email/SMS) | KEEP (delivery log) |
| `notification_templates` | Templates (empty) | KEEP + seed |

### D-6 Activity / audit

| Table | Purpose | Status |
|-------|---------|--------|
| `audit_logs` | Security/audit log via `log_security_event()` | **CANONICAL audit** |
| `client_activity_timeline` | Per-client UX-facing feed | **CANONICAL activity** |
| `client_timeline` | Older feed | DEPRECATE → view onto `client_activity_timeline` |
| `case_workflow_log` | Dispute case state transitions | KEEP (specialized) |

### D-7 Admin ops

| Table | Purpose | Status |
|-------|---------|--------|
| `admin_tasks` | Admin task queue (no policies → P0-6) | **CANONICAL** once policies added |
| `admin_reminders` | Reminders | KEEP (sidecar) |
| `admin_notes` | Per-admin notes | KEEP |
| `client_notes` | Per-client notes | KEEP |
| `execution_queue` | Pending automated actions | **CANONICAL automation queue** |
| `task_templates` | Templates | KEEP |
| `autonomous_jobs` | Long-running AI jobs | KEEP |
| `ai_agent_runs` | Per-run telemetry | KEEP (sidecar) |
| `ai_workflows` | Workflow definitions | KEEP |
| `automation_events` | Inbound events that drive `execution_queue` | KEEP |

No table consolidation here, but the boundary between `execution_queue` / `autonomous_jobs` / `automation_events` needs documentation (no overlap by inspection, but easy to confuse).

### D-8 Agreements

| Table | Purpose | Status |
|-------|---------|--------|
| `client_agreements` | Per-client signed agreements with signature path, signed_at | **CANONICAL** |
| `agreements` | 4-column legacy | DEPRECATE → view |

## Storage buckets

| Canonical | Absorbs |
|-----------|---------|
| `client-documents` | `documents`, `document-archive`, `document-uploads`, `utility-bills` |
| `verification-docs` | `identity-docs`, `ssn-docs` |
| `dispute-uploads` | `dispute-letters` (outbound mail PDFs) |
| `credit-reports` | (already canonical) |
| `cashapp-proofs` | (already canonical) |
| `client-agreements` + `signatures` | (kept separate by design) |
| `admin-docs` | (kept; low usage) |

15 → 7 buckets after consolidation.

## Edge functions

| Domain | Canonical | Deprecate |
|--------|-----------|-----------|
| Letter generation | `generate-dispute-letter-secure` + `ai-letter-preview` | `generate-dispute-letter` (**P0-1, delete**), `generate-dispute-ai`, `generate-dispute-preview` |
| Credit analysis | TBD — pick one of `analyze-credit-report` / `analyze-credit-scan` / `analyze-credit-violations` after behavioral diff | other two |
| Chat | `gpt-assistant` + `chat-history-manager` | direct writes from `ai-credit-assistant` (refactor to call `chat-history-manager`) |
| Document AI | `analyze-document` | `process-document-autonomous` (fold into orchestrator) |
| Match | `match-report-to-client` (canonical) — **but `src/lib/clientMatchEngine.ts` must be aligned to it** (P1-1) | — |

## Summary

- **Tables: 72 → ~58** after canonical consolidation (10 deprecated via views, 4 sidecars kept).
- **Storage: 15 → 7 buckets.**
- **Edge functions: 25 → ~18.**
- **Components: 81 → ~55** after removing orphans and merging shells.
- **Pages: 33 → 29** (drop 2 dead + 2 legacy portals).

Preservation contract and migration plan in reports 08 and 09.
