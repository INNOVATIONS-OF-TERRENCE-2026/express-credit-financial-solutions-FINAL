
# Express Credit Portal — Manual Payment System

## Important clarification
"Lovable Cloud" on this project IS the existing Supabase backend (Lovable Cloud is powered by Supabase under the hood). This project is already a live production CRM connected to it, with auth, RLS, admin roles (`has_role`), profiles, clients, notifications-style components, and a `cashapp-proofs` private storage bucket already provisioned. Per project rules ("DO NOT REBUILD THE APP / DO NOT CREATE NEW AUTH SYSTEMS"), I will build on the existing backend — not spin up a parallel one. No Stripe code is touched. This is a fully manual proof-of-payment workflow.

Cash App QR you uploaded will be saved as a Lovable Asset and rendered on the Cash App card.

---

## 1. Database (single migration)

New tables in `public` (with GRANTs + RLS):

- `payment_records` — id, client_id (nullable), user_id (auth.uid), payment_method (`cash_app`|`apple_pay`), payment_amount (numeric(12,2), >= 1), payment_note, payment_proof_file_path (storage key), payment_status (`pending`|`approved`|`rejected`|`needs_review`, default `pending`), submitted_at, reviewed_at, reviewed_by, admin_notes, rejection_reason, client_visible_message, created_at, updated_at.
- `payment_activity_events` — id, client_id, payment_record_id (fk), event_type, title, description, visible_to_client (bool), created_by, created_at.
- `client_payment_summary` — maintained via trigger on `payment_records` (insert/update). Fields per spec.
- `payment_notifications` — id, user_id, payment_record_id, title, message, type (default `payment`), read_status (bool), created_at. (Existing project has no unified `notifications` table reachable from client portal, so we add a payment-scoped one — safe and additive.)

Triggers/functions (all `security definer`, `set search_path = public`):
- `update_updated_at_column` (reuse existing).
- `tg_payment_log_submit` — on INSERT into `payment_records`: insert `payment_activity_events` (`payment_submitted`) + `payment_notifications` row for the client.
- `tg_payment_log_status` — on UPDATE of `payment_status`: insert matching activity event + client notification (approved/rejected/needs_review). On replacement-proof (status flipping back to `pending` with new file path), insert `payment_note_added` event "Replacement proof uploaded".
- `tg_payment_summary_sync` — recompute `client_payment_summary` row per `client_id` after insert/update.

RLS:
- `payment_records`:
  - client INSERT: `user_id = auth.uid()`
  - client SELECT/UPDATE: `user_id = auth.uid()` (UPDATE limited to replacing proof when status in rejected/needs_review — enforced via trigger guard).
  - admin (`has_role(auth.uid(),'admin')`): SELECT/UPDATE all.
- `payment_activity_events`, `client_payment_summary`, `payment_notifications`: client SELECT own; admin SELECT all; writes via triggers (service_role).

GRANTs: `authenticated` SELECT/INSERT/UPDATE on `payment_records`; SELECT on the other three; `service_role` ALL on all four. No `anon` grants.

Storage: reuse existing private bucket **`cashapp-proofs`**. Add `storage.objects` policies scoped to path `{auth.uid()}/...`: client INSERT/SELECT own folder; admin SELECT all. No public URLs — admin proof preview uses `createSignedUrl` (short TTL).

## 2. Routes (added to `src/App.tsx`)
- `/payments` → `PaymentsPage` (protected, authenticated)
- `/payment-history` → `PaymentHistoryPage` (protected)
- `/admin/payments` → `AdminPaymentsPage` (admin-guarded via `has_role`)
- Admin detail rendered as a modal inside `/admin/payments` (optional `?paymentId=` deep link); no separate route needed.

No existing routes are removed.

## 3. Components / files
```
src/pages/PaymentsPage.tsx
src/pages/PaymentHistoryPage.tsx
src/pages/AdminPaymentsPage.tsx
src/components/payments/CashAppCard.tsx
src/components/payments/ApplePayCard.tsx
src/components/payments/PaymentAmountForm.tsx     (amount + note + method + proof upload)
src/components/payments/PaymentStatusBadge.tsx
src/components/payments/PaymentHistoryList.tsx
src/components/payments/ReplaceProofDialog.tsx
src/components/payments/ClientPaymentWidget.tsx   (mounted on client dashboard)
src/components/admin/AdminPaymentsTable.tsx
src/components/admin/AdminPaymentReviewModal.tsx  (approve / reject / needs review / add note, signed-URL proof preview)
src/components/admin/AdminPaymentMetrics.tsx      (mounted on AdminDashboard)
src/hooks/usePayments.ts                          (client queries + submit + replace proof)
src/hooks/useAdminPayments.ts                     (list/filter/search + actions)
src/lib/payments.ts                               (zod schemas, currency format, signed-URL helper)
src/assets/cashapp-qr.png.asset.json              (uploaded QR via lovable-assets)
```

Dashboard wiring:
- `src/components/ClientDashboard.tsx` — add `ClientPaymentWidget` (Total Paid / Pending / Last Payment / status + Make a Payment / View History buttons).
- `src/pages/AdminDashboard.tsx` — add `AdminPaymentMetrics` row (Pending / Approved this month / Total Revenue Approved / Needs Review); Pending tile links to `/admin/payments?status=pending`.

## 4. Client workflow
1. Authenticated client visits `/payments`.
2. Picks Cash App (green card + QR + cashtag copy + "Pay With Cash App" → opens `https://cash.app/$Kingyt` in new tab) or Apple Pay (black/white card + copy `531-348-9321`).
3. Enters amount (zod: number ≥ 1, 2-decimal), optional note, uploads proof (png/jpg/jpeg/pdf, ≤ 8 MB).
4. Submit: upload to `cashapp-proofs/{uid}/{record_id}.{ext}` → insert `payment_records` (status `pending`). Triggers create the activity event + notification. Success screen shown.
5. `/payment-history` lists own records with status badges; if `rejected` or `needs_review` a "Replace Proof" dialog re-uploads and updates the record back to `pending`.

## 5. Admin workflow
1. Admin visits `/admin/payments` (guarded by `has_role`).
2. Metrics row + filters (status + method) + search (client name/email/amount).
3. Row click → review modal: client info (joined from `profiles`), amount, method, note, signed-URL proof preview (image inline, PDF link), status history (`payment_activity_events`).
4. Actions: Approve / Reject (requires reason) / Mark Needs Review (requires client-visible message) / Add Admin Note. Each writes `payment_records` (RLS allows because admin); triggers fan out events + notifications + summary recompute. Toast on success.

## 6. Security
- All proof files private; admin previews via short-lived signed URLs.
- RLS forces client `user_id = auth.uid()` on insert/select/update.
- Admin gating uses existing `public.has_role(auth.uid(),'admin')` — no role data in JWT, no client-side admin bypass.
- Zod validation client- and (via DB CHECK constraints + trigger guards) server-side: amount ≥ 1, method/file required, rejection reason required.
- No secrets exposed; no edge functions needed for V1.

## 7. UI
Reuses existing dark luxury theme tokens (no hardcoded colors in components). Cash App card uses an accent token mapped to Cash App green; Apple Pay card uses neutral black/white token pair. Glass cards, large numeric typography, status badges via shadcn `Badge` variants.

## 8. Out of scope (future-ready, not built now)
Stripe/Paddle integration, Apple Pay merchant API, automatic verification, invoices/receipts, subscriptions, balance-due tracking. Schema leaves room (`payment_method` enum extensible, `admin_notes`/`client_visible_message` separate, `client_payment_summary` ready to expand).

## 9. Test plan
- Client: log in → `/payments` → submit $5 cash app + screenshot → see success → `/payment-history` shows Pending → dashboard widget shows Pending.
- Admin: `/admin/payments` → open record → view proof (signed URL) → Approve → client widget shows Approved, history badge updates, summary `total_paid` increments.
- Reject path: enter reason → client sees rejected with reason → uploads replacement proof → status returns to Pending, activity timeline shows both events.
- RLS: second authenticated client cannot read first client's record (verified by query).

---

## Technical notes
- Lovable Cloud here = the connected Supabase project (`vctxvlkzoyqrwnletgsp`). Tables created via `supabase--migration`; bucket already exists.
- No changes to existing auth, roles, or tables. Purely additive.
- `src/integrations/supabase/types.ts` will regenerate after migration approval.
