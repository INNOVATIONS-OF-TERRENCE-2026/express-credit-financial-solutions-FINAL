

# Plan: Remove Stripe, Wire Admin-Managed Membership CRM

## Summary
Strip all Stripe/payment logic from the platform. Replace with admin-managed membership tiers stored in the `profiles` table. Keep all AI, dispute, Plaid, and CRM features fully intact.

## Files to Delete
- `src/config/stripeLinks.ts`
- `src/config/priceMap.ts`
- `src/lib/createCheckout.ts`
- `supabase/functions/create-subscription-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

## Files to Modify

### 1. `src/pages/Index.tsx`
- Remove `STRIPE_LINKS` import and `handlePlanClick` function
- Replace any "Buy Now" / payment CTAs with "Contact Us" or "Request Access" buttons that navigate to `/membership`

### 2. `src/pages/MembershipPricing.tsx`
- Remove `STRIPE_LINKS` import, `stripeKey` from plan definitions
- Change CTA buttons from checkout redirects to "Request Enrollment" — show a toast saying "Contact admin to activate your membership" or similar
- Keep the plan cards and feature lists as informational display

### 3. `src/pages/MembershipSuccess.tsx` → Delete or repurpose
- Remove the page and its route (it references Stripe session IDs)

### 4. `src/pages/CashAppCheckout.tsx`
- Remove the page and its route (tied to payment processing)

### 5. `src/pages/AdminCashApp.tsx`
- Remove the page and its route

### 6. `src/App.tsx`
- Remove routes: `/membership-success`, `/checkout`, `/admin/cashapp`
- Remove imports for `MembershipSuccess`, `CashAppCheckout`, `AdminCashApp`

### 7. `src/hooks/useMembership.tsx`
- Simplify: read `plan_type` and `payment_status` from `profiles` table (already does this)
- Remove any payment-status gating — treat `plan_type` as the sole access determinant
- Update `hasAccess` to use simplified tier names: `basic`, `pro`, `elite`, `vip`
- Remove catch block that defaults to `Gold Basic Package`

### 8. `src/components/ClientLogin.tsx`
- Remove "Powered by Stripe" text (line ~157)

### 9. `src/pages/AdminDashboard.tsx`
- Add a "Manage Membership" section/tab with:
  - Dropdown to select user
  - Dropdown to assign tier (`basic`, `pro`, `elite`, `vip`)
  - Toggle for `payment_status` (`active`/`inactive`)
  - "Grant VIP Trial" button with expiry date picker
  - Save button that updates `profiles` table

## Database Migration
- No new tables needed — `profiles` already has `plan_type`, `payment_status`, `membership_type`, `expires_at`
- Ensure admin can update these fields via existing RLS (admin policies already exist on profiles or will use service role)

## Technical Details
- Total ~10 files modified/deleted
- No new edge functions needed
- No new npm dependencies
- Existing `MembershipProvider` and `ProtectedRoute` continue to work, just reading from DB without payment validation
- Admin membership management uses direct Supabase client updates with admin RLS policies

