
Goal: fix the missing admin workflow visibility, repair the broken agreement exit behavior, and rebuild `/client-portals` into a real admin operations hub that auto-syncs with actual client accounts instead of hardcoded demo data.

1. Root-cause fixes I found
- The new workflow components do exist in `src/pages/AdminDashboard.tsx`, but they only appear inside the `/admin` dashboard after passing the admin-role gate. They are not surfaced on `/client-portals`, so they feel “missing” unless you deliberately switch sections.
- `/client-portals` is still powered by a hardcoded `clients` array in `src/pages/ClientPortalLinks.tsx`, so it will never show newly registered users.
- Client portal routing is also hardcoded in `src/pages/ClientPortals.tsx` with only 3 allowed slugs (`melvin`, `phoebe`, `jadlyn`), so newly created clients cannot open a real portal from admin tools.
- The agreement exit issue is very likely split across two places:
  - `ClientOnboarding.tsx` sends the floating exit button to `/dashboard`, but that route does not exist.
  - `ClientAgreementModal.tsx` should be made fully controlled so overlay/X/cancel all close consistently and safely reset modal state.

2. Admin dashboard upgrade
I will make the workflow features impossible to miss inside the admin dashboard:
- Add a persistent “Workflow Command Center” block at the top of the admin overview with live preview cards for:
  - Review Queue
  - Pipeline
  - AI Analysis
  - AI Ops
- Make Quick Actions open the exact section and visually confirm the selected section.
- Add direct counts/badges from live data so empty sections are clearly shown as “0 awaiting review” instead of appearing broken.
- Add secondary access points from the overview cards and the sidebar so these tools are reachable from multiple places.
- Surface recent queue items / pipeline activity inline on the overview so users can see the components working without changing tabs.

3. Agreement exit + close behavior fix
I will harden both agreement experiences:
- `src/pages/ClientOnboarding.tsx`
  - Fix the floating exit button to navigate to a real route instead of `/dashboard`.
  - Use role/auth-aware fallback navigation such as `/credit-tracking`, `/`, or previous page logic.
- `src/components/ClientAgreementModal.tsx`
  - Convert `onOpenChange` handling to a proper controlled boolean callback.
  - Ensure X button, overlay click, Escape key, and Cancel button all close the modal reliably.
  - Reset partial signature form state when closing so reopening is clean.
  - Preserve accessibility and prevent accidental lock-in on the agreement screen.

4. Complete rebuild of Admin Client Portal Management
I will replace the current static page with a real admin client operations system:
- Remove the hardcoded client array from `ClientPortalLinks.tsx`.
- Load real client/account data from Supabase by combining:
  - `profiles` for newly created accounts
  - `clients` for completed onboarding records
- Show account lifecycle states such as:
  - Registered only
  - Onboarding started
  - Onboarding completed
  - Agreement signed
  - Documents uploaded
  - Portal ready
- Add robust search, filters, sorting, and summary metrics.
- Add live stats cards for:
  - Total accounts
  - New signups
  - Missing onboarding
  - Missing agreement
  - Portal-ready clients
  - Recent uploads/disputes
- Build a much stronger action system:
  - Open portal
  - View client profile
  - Upload documents
  - Review agreement status
  - Start dispute workflow
  - Open admin dashboard section
  - Copy direct portal link
- Add empty states and warning states so incomplete clients are still visible instead of disappearing.

5. Fix new-client syncing end-to-end
I will fix the reason new clients are not showing:
- Query `profiles` as the base source of truth for all created accounts.
- Left-join/merge `clients` by `user_id` so newly registered users appear immediately, even before onboarding creates a `clients` row.
- Mark records missing a `clients` row as “Needs onboarding setup”.
- Update admin overview and uploader components to use the same merged client source so all admin tools stay in sync.
- If needed, add a reusable client-directory hook/service to centralize this logic and stop page-to-page mismatch.

6. Fix portal routing for all real clients
I will replace the hardcoded 3-client routing model:
- Refactor `src/pages/ClientPortals.tsx` to stop depending on the static `CLIENT_NAMES` map.
- Use a real lookup based on database client record / user association.
- Normalize portal access so admin-generated links work for every real client account.
- Update all “View Portal” buttons in admin pages to use the new route format consistently.
- Keep access secure so clients only see their own portal and admins can open/admin-preview safely where intended.

7. Security and access hardening
Because this is admin tooling, I will also tighten access:
- Protect `/client-portals` behind admin access instead of exposing it as a public route.
- Keep admin-only data fetches aligned with existing role checks.
- Avoid exposing personal data to non-admin users.
- Preserve the existing double-gate behavior for AI Ops while still making the rest of the workflow visible to authorized admins.

8. Files likely involved
- `src/pages/AdminDashboard.tsx`
- `src/pages/ClientPortalLinks.tsx`
- `src/pages/ClientPortals.tsx`
- `src/components/ClientAgreementModal.tsx`
- `src/pages/ClientOnboarding.tsx`
- `src/components/AdminClientOverview.tsx`
- `src/components/AdminDocumentUploader.tsx`
- possibly a new shared hook/service for unified client directory data

Technical details
- Main data issue: current admin client pages rely on `clients`, but recent real accounts exist in `profiles` without matching `clients` rows.
- Main routing issue: current portal access is hardcoded to 3 names and cannot scale.
- Main UX issue: workflow components are implemented but not sufficiently surfaced in the overview, so they appear absent.
- No backend deletion is needed; this is primarily a routing, data-source, access, and dashboard discoverability upgrade.
