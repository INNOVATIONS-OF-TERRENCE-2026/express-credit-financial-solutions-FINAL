# 04 — Database Architecture

Full per-table data is in `_stream-b-backend.md`. This report is the synthesis.

## High-level ER (core)

```text
auth.users ──1:1──> public.profiles
         └─1:1──> public.user_roles (multi-row possible)
         └─1:1──> public.clients (created on signup OR pre-created by admin, joined via user_id)

public.clients ─┬─< credit_report_uploads ──< credit_reports (versioned)
                ├─< credit_scan_summaries
                ├─< dispute_letters ──< flagged_disputes
                ├─< client_agreements (signature_path → storage:signatures)
                ├─< client_activity_timeline
                ├─< client_notes
                ├─< score_history ──> score_predictions
                ├─< client_processing_cycles
                ├─< client_intelligence_packets
                ├─< client_timers ──> pipeline_stages
                └─< client_verification_secure

public.profiles.user_id ─┬─< payment_records ──< payment_activity_events
                         │                   └─< payment_receipts
                         ├─< payment_notifications
                         ├─< client_notifications
                         ├─< subscriptions
                         ├─< purchases ── trigger ──> client_timers, pipeline_stages, client_documents
                         ├─< bank_links (Plaid)
                         ├─< experian_credentials
                         ├─< chat_history
                         └─< user_onboarding

public.audit_logs <── log_security_event() <── every trigger that wants to log
```

## RLS coverage matrix

| Coverage state | Table count | Examples |
|----------------|-------------|----------|
| RLS on, ≥1 policy, GRANTs aligned | 47 | `clients`, `profiles`, `payment_records`, `credit_report_uploads`, `client_agreements`, `user_roles` |
| RLS on, 0 policies (silent denial) **P0-6** | 18 | `purchases`, `admin_tasks`, `execution_queue`, `pipeline_stages`, `task_templates`, `notification_templates`, `messaging_log`, `automation_events`, `autonomous_jobs`, `autonomous_settings`, `client_processing_cycles`, `client_intelligence_packets`, `mailing_bundles`, `document_classification_results`, `document_ai_results`, `ai_workflows`, `ai_agent_runs`, `agreements` |
| RLS off (intentional for views) | 3 | `client_payment_summary` (view), `bank_links_safe` (view), reporting views |
| RLS off (defect) | 4 | flagged in stream-b §2 |

## GRANT audit

`stream-b §3` enumerates per-table. Pattern findings:

- **`anon` grants** present on a handful of tables that scope by `auth.uid()` only → useless `anon` grant, low risk but should be revoked: `profiles`, `clients`, `chat_history`, `bank_links`.
- **Missing `authenticated` GRANT** on 6 tables that have policies referencing `authenticated` role: `mailing_bundles`, `task_templates`, `ai_workflows`, `automation_events`, `autonomous_jobs`, `client_processing_cycles`. These are reachable only via service-role today.
- **Missing `service_role` GRANT** on 0 tables (good — wide-open by default).

## RBAC predicate inconsistency (P1-6)

Two predicates are in play:

- `has_role(uid, 'admin')` — canonical, security definer, references `user_roles`. Used in ~75% of admin policies.
- `is_admin()` — appears in some older policies; definition references a deprecated email allow-list in legacy migrations.

Rule: every admin policy must use `has_role(auth.uid(), 'admin')`. Sweep for `is_admin()` in `pg_policies.qual` and `with_check`.

## Triggers (functional summary)

| Trigger | Fires on | Purpose | Risk |
|---------|----------|---------|------|
| `on_auth_user_created` | `auth.users` INSERT | `handle_new_user()` + `handle_new_user_role()` | Load-bearing. |
| `on_purchase_insert` | `purchases` INSERT | `create_pipeline_stages` + `create_client_timer` + `create_required_documents` | **Silently dead** — `purchases` has 0 RLS policies (P0-6), so no inserts succeed. Pipeline never starts. |
| `update_*_updated_at` | every table with updated_at | sets `updated_at = now()` | Standard, fine. |
| `prevent_user_id_change` on most user-scoped tables | UPDATE | enforces user_id immutability, admin-bypass aware | Correct (June 4 patch). |
| `tg_payment_after_insert/update` on `payment_records` | INSERT/UPDATE | emits `payment_activity_events` + `payment_notifications` | Correct. |
| `bump_credit_report_version` on `credit_reports` | INSERT | versioning, sets `is_current` | Correct. |
| `tg_document_archive_alias` on `document_archive` | INSERT | column-name alias hack | Remove after table consolidation. |
| `rls_auto_enable` (event trigger) | every CREATE TABLE in public | auto-enables RLS | Infrastructure. Good. **Note:** this is why 18 tables have RLS on but no policies — auto-enable without auto-policy. |

## Encryption surface

| Asset | Function | Status |
|-------|----------|--------|
| SSN (last4 only stored) | `encrypt_ssn_secure` / `decrypt_ssn_secure` | **P0-2** — static key. |
| Plaid access tokens | `encrypt_plaid_token` / `decrypt_plaid_token` / `decrypt_plaid_token_with_audit` | **P0-3** — function exists but not invoked on existing rows. |
| Auth credentials | Supabase manages | OK. |
| Storage objects | Supabase storage encryption-at-rest | OK. |

Decryption audit: `decrypt_plaid_token_with_audit` writes `PLAID_TOKEN_DECRYPTED` to `audit_logs`. No equivalent for SSN. Add `log_security_event('SSN_DECRYPTED', ...)` to `decrypt_ssn_secure`.

## Storage bucket → table linkage

| Bucket | Table.column |
|--------|--------------|
| `cashapp-proofs` | `payment_records.proof_path` |
| `credit-reports` | `credit_report_uploads.file_path`, `credit_reports.file_path` |
| `client-agreements` | `client_agreements.agreement_path` |
| `signatures` | `client_agreements.signature_path` |
| `dispute-uploads` | `dispute_letters.attachment_path` |
| `dispute-letters` | `dispute_letters.outbound_path` (overlap with dispute-uploads) |
| `verification-docs` | `client_verification_secure.file_path` |
| `identity-docs` / `ssn-docs` / `utility-bills` | referenced inline in `SecureVerificationUpload`, no DB row (**P0-8**) |
| `client-documents` | `document_archive.file_path` |
| `documents` / `document-archive` / `document-uploads` | `document_archive.file_path` (inconsistent prefixing) |
| `admin-docs` | `admin_notes` attachments |

## Functions inventory

22 public functions. All security-definer where they need elevated privileges. All set `search_path` (good). Concerns:

- `encrypt_ssn_secure` static key (P0-2).
- `decrypt_plaid_token` raises on failure with `RAISE EXCEPTION 'Failed to decrypt Plaid token: %'` — error message could leak partial token in some Postgres versions. Mitigation: catch + log only.
- `rls_auto_enable` event trigger is great defense in depth but creates the "RLS on, zero policies → silent denial" trap (P0-6).

## Recommended invariants (to enforce in future)

1. Every new public table requires: GRANT block (per role using policies), at least one explicit RLS policy, an audit trigger if it holds PII.
2. Every admin check uses `has_role(auth.uid(), 'admin')`. `is_admin()` is forbidden in new policies.
3. Every PII column has a documented encryption strategy (vault key, rotation cadence).
4. Every storage path written by client code has a matching DB row insert in the same transaction (or compensating cleanup).
