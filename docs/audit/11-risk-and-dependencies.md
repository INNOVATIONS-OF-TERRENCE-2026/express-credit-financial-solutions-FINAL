# 11 — Risk & Dependencies

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | RLS policy addition (P0-6) locks out a workflow currently using service-role-only access | Med | High | For each of the 18 tables, grep `supabase/functions/` and frontend for write paths before applying. Stage in a preview environment. Maintain explicit `service_role` GRANT. |
| R-2 | SSN key rotation corrupts existing rows | Low | Critical | Maintenance-window migration with `BEGIN; ... COMMIT;` and pre-flight row-count check. Keep `_legacy` decrypt for 90 days. Snapshot DB before rotation. |
| R-3 | Plaid token encryption backfill breaks existing bank-link sync | Low | High | Re-encrypt in transaction; verify with `decrypt_plaid_token_with_audit` round-trip on each row before commit. Audit log per row. |
| R-4 | `<ProtectedRoute>` wrap breaks deep links from email campaigns | Med | Med | Wrapper preserves intended URL via `?next=` redirect query. Test 16 legacy redirects after wrap. |
| R-5 | Table consolidation drops data due to view shadowing during cutover | Low | Critical | Mandatory 5-step pattern in report 09. No table is dropped — only renamed to `_legacy`. 30-day retention. |
| R-6 | Edge-function deletion (`generate-dispute-letter`) breaks an undocumented caller | Med | Med | rg the function name in src/ + supabase/. Replace with a 410 Gone response that logs caller details for 14 days, then delete. |
| R-7 | Match-engine alignment changes which clients reports get assigned to | Med | High | Ship shared `match-weights.json` behind a feature flag. Run both engines in parallel for 7 days, write divergence to `audit_logs`, only flip after divergence < 1%. |
| R-8 | Notification table consolidation drops in-flight notifications | Low | Med | Backfill + dual-write window. Verify count parity at each step. |
| R-9 | Premium visual rip-and-replace regresses live admin UX during cutover | High | High | Ship behind a per-user theme flag; admins opt in first; client rollout last. Keep legacy tokens for 1 release. |
| R-10 | `is_admin()` → `has_role()` sweep misses a policy and locks out admins | Med | High | Migration writes `pg_policies` diff to `audit_logs` before/after. Smoke test admin login from a clean session after each policy batch. |
| R-11 | Storage bucket consolidation breaks existing signed URLs in client emails | Low | Med | Keep old buckets as read-only for 30 days; objects are mirrored, not moved. |
| R-12 | `auth.users` trigger chain regression from any nearby DDL | Low | Critical | Anti-list (below) — no migration touches the chain. Independent verification after every Phase-1 migration: signup smoke test. |

## Dependency graph (between phases)

```text
Phase 0 (security)        ── blocks ── every other phase
Phase 1 (consolidation)   ── blocks ── Phases 2, 5, 6
Phase 2 (navigation)      ── blocks ── Phases 3, 4, 6
Phase 3 (client UX)       ── blocks ── Phase 6 (client side)
Phase 4 (admin UX)        ── blocks ── Phase 6 (admin side) + Phase 5.5
Phase 5 (report engine)   ── blocks ── Phase 7
Phase 6 (visual)          ── independent of Phase 5
Phase 7 (scale)           ── waits on Phase 5
```

## Kill-switches

Built into every shipped change in Phases 1–6:

1. **Feature flags** in `public.profiles.feature_flags` jsonb — per-user opt-in for new UX.
2. **Theme flag** `profiles.theme_variant` — `legacy` or `private_banking`.
3. **Migration tag** in `audit_logs.details.phase` — lets ops roll back by phase.
4. **Edge-function aliasing** — old function names redirect to new via thin shim for 14 days, then 410.

## Do-not-touch list (CTO sign-off required)

Touch any of these only with explicit, named sign-off and a documented rollback that has been tested in staging:

1. `auth.users` and any trigger on it.
2. `public.handle_new_user()`, `public.handle_new_user_role()`.
3. `public.user_roles` schema or `has_role()` definition.
4. `public.prevent_user_id_change()` (June 4 admin-aware variant).
5. `public.encrypt_ssn_secure` / `decrypt_ssn_secure` — only the planned vault-key migration touches these.
6. `public.encrypt_plaid_token` / `decrypt_plaid_token` / `decrypt_plaid_token_with_audit`.
7. `public.payment_records` schema — additions OK, column removals/renames require sign-off (downstream: receipts, notifications, summaries, multiple triggers).
8. Storage bucket `signatures` — clients reference signature URLs in saved agreement emails.
9. Storage bucket `client-agreements` — same reason.
10. `public.client_agreements.signed_at`, `signature_path` — legal-binding fields.
11. `public.audit_logs` schema — append-only, no schema change without ops review.
12. `public.rls_auto_enable` event trigger — infrastructure; defense in depth.
13. `supabase/config.toml` `verify_jwt` flags — flipping `true → false` on any function requires sign-off.

## Dependency on external services

| Service | Used by | Risk if down |
|---------|---------|--------------|
| Supabase Auth | every login | total |
| Supabase Storage | every upload | uploads queue, reads degrade |
| Plaid | bank-link sync | DTI calc stale |
| OpenAI (via LOVABLE_API_KEY) | letter generation, AI assistant, document AI | new letters paused; existing UI fine |
| Stripe | subscription checkout | new signups paused |
| Resend (or current email provider) | `new-user-notification`, `send-notification-email` | onboarding emails queued |

No phase introduces a new external dependency.

## Compliance posture (for the record)

- **SSN handling** — Currently P0-2. Post-Phase-0: vault-managed key, decrypt access logged, last-4 displayed only.
- **Plaid tokens** — Currently P0-3. Post-Phase-0: encrypted at rest, decrypt audit-logged.
- **PII access** — `log_client_data_access` covers INSERT/UPDATE on clients; extend to SELECT in Phase 1.
- **Audit completeness** — WF-2 and WF-3 must log (P1-5) before any external compliance review.

## Recovery posture

- DB backups: Supabase managed, point-in-time recovery available per plan.
- Storage: object-level versioning recommended (verify enabled on `signatures`, `client-agreements`, `cashapp-proofs`).
- Code: every migration in a single PR with its rollback. Edge functions redeployable in seconds from git history.

## Final risk-acceptance summary

The largest single risk is **R-9 (premium visual rip-and-replace)**. Mitigation is the per-user theme flag — never flip all users at once. Other Phase 0 risks (R-2, R-3) are well-understood database operations with standard mitigation patterns.

No phase as planned is irreversible. Every change has a defined rollback path.
