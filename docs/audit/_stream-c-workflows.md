# Express Credit CRM — Seven Core Workflow Audit
> Read-only architectural trace. Generated from source inspection.
> Format: sequence diagram → files → tables/buckets → triggers/edge fns → breakage → duplicates → canonical path.

---

## WF-1 · CLIENT ONBOARDING

### Sequence Diagram
```text
Browser (RegisterForm / ClientOnboarding)
  │
  ├─[1] supabase.auth.signUp()
  │       └─► auth.users INSERT
  │                └─► TRIGGER: on_auth_user_created
  │                        └─► handle_new_user() [migration 20260325163144]
  │                                └─► INSERT profiles (user_id, email, first_name, last_name, payment_status)
  │
  ├─[2] useAuth.tsx:66 → edge fn: new-user-notification (fire-and-forget)
  │
  ├─[3] ClientOnboarding.tsx:handleSubmit()
  │       ├─► storage.upload → bucket: client-documents  (drivers-license / proof-of-address / credit-reports)
  │       ├─► logFileUpload() [useAuditLog]  → INSERT audit_logs
  │       └─► supabase.from('clients').insert(...)  → INSERT clients
  │                 (user_id TEXT, full_name, dob, ssn_last4, ssn_encrypted, phone, email, membership_plan)
  │
  ├─[4] ClientAgreementModal shown when hasSignedAgreement===false
  │       └─► useClientAgreement.tsx → SELECT client_agreements (gate check)
  │
  └─[5] FIRST PAYMENT → WF-4 (separate flow; no hard link from onboarding submit)
```

### Files Touched
| File | Entry Point |
|---|---|
| `src/pages/ClientOnboarding.tsx` | `handleSubmit()` ~L140 |
| `src/components/RegisterForm.tsx` | `supabase.auth.signUp()` |
| `src/hooks/useAuth.tsx` | L66 – new-user-notification call |
| `src/hooks/useClientAgreement.tsx` | `checkAgreementStatus()` L11 |
| `src/components/ClientAgreementModal.tsx` | modal open gate |
| `src/hooks/useAuditLog.tsx` | `logFileUpload()` |
| `supabase/functions/new-user-notification/index.ts` | edge fn |
| `supabase/migrations/20260325163144_*.sql` | `handle_new_user()` trigger |

### Tables / Buckets
`auth.users`, `profiles`, `clients`, `client_agreements` (read), `audit_logs`
Bucket: `client-documents`

### Triggers / Edge Functions
- `on_auth_user_created` → `handle_new_user()` (AFTER INSERT on auth.users)
- `new-user-notification` edge fn (called from `useAuth.tsx:66`, fire-and-forget)

### Breakage
1. **Duplicate `handle_new_user` definitions** — migrations `20250724053439`, `20250724053539`, `20250724053610`, and `20260325163144` all `CREATE OR REPLACE` this function; latest wins but diff schema columns in older versions may leave dead columns.
2. **`clients` schema mismatch** — earliest migration (`20250724012903`) has columns `date_of_birth`, `ssn`, `phone_number`, `email_address`. `ClientOnboarding.tsx:handleSubmit()` inserts `dob`, `ssn_last4`, `ssn_encrypted`, `phone`, `email` (updated schema). If DB is on old migration, inserts will fail silently or with runtime error.
3. **No `user_onboarding` table writes** — referenced in spec; not found in any source file or migration. The checklist/progress uses `document_archive` and `client_agreements` as proxies.
4. **`new-user-notification` error swallowed** — `useAuth.tsx:66` wraps in try/catch and logs only to console; admin never notified on failure.
5. **No payment gate on onboarding complete** — `ClientOnboarding.tsx` resets form on success and does not navigate to payment step; first payment is entirely disconnected.
6. **SSN stored two ways** — `ssn_last4` + `ssn_encrypted` in new path; old migration stored raw `ssn TEXT`. No migration to drop/encrypt legacy column.

### Duplicates
- `handle_new_user()` defined 4× across migrations.
- Profile creation: `handle_new_user` (trigger) + `handle_new_user_role` (migration `20250724152818` and `20250726064958`) = two separate triggers on auth.users that both write to profiles.

### Canonical Path
`RegisterForm → auth.signUp → handle_new_user trigger → profiles → ClientOnboarding form → clients insert → ClientAgreementModal → WF-6 → Payments page → WF-4`

---

## WF-2 · REPORT UPLOAD & MATCHING

### Sequence Diagram
```text
Admin: AdminUploadReports.tsx
  │
  ├─[1] FileUpload UI → supabase.storage.upload() → bucket: credit-reports (or client-documents)
  │
  ├─[2] INSERT credit_report_uploads (file_name, user_id, client_id?, analysis_status='pending')
  │       └─► AdminUploadReports.tsx:L113 also inserts client_activity_timeline entry
  │
  ├─[3] Admin clicks "Match" → RecentReportMatches.tsx:L46
  │       └─► POST supabase.functions.invoke('match-report-to-client', { report_id, source:'credit_report_uploads' })
  │                └─► match-report-to-client/index.ts
  │                       ├─► SELECT clients (all) for scoring
  │                       ├─► extractHints(raw_text) → scoreClient() loop
  │                       ├─► UPDATE credit_report_uploads SET client_id=, match_confidence=, match_status=
  │                       └─► returns { matched, confidence, reasons }
  │
  ├─[4] ClientMatchEnginePanel.tsx → lib/clientMatchEngine.ts:matchClient()
  │       ├─► SELECT clients (scoring loop, same logic as edge fn)
  │       └─► result displayed; admin manually confirms → UPDATE credit_report_uploads.client_id
  │
  ├─[5] Version bump: CreditReportVersionHistory.tsx:L60
  │       ├─► UPDATE credit_reports SET is_current=false WHERE client_id=X
  │       └─► UPDATE credit_reports SET is_current=true WHERE id=chosen
  │
  └─[6] AdminDocumentUploader.tsx / AdminFileUploader.tsx alternate paths
          └─► INSERT credit_reports (not credit_report_uploads)
```

### Files Touched
| File | Entry Point |
|---|---|
| `src/pages/AdminUploadReports.tsx` | upload + L113 activity insert |
| `src/components/CreditReportUpload.tsx` | drag-drop UI |
| `src/components/admin/ClientMatchEnginePanel.tsx` | match UI |
| `src/lib/clientMatchEngine.ts` | `matchClient()` |
| `src/components/admin/RecentReportMatches.tsx` | L46 edge fn call |
| `src/components/CreditReportVersionHistory.tsx` | version swap L60 |
| `src/components/AdminDocumentUploader.tsx` | alternate INSERT credit_reports |
| `src/components/AdminFileUploader.tsx` | L104 alternate INSERT credit_reports |
| `supabase/functions/match-report-to-client/index.ts` | scoreClient() |

### Tables / Buckets
`credit_report_uploads`, `credit_reports`, `clients`, `client_activity_timeline`
Bucket: `credit-reports` (inferred), `client-documents`

### Triggers / Edge Functions
- `match-report-to-client` edge fn (manually invoked)
- No automatic trigger on `credit_report_uploads` INSERT

### Breakage
1. **Duplicate match logic** — `clientMatchEngine.ts` (frontend) and `match-report-to-client/index.ts` (edge fn) implement the same scoring algorithm independently. Scoring weights differ: edge fn `ssn_last4=0.45`, `email=0.25`, `name=0.30*ns`; frontend has different priority ordering. Results will diverge.
2. **Two separate tables** — `credit_report_uploads` (bulk flow) and `credit_reports` (AdminDocumentUploader / AdminFileUploader / ClientDocumentManager). `ClientPortal.tsx:L177-187` queries both in fallback chain. Version history only operates on `credit_reports`.
3. **No automatic match trigger** — matching is entirely manual; new uploads sit at `analysis_status='pending'` until admin acts.
4. **bulk_upload_batches not found in source** — referenced in spec; no INSERT or SELECT found in any `.tsx`/`.ts` file or migration. Likely planned but unimplemented.
5. **No RLS on credit_report_uploads for admin-only INSERT** — not verified; edge fn uses service role key so bypasses RLS, but direct client inserts from AdminUploadReports use anon key.

### Duplicates
- `credit_reports` INSERT path: `AdminDocumentUploader.tsx:L110`, `AdminFileUploader.tsx:L104`, `ClientDocumentManager.tsx:L106` — three independent insert paths, none coordinated.
- Match engine: `clientMatchEngine.ts` + `match-report-to-client` edge fn.

### Canonical Path
`AdminUploadReports → storage upload → INSERT credit_report_uploads → invoke match-report-to-client → UPDATE client_id → CreditReportVersionHistory bump on credit_reports`

---

## WF-3 · DISPUTE GENERATION

### Sequence Diagram
```text
Admin/System
  │
  ├─[1] analyze-credit-violations edge fn (invoked from AdminAIControlPanel or analyze-credit-report)
  │       └─► OpenAI call on credit report text
  │       └─► INSERT flagged_disputes[] (creditor_name, flag_reason, flag_confidence, user_id)
  │
  ├─[2] FlaggedDisputesTable.tsx → SELECT flagged_disputes
  │       └─► Admin reviews: UPDATE flagged_disputes SET admin_approved=true, admin_notes=
  │
  ├─[3] BulkDisputeWizard.tsx:fetchFlaggedAccounts()
  │       └─► SELECT flagged_disputes WHERE admin_approved=true AND dispute_letter_generated=false
  │
  ├─[4] BulkDisputeWizard step 2: generate letters
  │       ├─► For each selected account → supabase.functions.invoke('generate-dispute-letter' or 'generate-dispute-letter-secure')
  │       ├─► Returns letter text → INSERT dispute_letters (creditor_name, generated_letter, case_status='draft_generated', user_id)
  │       └─► UPDATE flagged_disputes SET dispute_letter_generated=true
  │
  ├─[5] AdminReviewQueue / CasePipelineDashboard
  │       └─► SELECT dispute_letters WHERE case_status='needs_admin_review'
  │       └─► Admin approves → UPDATE dispute_letters SET case_status='approved'
  │
  ├─[6] ai-letter-preview edge fn
  │       └─► Called from BulkDisputeWizard preview step
  │
  └─[7] MailingBundleDownloader.tsx
          └─► SELECT mailing_bundles WHERE client_id / user_id
          └─► download ZIP of letters
```

### Files Touched
| File | Entry Point |
|---|---|
| `src/components/BulkDisputeWizard.tsx` | `fetchFlaggedAccounts()` L97, generate loop ~L130 |
| `src/components/FlaggedDisputesTable.tsx` | admin approve L84 |
| `src/components/AdminReviewQueue.tsx` | queue SELECT |
| `src/components/CasePipelineDashboard.tsx` | L30 dispute_letters SELECT |
| `src/components/MailingBundleDownloader.tsx` | L39 SELECT mailing_bundles, L138 download |
| `src/services/disputeWorkflow.ts` | `DisputeLetterRow`, `CaseStatus`, status helpers |
| `supabase/functions/analyze-credit-violations/index.ts` | OpenAI violations analysis |
| `supabase/functions/generate-dispute-letter/index.ts` | letter gen |
| `supabase/functions/generate-dispute-letter-secure/index.ts` | secure variant |
| `supabase/functions/ai-letter-preview/index.ts` | preview |
| `supabase/functions/generate-dispute-ai/index.ts` | third letter gen variant |
| `supabase/functions/generate-dispute-preview/index.ts` | fourth preview variant |

### Tables / Buckets
`flagged_disputes`, `dispute_letters`, `mailing_bundles`
(No `violation_flags` or `dispute_cases` tables found in source — spec references are unimplemented)

### Triggers / Edge Functions
`analyze-credit-violations`, `generate-dispute-letter`, `generate-dispute-letter-secure`, `generate-dispute-ai`, `generate-dispute-preview`, `ai-letter-preview`

### Breakage
1. **Four letter-generation edge functions** — `generate-dispute-letter`, `generate-dispute-letter-secure`, `generate-dispute-ai`, `generate-dispute-preview` all appear to generate dispute letters. BulkDisputeWizard calls one; other callers may call different ones. No single canonical fn.
2. **`violation_flags` table missing** — spec references it; not found in any migration or source query.
3. **`dispute_cases` table missing** — spec references it; not found anywhere.
4. **`mailing_bundles` not auto-populated** — no INSERT into `mailing_bundles` found in any source file or migration. `MailingBundleDownloader` only SELECTs; bundles must be created externally or by an undiscovered path.
5. **`dispute_letter_generated` flag race** — BulkDisputeWizard UPDATEs `flagged_disputes.dispute_letter_generated=true` after letter INSERT. If letter INSERT succeeds but UPDATE fails, the account reappears in queue on next load.
6. **No audit log on letter generation** — no `audit_logs` or `client_activity_timeline` insert after letter creation.

### Duplicates
- 4 letter-generation edge functions (generate-dispute-letter, generate-dispute-letter-secure, generate-dispute-ai, generate-dispute-preview).
- 2 preview edge functions (ai-letter-preview, generate-dispute-preview).

### Canonical Path
`analyze-credit-violations → INSERT flagged_disputes → admin approve → BulkDisputeWizard → generate-dispute-letter-secure → INSERT dispute_letters → admin approve case_status → mailing_bundles assembly`

---

## WF-4 · PAYMENT FLOW

### Sequence Diagram
```text
Client: Payments.tsx / ClientPaymentWidget / CashAppCard / ApplePayCard
  │
  ├─[1] usePayments.submitPayment()  [usePayments.ts:L94]
  │       ├─► INSERT payment_records (user_id, method, amount, status='pending')
  │       ├─► storage.upload(proof) → bucket: payment-proofs
  │       └─► UPDATE payment_records SET payment_proof_file_path=path
  │                └─► TRIGGER: tg_payment_after_insert  [migration 20260603073841 L129]
  │                        ├─► INSERT payment_activity_events (event_type='submitted')
  │                        └─► INSERT payment_notifications (type='new_submission', to admin)
  │
  ├─[2] Admin: AdminPaymentsPage / AdminPaymentsTable / AdminPaymentReviewModal
  │       └─► useAdminPayments.approvePayment() / rejectPayment()  [useAdminPayments.ts:L108,L123]
  │                └─► UPDATE payment_records SET status='approved'|'rejected', reviewed_by=, reviewed_at=
  │                        └─► TRIGGER: tg_payment_after_update  [migration 20260603073841 L155]
  │                                ├─► INSERT payment_activity_events (event_type='approved'|'rejected')
  │                                ├─► INSERT payment_notifications (to client)
  │                                ├─► If approved: INSERT payment_receipts
  │                                └─► If approved: UPDATE profiles SET payment_status='paid'
  │
  ├─[3] tg_payment_summary_sync [L200] — NOTE: DROPPED in migration 20260604043902
  │       └─► Was: upsert payment_summary view/table — now removed
  │
  └─[4] Client sees result via usePayments.refresh() + realtime subscription
          └─► ClientPortal.tsx:L171 also reads payment_receipts separately
```

### Files Touched
| File | Entry Point |
|---|---|
| `src/pages/client/Payments.tsx` | submit form |
| `src/pages/PaymentsPage.tsx` | alternate client payments page |
| `src/components/payments/CashAppCard.tsx` | CashApp proof UI |
| `src/components/payments/ApplePayCard.tsx` | ApplePay UI |
| `src/components/payments/ClientPaymentWidget.tsx` | widget wrapper |
| `src/components/payments/PaymentHistoryList.tsx` | history display |
| `src/components/payments/ReplaceProofDialog.tsx` | re-submit rejected proof |
| `src/hooks/usePayments.ts` | `submitPayment()` L94, `replaceProof()` L141 |
| `src/hooks/useAdminPayments.ts` | `approvePayment()` / `rejectPayment()` |
| `src/pages/AdminPaymentsPage.tsx` | admin review page |
| `src/components/admin/AdminPaymentsTable.tsx` | table view |
| `src/components/admin/AdminPaymentReviewModal.tsx` | L34 reads payment_activity_events |
| `src/components/admin/ClientPaymentInfo.tsx` | per-client payment info |
| `src/lib/payments.ts` | constants: PAYMENT_PROOF_BUCKET, ACCEPTED_PROOF_TYPES |
| `supabase/migrations/20260603073841_*.sql` | tg_payment_after_insert/update/summary_sync |
| `supabase/migrations/20260604043902_*.sql` | DROP tg_payment_summary_sync |

### Tables / Buckets
`payment_records`, `payment_activity_events`, `payment_notifications`, `payment_receipts`, `profiles` (payment_status col)
Bucket: `payment-proofs` (PAYMENT_PROOF_BUCKET constant in `src/lib/payments.ts`)

### Triggers / Edge Functions
- `tg_payment_after_insert` — fires AFTER INSERT on payment_records
- `tg_payment_after_update` — fires AFTER UPDATE on payment_records (status change)
- `tg_payment_summary_sync` — **DROPPED** (migration 20260604043902)

### Breakage
1. **Two client payment pages** — `src/pages/client/Payments.tsx` and `src/pages/PaymentsPage.tsx` both exist; unclear which route loads which. Clients may hit different UIs depending on auth state.
2. **Three payment submission widgets** — `CashAppCard`, `ApplePayCard`, `ClientPaymentWidget` all appear to independently handle proof upload. Only `usePayments.submitPayment()` is the canonical hook, but it's not clear all widgets use it.
3. **`AdminClients.tsx:L363`** directly INSERTs into `payment_records` bypassing `usePayments` and therefore missing the proof upload step. This creates records with `payment_proof_file_path=null`.
4. **`tg_payment_summary_sync` was dropped** — any code that relied on a `payment_summary` table or materialized view is now silently broken. `usePayments.ts` re-computes summary in-memory (L74-85) as workaround — but this is not realtime.
5. **`payment_notifications` not consumed in UI** — no component found that SELECTs `payment_notifications` to show to client. `ClientNotificationsPanel.tsx` may handle this via `client_notifications` table (different table).
6. **Race on proof upload** — record inserted first (L104), then storage upload, then UPDATE proof path (L131). If storage upload fails, record is deleted (L126) but if UPDATE fails after successful upload, record has no proof path. No transaction wrapping.
7. **`useAdminPayments` error swallowed** — `console.error("admin payments fetch error", error)` at L33; UI shows empty table with no user-facing error.

### Duplicates
- `Payments.tsx` vs `PaymentsPage.tsx` (two client payment pages).
- `CashAppCard` + `ApplePayCard` + `ClientPaymentWidget` (three proof-submission UIs).
- `ClientPortal.tsx:L171` reads `payment_receipts` independently of `usePayments`.

### Canonical Path
`Client Payments.tsx → usePayments.submitPayment() → INSERT payment_records → storage upload → UPDATE proof_path → tg_payment_after_insert → Admin AdminPaymentsTable → useAdminPayments.approvePayment() → UPDATE status → tg_payment_after_update → receipts + profile update`

---

## WF-5 · DOCUMENT VAULT

### Sequence Diagram
```text
Client: SecureVerificationUpload / ClientDocumentManager
  │
  ├─[1] handleFileUpload() → storage.upload() → bucket: verification-docs
  │       └─► SecureVerificationUpload: does NOT insert into any table after upload
  │               (upload only, no DB record created)
  │
  ├─[2] ClientDocumentManager.tsx:L92
  │       └─► INSERT document_archive (user_id, document_type, file_path, file_name, file_size)
  │
  ├─[3] Admin: AdminDocumentList / AdminDocumentUploader
  │       ├─► AdminDocumentUploader.tsx:L100 → INSERT document_archive
  │       └─► AdminDocumentUploader.tsx:L110 → INSERT credit_reports (wrong table for docs)
  │
  ├─[4] process-document-autonomous edge fn
  │       └─► AI classification → UPDATE document_archive (or INSERT document_ai_results / document_classification_results)
  │
  ├─[5] analyze-document edge fn
  │       └─► Called from AutonomousControlPanel / AdminAIControlPanel
  │       └─► INSERT document_ai_results
  │
  └─[6] Admin review: useAdminClientDocuments.ts
          └─► SELECT document_archive (+ document_uploads fallback)
          └─► UPDATE verification_status
```

### Files Touched
| File | Entry Point |
|---|---|
| `src/components/SecureVerificationUpload.tsx` | `handleFileUpload()` L37 |
| `src/components/ClientDocumentManager.tsx` | INSERT document_archive L92 |
| `src/components/AdminDocumentList.tsx` | admin view |
| `src/components/AdminDocumentUploader.tsx` | L100 doc_archive, L110 credit_reports |
| `src/components/AdminFileUploader.tsx` | L104 credit_reports, L115 document_archive |
| `src/hooks/useAdminClientDocuments.ts` | SELECT + verify L188 (error swallowed) |
| `src/hooks/useFileUploadSecurity.tsx` | validation; error swallowed L27,38 |
| `supabase/functions/analyze-document/index.ts` | AI analysis |
| `supabase/functions/process-document-autonomous/index.ts` | autonomous classification |

### Tables / Buckets
`document_archive`, `document_uploads` (legacy/parallel), `document_ai_results`, `document_classification_results` (unconfirmed)
Bucket: `verification-docs`, `client-documents`

### Triggers / Edge Functions
- `analyze-document` — manual invocation
- `process-document-autonomous` — invoked from AutonomousControlPanel

### Breakage
1. **`SecureVerificationUpload` leaves no DB record** — files land in storage bucket but no row is inserted into `document_archive` or `document_uploads`. Admin has no visibility.
2. **Two document tables** — `document_archive` (primary) and `document_uploads` referenced in `useAdminMetrics.ts:L71` and `useAdminClientDocuments.ts`. No migration found for `document_uploads`; likely a ghost reference.
3. **`AdminDocumentUploader.tsx:L110`** inserts into `credit_reports` (not `document_archive`) for some doc types — cross-contamination between document vault and report tables.
4. **`useAdminClientDocuments.ts:L188`** `console.error` swallows failures; admin sees stale data.
5. **No AI auto-trigger** — AI classification is purely manual (no DB trigger on document_archive INSERT).
6. **`identity_docs` table** — referenced in spec, not found in any migration or source query.

### Duplicates
- Two document insert paths: `ClientDocumentManager` + `SecureVerificationUpload` (storage-only, no DB).
- `AdminDocumentUploader` and `AdminFileUploader` both insert into `document_archive`/`credit_reports`.

### Canonical Path
`SecureVerificationUpload → storage upload → INSERT document_archive → analyze-document edge fn → UPDATE document_archive.ai_label → admin useAdminClientDocuments → UPDATE verification_status`
*(Fix: add document_archive INSERT inside SecureVerificationUpload after storage.upload)*

---

## WF-6 · AGREEMENT & SIGNATURE

### Sequence Diagram
```text
Client: ClientOnboarding / ClientPortal
  │
  ├─[1] useClientAgreement.checkAgreementStatus()  [useClientAgreement.tsx:L11]
  │       └─► SELECT client_agreements WHERE user_id=X LIMIT 1
  │               → hasSignedAgreement boolean gate
  │
  ├─[2] ClientAgreementModal opens (isOpen=true when not signed)
  │       ├─► Canvas draw OR typed signature → signatureDataUrl state
  │       └─► handleSign() [ClientAgreementModal.tsx:L176]
  │               ├─► stage='render_signature' → build PNG from canvas / typed text
  │               ├─► stage='build_pdf' → buildPdfBlob() with jsPDF [L129]
  │               ├─► stage='upload_pdf' → storage.upload(pdfBlob) → bucket: client-agreements
  │               ├─► stage='insert_db' → INSERT client_agreements
  │               │       (user_id, full_name, signed_at, signature_data, signed_pdf_path, agreement_version)
  │               └─► stage='audit_log' [L261]
  │                       └─► INSERT client_activity_timeline [L272]
  │
  ├─[3] onAgreementSigned() callback → refetchAgreementStatus()
  │
  └─[4] Admin: AdminClientEditor.tsx:L106
          └─► SELECT client_agreements WHERE client_id=X ORDER created_at DESC
```

### Files Touched
| File | Entry Point |
|---|---|
| `src/components/ClientAgreementModal.tsx` | `handleSign()` L176; audit L261 |
| `src/components/DigitalSignature.tsx` | standalone canvas widget (unused in main flow) |
| `src/hooks/useClientAgreement.tsx` | `checkAgreementStatus()` L11 |
| `src/components/AdminClientEditor.tsx` | L106 – read-only admin view |

### Tables / Buckets
`client_agreements`
Bucket: `client-agreements` (PDF), `signatures` (referenced in spec but no code found using it)

### Triggers / Edge Functions
None. Pure client-side insert.

### Breakage
1. **`DigitalSignature.tsx` is orphaned** — a full standalone signature component exists but is not rendered anywhere in the main onboarding flow. `ClientAgreementModal` reimplements canvas drawing internally. Two parallel implementations.
2. **No server-side validation** — agreement insert goes directly from browser with anon key. A client can insert a `client_agreements` row with any `full_name` and fake `signed_at`. No edge fn or trigger validates.
3. **`agreements` table** — referenced in spec; not found in any source query. May be an alias or unimplemented.
4. **`signatures` bucket** — referenced in spec; no upload to this bucket found in source. PDFs go to `client-agreements` bucket only.
5. **`client_agreements` queried by `user_id` in hook** but queried by `client_id` in `AdminClientEditor:L106` — the table has both columns but they may not always match (user can register without a `clients` row).
6. **Audit write swallowed** — `ClientAgreementModal.tsx:L261` is inside a broad try/catch with `lastError` state; if audit insert fails the signature is still considered complete.

### Duplicates
- `DigitalSignature.tsx` + inline canvas in `ClientAgreementModal.tsx` (two signature canvas implementations).

### Canonical Path
`ClientAgreementModal → canvas/typed sig → buildPdfBlob → storage upload client-agreements bucket → INSERT client_agreements → INSERT client_activity_timeline → useClientAgreement.refetch()`

---

## WF-7 · ACTIVITY / AUDIT COVERAGE

### Sequence Diagram
```text
Any workflow action
  │
  ├─► Path A: useAuditLog.tsx → INSERT audit_logs
  │       (used by: ClientOnboarding file uploads, useFileUploadSecurity)
  │
  ├─► Path B: direct supabase.from('client_activity_timeline').insert(...)
  │       (used by: ClientAgreementModal L272, AdminUploadReports L113)
  │
  └─► Path C: DB trigger → INSERT audit_logs or payment_activity_events
          (used by: tg_payment_after_insert, tg_payment_after_update)
```

### Audit Coverage Matrix
| Workflow | audit_logs | client_activity_timeline | payment_activity_events | Covered? |
|---|---|---|---|---|
| WF-1 Client Onboarding (file uploads) | ✅ useAuditLog | ❌ | ❌ | **Partial** |
| WF-1 clients INSERT | ❌ | ❌ | ❌ | **No** |
| WF-1 handle_new_user / profile | ✅ (migration L95) | ❌ | ❌ | **Partial** |
| WF-2 Report upload | ❌ | ✅ AdminUploadReports L113 | ❌ | **Partial** |
| WF-2 Match result | ❌ | ❌ | ❌ | **No** |
| WF-3 Dispute flagging | ❌ | ❌ | ❌ | **No** |
| WF-3 Letter generation | ❌ | ❌ | ❌ | **No** |
| WF-4 Payment submit | ❌ | ❌ | ✅ tg_payment_after_insert | **Yes (DB trigger)** |
| WF-4 Payment approve/reject | ❌ | ❌ | ✅ tg_payment_after_update | **Yes (DB trigger)** |
| WF-5 Document upload | ✅ via useAuditLog (onboarding only) | ❌ | ❌ | **Partial** |
| WF-5 AI classification | ❌ | ❌ | ❌ | **No** |
| WF-6 Agreement signed | ❌ | ✅ ClientAgreementModal L272 | ❌ | **Yes** |
| WF-6 Signature admin view | ❌ | ❌ | ❌ | **No** |

### Files Touched
| File | What it logs |
|---|---|
| `src/hooks/useAuditLog.tsx` | file uploads, general actions → `audit_logs` |
| `src/components/ClientAgreementModal.tsx:L272` | agreement signed → `client_activity_timeline` |
| `src/pages/AdminUploadReports.tsx:L113` | report upload → `client_activity_timeline` |
| `src/components/AdminAuditLogPanel.tsx:L49` | reads `audit_logs` (admin display) |
| `src/pages/AdminActivityPage.tsx:L14-15` | reads both `audit_logs` + `client_activity_timeline` |
| `src/components/ClientActivityTimeline.tsx:L52,59` | reads `client_activity_timeline` |
| `supabase/migrations/20260603073841_*.sql` | payment triggers write `payment_activity_events` |
| `supabase/migrations/20250724053439_*.sql:L95` | handle_new_user writes `audit_logs` |

### Tables
`audit_logs`, `client_activity_timeline`, `payment_activity_events`

### Breakage
1. **No unified logging interface** — three separate logging paths (useAuditLog hook, direct timeline insert, DB triggers) with no shared schema or severity levels.
2. **WF-2 match decisions not logged** — when admin confirms or rejects a report match, no audit trail exists.
3. **WF-3 entirely unlogged** — dispute flag creation, letter generation, admin approval of letters — none write to any audit table.
4. **useAuditLog errors swallowed** — `useAuditLog.tsx:L33,36` console.error only; failed audit writes are silent.
5. **`audit_logs` RLS** — migration `20250724152818` set policies allowing `authenticated` users to INSERT their own rows, but earlier migrations had `"Only edge functions can manage audit logs"` policy. Policy was dropped but replacement was written in same migration — final state allows direct client INSERT which is a data integrity risk.
6. **`client_activity_timeline` RLS gap** — policy `"Service role manages timeline"` checks `auth.jwt() ->> 'role' = 'service_role'` but authenticated users calling from browser will never have service_role JWT claim; this policy is always false for browser calls. `ClientAgreementModal` inserts directly from browser but may be blocked by this policy on some rows depending on which policy fires first.

### Canonical Path
**Recommended**: Create a single `logActivity(event_type, metadata, client_id?)` server function / edge fn that writes to `client_activity_timeline`. All seven workflows call it. Remove direct client-side inserts into audit tables. Back-fill WF-2, WF-3 logging.

---

## CROSS-CUTTING ISSUES SUMMARY

| Issue | Severity | Affected WFs |
|---|---|---|
| Duplicate match engine (frontend + edge fn) | High | WF-2 |
| 4 letter-gen edge functions with divergent logic | High | WF-3 |
| `SecureVerificationUpload` no DB record | High | WF-5 |
| `payment_records` direct INSERT from AdminClients bypasses proof upload | High | WF-4 |
| `DigitalSignature.tsx` orphaned / agreement canvas duplicated | Medium | WF-6 |
| Two client payment pages (Payments.tsx + PaymentsPage.tsx) | Medium | WF-4 |
| `bulk_upload_batches`, `violation_flags`, `dispute_cases`, `identity_docs`, `user_onboarding`, `agreements` tables spec'd but absent | Medium | WF-1,2,3,5 |
| No audit logging for WF-2 match decisions or WF-3 dispute actions | Medium | WF-2,3 |
| `tg_payment_summary_sync` dropped; in-memory fallback in usePayments | Low | WF-4 |
| Three separate audit sinks with no unified schema | Low | WF-7 |
| `handle_new_user()` defined 4× across migrations | Low | WF-1 |
