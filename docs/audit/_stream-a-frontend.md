# Express Credit CRM — Frontend Audit
> Generated from `src/` tree. All line citations are `file:line`.

---

## 1. ROUTES

> **Critical finding:** `<ProtectedRoute>` is imported in `App.tsx:11` but **never used** in the route tree. All guard logic lives inside individual components via `useRoles`/`useAuth` redirects — routes are technically public at the router level.

| Path | Component | Guard | Redirect Target | Notes |
|------|-----------|-------|-----------------|-------|
| `/` | `Index` | none (inline) | — | Login/register landing |
| `/onboarding` | `ClientOnboarding` | none | — | |
| `/membership` | `MembershipPricing` | none | — | |
| `/admin/login` | `AdminLogin` | none | — | |
| `/admin` | `AdminCommandCenter` | inline `useRoles` | → `/` if not admin | |
| `/admin-dashboard` | — | — | `/admin` (replace) | Alias redirect |
| `/admin/payments` | `AdminPaymentsPage` | inline `useRoles` | — | |
| `/admin/upload-reports` | `AdminUploadReports` | inline `AdminShell` | — | |
| `/admin/reports` | `AdminReportsList` | inline `AdminShell` | — | |
| `/admin/disputes` | `AdminDisputesPage` | inline `AdminShell` | — | |
| `/admin/documents` | `AdminDocumentsPage` | inline `AdminShell` | — | |
| `/admin/agreements` | `AdminAgreementsPage` | inline `AdminShell` | — | |
| `/admin/activity` | `AdminActivityPage` | inline `AdminShell` | — | |
| `/admin/clients/:clientId` | `AdminClientEdit` | inline `useRoles` | — | |
| `/admin/client-preview/:clientId` | `AdminClientPreview` | inline `useRoles` | — | |
| `/admin/clients` | `AdminClients` | inline `useRoles` | — | |
| `/admin/settings` | `AdminSettings` | inline `useAuth.isAdmin` | → `/` | Uses `isAdmin` from `useAuth`, not `useRoles` |
| `/admin/tools` | `AdminTools` | inline `useRoles` | — | |
| `/client-portals` | `ClientPortalLinks` | inline `useRoles` | — | Admin-only portal manager |
| `/client/dashboard` | `ClientDashboardPage` | layout-level `useAuth` | → `/` if no user | Canonical client portal |
| `/client/results` | `ClientResultsPage` | layout-level | → `/` | |
| `/client/reports` | `ClientReportsPage` | layout-level | → `/` | |
| `/client/disputes` | `ClientDisputesPage` | layout-level | → `/` | |
| `/client/documents` | `ClientDocumentsPage` | layout-level | → `/` | |
| `/client/payments` | `ClientPaymentsPage` | layout-level | → `/` | |
| `/client/agreements` | `ClientAgreementsPage` | layout-level | → `/` | |
| `/client/messages` | `ClientMessagesPage` | layout-level | → `/` | |
| `/client/settings` | `ClientSettingsPage` | layout-level | → `/` | |
| `/client/:clientSlug` | — | — | `/client/dashboard` (replace) | **⚠ Lossy** — drops slug, any slug-based auth breaks |
| `/client-portals-legacy/:clientSlug` | `ClientPortals` | inline | — | Legacy rollback route |
| `/sba` | `SBAHome` | none | — | |
| `/sba/precheck` | `SBAPreCheck` | none | — | |
| `/sba/consent` | `SBAConsent` | none | — | |
| `/sba/intake` | `SBAIntake` | none | — | |
| `/sba/documents` | `SBADocuments` | none | — | |
| `/sba/packet` | `SBAPacket` | none | — | |
| `/sba/dashboard` | `SBADashboard` | none | — | |
| `/sba/admin` | `SBAAdmin` | none | — | **⚠ No guard on admin page** |
| `/sba-portal/*` | — | — | `/sba/*` (replace) | 8 legacy alias redirects |
| `/payments` | — | — | `/client/payments` | |
| `/payment-history` | — | — | `/client/payments` | |
| `/upload-credit-report` | — | — | `/client/documents` | |
| `/document-center` | — | — | `/client/documents` | |
| `/documents` | — | — | `/client/documents` | |
| `/dispute-center` | — | — | `/client/disputes` | |
| `/data-freeze` | — | — | `/client/disputes` | |
| `/credit-tracking` | — | — | `/client/results` | |
| `/credit-monitoring` | — | — | `/client/results` | |
| `/score-tracker` | — | — | `/client/results` | |
| `/credit-building` | — | — | `/client/dashboard` | |
| `/goodwill-letters` | — | — | `/client/disputes` | |
| `/education` | — | — | `/client/dashboard` | |
| `/ai-assistant` | — | — | `/client/dashboard` | |
| `*` | `NotFound` | — | — | |

**Hidden/Unreachable routes:**
- `src/pages/ComingSoon.tsx` — file exists, **zero routes** point to it. Dead page.
- `src/pages/PaymentsPage.tsx` — file exists, **not in App.tsx**. Dead page (replaced by `/client/payments` redirect).

---

## 2. PAGES

| File | Route(s) | Purpose | Key Hooks/Components | Status |
|------|----------|---------|----------------------|--------|
| `pages/Index.tsx` | `/` | Marketing landing + auth | `useAuth`, `LoginForm`, `RegisterForm`, `FAQSection`, `TrustSignals`, `OnboardingTour`, `EmailVerificationBanner` | Live |
| `pages/AdminLogin.tsx` | `/admin/login` | Admin credential login form | `useAuth.signIn` | Live |
| `pages/AdminCommandCenter.tsx` | `/admin` | Admin home dashboard | `AdminShell`, `AdminKpiGrid`, `AdminPaymentMetrics`, `MarketingFunnelCard` | Live |
| `pages/AdminClients.tsx` | `/admin/clients` | Client list, create, search | `useRoles`, `AdminClientEditor`, `ClientPaymentInfo` | Live |
| `pages/AdminClientEdit.tsx` | `/admin/clients/:clientId` | Edit client record | `AdminNotesPanel`, `ResultsOverridePanel`, `ClientActivityTimeline` | Live |
| `pages/AdminClientPreview.tsx` | `/admin/client-preview/:clientId` | Admin view of legacy client portal | `ClientPortal`, `useRoles` | Live (legacy dependency) |
| `pages/AdminUploadReports.tsx` | `/admin/upload-reports` | Upload credit reports + match | `AdminShell`, `ClientMatchEnginePanel`, `RecentReportMatches` | Live |
| `pages/AdminReportsList.tsx` | `/admin/reports` | View/manage all reports | `AdminShell` | Live |
| `pages/AdminDisputesPage.tsx` | `/admin/disputes` | Disputes management | `AdminShell`, `AdminReviewQueue`, `BulkDisputeWizard`, `FlaggedDisputesTable` | Live |
| `pages/AdminDocumentsPage.tsx` | `/admin/documents` | Document list for all clients | `AdminShell`, `AdminDocumentList` | Live |
| `pages/AdminAgreementsPage.tsx` | `/admin/agreements` | Agreements overview | `AdminShell` | Live |
| `pages/AdminActivityPage.tsx` | `/admin/activity` | Activity/audit log | `AdminShell` | Live |
| `pages/AdminPaymentsPage.tsx` | `/admin/payments` | Payment review queue | `useRoles`, `useAdminPayments`, `AdminPaymentsTable`, `AdminPaymentReviewModal` | Live |
| `pages/AdminSettings.tsx` | `/admin/settings` | Admin settings shell | `useAuth.isAdmin` (inconsistent guard) | Live |
| `pages/AdminTools.tsx` | `/admin/tools` | Multi-tab ops tools | `AdminShell`, 9 tool components | Live |
| `pages/ClientPortalLinks.tsx` | `/client-portals` | Admin portal link manager | `useRoles`, `AdminDocumentUploader` | Live |
| `pages/ClientPortals.tsx` | `/client-portals-legacy/:clientSlug` | Legacy slug-based portal | `ClientLogin`, `ClientPortal`, `useRoles` | **Legacy/rollback** |
| `pages/ClientOnboarding.tsx` | `/onboarding` | Client signup flow | `useAuditLog`, `useClientAgreement`, `ClientAgreementModal` | Live |
| `pages/MembershipPricing.tsx` | `/membership` | Pricing tiers | `useMembership`, `EngineerCredit`, `VisaLogo` | Live |
| `pages/NotFound.tsx` | `*` | 404 | — | Live |
| `pages/ComingSoon.tsx` | **NONE** | Placeholder page | — | **DEAD** |
| `pages/PaymentsPage.tsx` | **NONE** | Old payment submission form | `usePayments`, `CashAppCard`, `ApplePayCard` | **DEAD** (no route) |
| `pages/client/Dashboard.tsx` | `/client/dashboard` | Client credit progress | `useClientPortalData`, `useClient`, `MatchStatusBadge` | Live |
| `pages/client/Results.tsx` | `/client/results` | Before/current scores by bureau | `useClientPortalData`, `useClient` | Live |
| `pages/client/Reports.tsx` | `/client/reports` | Credit report uploads list | `useClient`, supabase direct | Live |
| `pages/client/Disputes.tsx` | `/client/disputes` | Dispute letters list | `useClient`, supabase direct | Live |
| `pages/client/Documents.tsx` | `/client/documents` | Upload verification docs | `SecureVerificationUpload`, `useAuth` | Live |
| `pages/client/Payments.tsx` | `/client/payments` | Payment widget + history | `usePayments`, `ClientPaymentWidget`, `PaymentHistoryList` | Live |
| `pages/client/Agreements.tsx` | `/client/agreements` | Agreement records | `useClient`, supabase direct | Live |
| `pages/client/Messages.tsx` | `/client/messages` | Notifications feed | `ClientNotificationsPanel` | Live |
| `pages/client/Settings.tsx` | `/client/settings` | Profile display | `useClient` | Live (read-only, no edit) |
| `pages/sba/Home.tsx` | `/sba` | SBA program landing | `ThemeSelector` | Live |
| `pages/sba/PreCheck.tsx` | `/sba/precheck` | Eligibility pre-check | SBAConfigProvider | Live |
| `pages/sba/Consent.tsx` | `/sba/consent` | Consent form | `sba/ConsentModal` | Live |
| `pages/sba/Intake.tsx` | `/sba/intake` | Application intake | `sba/FormRow`, `sba/SectionTitle` | Live |
| `pages/sba/Documents.tsx` | `/sba/documents` | Document upload | `sba/Uploader`, `sba/StatusTracker` | Live |
| `pages/sba/Packet.tsx` | `/sba/packet` | Packet builder | — | Live |
| `pages/sba/Dashboard.tsx` | `/sba/dashboard` | SBA application status | — | Live |
| `pages/sba/Admin.tsx` | `/sba/admin` | SBA admin view | — | **⚠ No route guard** |

---

## 3. ADMIN COMPONENTS

| File | Purpose | Used In | Status |
|------|---------|---------|--------|
| `components/admin/AdminShell.tsx` | Layout wrapper (sidebar + auth guard) | 8 admin pages | **Canonical layout** |
| `components/admin/AdminSidebar.tsx` | Navigation sidebar | `AdminShell` | Live |
| `components/admin/AdminKpiGrid.tsx` | KPI metric cards | `AdminCommandCenter` | Live |
| `components/admin/AdminPaymentMetrics.tsx` | Payment metric cards | `AdminCommandCenter` | Live |
| `components/admin/AdminPaymentsTable.tsx` | Payments data table | `AdminPaymentsPage` | Live |
| `components/admin/AdminPaymentReviewModal.tsx` | Payment review dialog | `AdminPaymentsPage` | Live |
| `components/admin/ClientMatchEnginePanel.tsx` | Report→client matching | `AdminUploadReports` | Live |
| `components/admin/ClientPaymentInfo.tsx` | Client payment status | `AdminClients`, `AdminClientEditor` | Live |
| `components/admin/MarketingFunnelCard.tsx` | Funnel metrics | `AdminCommandCenter` | Live |
| `components/admin/RecentReportMatches.tsx` | Recent report matches | `AdminUploadReports` | Live |
| `components/admin/ResultsOverridePanel.tsx` | Override client scores | `AdminClientEdit` | Live |
| `components/AdminPanel.tsx` | Old all-in-one admin dashboard (tabs) | **ORPHAN** | **DEAD** |
| `components/AdminDashboardComponents.tsx` | Old data table dashboard | **ORPHAN** | **DEAD** |
| `components/AdminCRMFixedPanel.tsx` | CRM fixed panel with nav | **ORPHAN** (references orphaned `AdminFileUploader`) | **DEAD** |
| `components/AdminAuditLogPanel.tsx` | Audit log display | **ORPHAN** | **DEAD** |
| `components/AdminMobileNav.tsx` | Mobile nav bar | **ORPHAN** | **DEAD** |
| `components/AdminTaskEngine.tsx` | AI task runner UI | **ORPHAN** | **DEAD** |
| `components/AdminWarBoard.tsx` | Client status war board | `AdminTools` | Live |
| `components/AdminBacklogTools.tsx` | Backlog queue UI | `AdminTools`, `ClientDetailOperations`, `ClientProcessingGrid` | Live |
| `components/AdminAIControlPanel.tsx` | AI control panel | `AdminTools` | Live |
| `components/AutonomousControlPanel.tsx` | Autonomous ops panel | `AdminTools` | Live |
| `components/AutomationControlCenter.tsx` | Automation triggers | `AdminTools` | Live |
| `components/CIPExecutionCenter.tsx` | CIP execution | `AdminTools` | Live |
| `components/AdminReviewQueue.tsx` | Dispute review queue | `AdminTools`, `AdminDisputesPage` | Live |
| `components/AdminClientEditor.tsx` | Inline client editor form | `AdminClients` | Live |
| `components/AdminNotesPanel.tsx` | Per-client notes | `AdminClientEdit` | Live |
| `components/AdminDocumentList.tsx` | Admin doc list | `AdminDocumentsPage` | Live |
| `components/AdminDocumentUploader.tsx` | Document uploader (wraps `FileUploader`) | `ClientPortalLinks` | Live |
| `components/AdminFileUploader.tsx` | File uploader with security | `AdminCRMFixedPanel` (ORPHAN) | **Effectively dead** |
| `components/AdminDailyOps.tsx` | Daily ops panel | *(not found in search — likely ORPHAN)* | **DEAD** |
| `components/CasePipelineDashboard.tsx` | Pipeline view | `AdminTools` | Live |
| `components/BacklogOverview.tsx` | Backlog summary | **ORPHAN** | **DEAD** |
| `components/FlaggedDisputesTable.tsx` | Flagged disputes table | `AdminDisputesPage` | Live |
| `components/BulkDisputeWizard.tsx` | Bulk letter wizard | `AdminDisputesPage` | Live |
| `components/GlobalSearchCommand.tsx` | Global search modal | `App.tsx` | Live |

---

## 4. CLIENT PORTAL COMPONENTS

| File | Purpose | Used In | Status |
|------|---------|---------|--------|
| `components/client/ClientPortalLayout.tsx` | Shell layout + auth redirect | All 9 `/client/*` pages | **Canonical layout** |
| `components/client/ClientPortalSidebar.tsx` | Nav sidebar for client portal | `ClientPortalLayout` | Live |
| `components/ClientPortal.tsx` | Legacy fat portal (all-in-one) | `ClientPortals` (legacy), `AdminClientPreview` | **Legacy** — should be replaced |
| `components/ClientDashboard.tsx` | Props-based dashboard card | **ORPHAN** | **DEAD** |
| `components/ClientLogin.tsx` | Slug-based client login gate | `ClientPortals` (legacy) | **Legacy** |
| `components/ClientDocumentManager.tsx` | Doc manager with `FileUploader` | `ClientPortal` (legacy only) | **Legacy** |
| `components/ClientActivityTimeline.tsx` | Timeline of client events | `ClientPortal`, `AdminClientEdit` | Live |
| `components/ClientNotificationsPanel.tsx` | Notifications + unread count | `ClientPortal`, `client/Messages` | Live |
| `components/ClientAgreementModal.tsx` | Agreement signing modal | `ClientPortal`, `ClientOnboarding` | Live |
| `components/ClientProgressTracker.tsx` | Progress tracker widget | **ORPHAN** | **DEAD** |
| `components/ClientSearchFilters.tsx` | Search filter UI | **ORPHAN** | **DEAD** |
| `components/ClientDetailOperations.tsx` | Per-client ops actions | `ClientProcessingGrid` | Live |
| `components/ClientProcessingGrid.tsx` | Grid of clients in processing | `AdminTools` | Live |
| `components/OnboardingChecklist.tsx` | Onboarding checklist | `ClientPortal` | Live (legacy only) |
| `components/SecureVerificationUpload.tsx` | Secure doc upload | `ClientDashboard`(dead), `client/Documents` | Live |
| `components/CreditReportUpload.tsx` | Credit report uploader | **ORPHAN** | **DEAD** |
| `components/ScorePredictionCard.tsx` | Score prediction display | `ClientPortal` (legacy) | Legacy |
| `components/AIAnalysisViewer.tsx` | AI analysis display | `ClientPortal` (legacy) | Legacy |
| `components/DemoUserBanner.tsx` | Demo user notice | `ClientPortal` (legacy) | Legacy |
| `components/ReceiptGenerator.tsx` | Payment receipt | `ClientPortal` (legacy) | Legacy |
| `components/payments/ClientPaymentWidget.tsx` | Payment summary + link | `client/Payments`, `ClientDashboard`(dead) | Live |
| `components/payments/PaymentHistoryList.tsx` | History table + replace proof | `client/Payments` | Live |
| `components/payments/PaymentStatusBadge.tsx` | Status badge | `PaymentHistoryList`, `ClientPaymentWidget` | Live |
| `components/payments/ReplaceProofDialog.tsx` | Replace proof dialog | `PaymentHistoryList` | Live |
| `components/payments/ApplePayCard.tsx` | Apple Pay option card | `PaymentsPage` (dead page) | **Effectively dead** |
| `components/payments/CashAppCard.tsx` | Cash App option card | `PaymentsPage` (dead page) | **Effectively dead** |

---

## 5. DUPLICATE CLUSTERS

### 5a. Admin Dashboard / Shell

| File | What it does | Recommendation |
|------|-------------|----------------|
| `components/admin/AdminShell.tsx` | Layout wrapper, role guard, sidebar | ✅ **Canonical** |
| `pages/AdminCommandCenter.tsx` | Home route `/admin` | ✅ Keep |
| `components/AdminPanel.tsx` | Old monolithic tabs dashboard, ORPHAN | 🗑 **Deprecate** |
| `components/AdminDashboardComponents.tsx` | Old data-table view, ORPHAN | 🗑 **Deprecate** |
| `components/AdminCRMFixedPanel.tsx` | Older navigation wrapper, ORPHAN | 🗑 **Deprecate** |

### 5b. Client Portal / Dashboard

| File | What it does | Recommendation |
|------|-------------|----------------|
| `components/client/ClientPortalLayout.tsx` | Auth-gated layout for `/client/*` | ✅ **Canonical** |
| `pages/client/Dashboard.tsx` | New canonical dashboard | ✅ Keep |
| `components/ClientPortal.tsx` | Legacy all-in-one portal (1000+ lines) | ⚠️ Keep until `AdminClientPreview` migrated |
| `components/ClientDashboard.tsx` | Props-based stub, ORPHAN | 🗑 **Deprecate** |
| `pages/ClientPortals.tsx` | Legacy slug-based entry, rollback route | 🗑 **Deprecate after slug migration** |
| `pages/ClientPortalLinks.tsx` | Admin portal link manager | ✅ Keep (separate purpose) |

### 5c. File Upload Cluster

| File | What it does | Callers | Recommendation |
|------|-------------|---------|----------------|
| `components/FileUploader.tsx` | Base uploader (file input + progress) | `ClientDocumentManager`, `AdminDocumentUploader`, `AdminCRMFixedPanel` | ✅ **Canonical base** |
| `components/SecureVerificationUpload.tsx` | Client-facing secure upload wrapper | `client/Documents` | ✅ Keep |
| `components/AdminDocumentUploader.tsx` | Admin upload (wraps `FileUploader`) | `ClientPortalLinks` | ✅ Keep |
| `components/AdminFileUploader.tsx` | Alt uploader with `useFileUploadSecurity` | `AdminCRMFixedPanel` (ORPHAN) | 🗑 **Deprecate** |
| `components/CreditReportUpload.tsx` | Specialized credit report uploader | ORPHAN | 🗑 **Deprecate** |
| `components/sba/Uploader.tsx` | SBA-specific uploader | `sba/Documents` | ✅ Keep (scoped) |

### 5d. Authentication Forms

| File | What it does | Route/Caller | Recommendation |
|------|-------------|--------------|----------------|
| `components/LoginForm.tsx` | Email/password login form | `pages/Index` | ✅ Keep |
| `components/RegisterForm.tsx` | Registration form | `pages/Index` | ✅ Keep |
| `pages/AdminLogin.tsx` | Admin-specific login page | `/admin/login` | ✅ Keep (separate UX) |
| `components/ClientLogin.tsx` | Slug-based client auth gate | `ClientPortals` (legacy) | 🗑 **Deprecate with slug system** |

### 5e. Payments

| File | What it does | Status | Recommendation |
|------|-------------|--------|----------------|
| `pages/client/Payments.tsx` | Canonical payment page | Live at `/client/payments` | ✅ Keep |
| `pages/PaymentsPage.tsx` | Old standalone payment form | **No route — DEAD** | 🗑 **Delete** |
| `components/payments/ClientPaymentWidget.tsx` | Summary widget | Used in `client/Payments` | ✅ Keep |
| `components/payments/ApplePayCard.tsx` | Apple Pay option | Only in dead `PaymentsPage` | 🗑 Move into `ClientPaymentWidget` or delete |
| `components/payments/CashAppCard.tsx` | Cash App option | Only in dead `PaymentsPage` | 🗑 Move into `ClientPaymentWidget` or delete |

---

## 6. HOOKS

| Hook | Purpose | Callers | Status |
|------|---------|---------|--------|
| `hooks/useAuth.tsx` | Auth state + sign in/out (`AuthProvider`) | 35+ files | Live |
| `hooks/useRoles.tsx` | Role fetch (`admin`/`client`) | 14 files | Live |
| `hooks/useMembership.tsx` | Membership tier fetch | `App`, `Index`, `MembershipPricing`, `ProtectedRoute`, `NavigationHeader` | Live |
| `hooks/useClientPortalData.ts` | Fetch aggregated client metrics | `client/Dashboard`, `client/Results` | Live |
| `hooks/usePayments.ts` | Payment CRUD (submit, fetch, replace proof) | `client/Payments`, `PaymentsPage`(dead), `useAdminPayments`, `ClientPaymentWidget`, `PaymentHistoryList` | Live |
| `hooks/useAdminPayments.ts` | Admin payment fetch/approve/reject | `AdminPaymentsPage`, `AdminPaymentsTable`, `AdminPaymentReviewModal`, `AdminPaymentMetrics` | Live |
| `hooks/useAdminClientDocuments.ts` | Admin per-client doc fetch | `AdminDocumentList` | Live |
| `hooks/useAdminMetrics.ts` | KPI metrics fetch | `AdminKpiGrid` | Live |
| `hooks/useAuditLog.tsx` | Audit log write helper | `ClientOnboarding` | Live |
| `hooks/useClientAgreement.tsx` | Agreement fetch + sign | `ClientPortal`, `ClientOnboarding` | Live |
| `hooks/useFileUploadSecurity.tsx` | File type/size validation | `AdminFileUploader`(dead), `ClientOnboarding` | Partially live |
| `hooks/useRealtimeRefresh.tsx` | Supabase realtime subscription | `AutomationControlCenter`, `ClientProcessingGrid`, `AdminReviewQueue`, `CIPExecutionCenter`, `AdminBacklogTools`, `AutonomousControlPanel` | Live |
| `hooks/use-toast.ts` | Toast helper | Dozens of components | Live |
| `hooks/use-mobile.tsx` | Mobile breakpoint detection | `AdminMobileNav`(dead), sidebar | Partially live |
| `hooks/useDebounce.tsx` | Debounce utility | **ORPHAN** (0 callers found) | **DEAD** |
| `hooks/useLocalStorage.tsx` | localStorage wrapper | **ORPHAN** (0 callers found) | **DEAD** |

---

## 7. DEAD CODE

### Pages (no route)
| File | Reason dead |
|------|------------|
| `pages/ComingSoon.tsx` | Never imported in `App.tsx` |
| `pages/PaymentsPage.tsx` | Not routed; `/payments` redirects to `/client/payments` |

### Components (zero imports outside self)
| File | Notes |
|------|-------|
| `components/AdminPanel.tsx` | Superseded by `AdminCommandCenter` + `AdminShell` |
| `components/AdminDashboardComponents.tsx` | Superseded by admin/ components |
| `components/AdminCRMFixedPanel.tsx` | Superseded by `AdminShell` |
| `components/AdminAuditLogPanel.tsx` | No consumers |
| `components/AdminMobileNav.tsx` | Mobile nav unused |
| `components/AdminTaskEngine.tsx` | Not wired to any page |
| `components/AdminDailyOps.tsx` | No consumers found |
| `components/ClientDashboard.tsx` | Superseded by `pages/client/Dashboard` |
| `components/ClientProgressTracker.tsx` | No consumers |
| `components/ClientSearchFilters.tsx` | No consumers |
| `components/CreditReportUpload.tsx` | Superseded by `SecureVerificationUpload` |
| `components/BacklogOverview.tsx` | No consumers |
| `components/ChatHistoryPanel.tsx` | No consumers |
| `components/CreditScanSummary.tsx` | No consumers |
| `components/DigitalSignature.tsx` | No consumers |
| `components/ImageOptimizer.tsx` | No consumers |
| `components/MailingBundleDownloader.tsx` | No consumers |
| `components/MailingLabelGenerator.tsx` | No consumers |
| `components/OpenAITestPanel.tsx` | Dev panel, not wired |
| `components/PlaidBankLink.tsx` | Not wired |
| `components/UnlinkedAuthAccounts.tsx` | No consumers |
| `components/ConsultationModal.tsx` | No consumers |
| `components/BackToDashboard.tsx` | Superseded by `BackButton` |
| `components/Breadcrumbs.tsx` | No consumers |
| `components/AURequestModal.tsx` | No consumers |

### Hooks (zero callers)
| File | Notes |
|------|-------|
| `hooks/useDebounce.tsx` | Never imported |
| `hooks/useLocalStorage.tsx` | Never imported |

---

## 8. BROKEN / SUSPECT

### `console.error` sites (non-error-boundary, non-test)

| File | Line(s) | Description |
|------|---------|-------------|
| `src/lib/payments.ts` | 106 | `createSignedUrl` error swallowed |
| `src/lib/documentUtils.ts` | 43 | Signed URL error logged only |
| `src/services/disputeWorkflow.ts` | 145 | Transition log failure swallowed |
| `src/hooks/useAdminClientDocuments.ts` | 188 | Fetch failure swallowed |
| `src/hooks/useRoles.tsx` | 40, 46 | Role fetch errors not surfaced to UI |
| `src/hooks/useMembership.tsx` | 51, 74 | Membership errors swallowed |
| `src/components/BulkDisputeWizard.tsx` | 105, 152, 191, 256, 267, 277 | 6 error paths — no user feedback |
| `src/components/ClientAgreementModal.tsx` | 289 | Signing error swallowed |
| `src/components/AdminFileUploader.tsx` | 193 | Upload error swallowed |
| `src/components/ClientLogin.tsx` | 65 | Auth error swallowed |

### Security / Logic Concerns

| Issue | Location | Details |
|-------|----------|---------|
| **Admin routes have no router-level guard** | `App.tsx:86-157` | `<ProtectedRoute>` imported but never used. All routes are public at router layer. |
| **`/sba/admin` has no guard** | `App.tsx:95` | No `useRoles` check in `SBAAdmin` page |
| **`/admin/settings` uses `isAdmin` from `useAuth`** | `AdminSettings.tsx:19` | Other pages use `useRoles`; inconsistent guard |
| **`/client/:clientSlug` drops slug** | `App.tsx:153` | `Navigate to="/client/dashboard"` loses slug; `ClientPortals` rollback route unreachable via normal flow |
| **Inline admin guards in components** | All admin pages | Each page reimplements `useEffect` + `navigate('/');` — no DRY wrapper |

### TODO / FIXME

No `TODO` or `FIXME` comments found in non-test source files (rg search returned 0 results outside test files).

### Components with no-op patterns
| Component | Issue |
|-----------|-------|
| `pages/client/Settings.tsx` | Read-only profile display — no edit capability, misleading "Settings" label |
| `components/ProtectedRoute.tsx` | Imported in `App.tsx:11`, **never instantiated** in JSX |

---

*Report written to `/dev-server/docs/audit/_stream-a-frontend.md`*
