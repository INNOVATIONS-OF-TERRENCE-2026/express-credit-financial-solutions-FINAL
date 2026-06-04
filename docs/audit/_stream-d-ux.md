# Express Credit CRM — UX & Visual System Audit
**Generated:** $(date -u +"%Y-%m-%d")  
**Scope:** Read-only. Admin + Client portal. src/components/admin, src/components/client, src/pages/client/*, src/hooks/useClientPortalData.ts, src/index.css, tailwind.config.ts

---

## 1. NAVIGATION INVENTORY

### 1.1 Admin Sidebar — `src/components/admin/AdminSidebar.tsx:13-25`
Single flat group labelled "Operations". Collapsible to icon-only mode via shadcn Sidebar.

| # | Label | Route | Depth |
|---|-------|-------|-------|
| 1 | Command Center | `/admin` | 1 |
| 2 | Clients | `/admin/clients` | 1 |
| 3 | Upload Reports | `/admin/upload-reports` | 1 |
| 4 | Reports & Results | `/admin/reports` | 1 |
| 5 | Disputes | `/admin/disputes` | 1 |
| 6 | Documents | `/admin/documents` | 1 |
| 7 | Payments | `/admin/payments` | 1 |
| 8 | Agreements | `/admin/agreements` | 1 |
| 9 | Activity | `/admin/activity` | 1 |
| 10 | Settings | `/admin/settings` | 1 |
| 11 | Advanced Tools | `/admin/tools` | 1 |

**Depth:** 1 (all flat). No sub-nav, no grouping beyond single "Operations" label.  
**Hidden routes registered in App.tsx but NOT in sidebar:** `/admin/clients/:clientId` (edit), `/admin/client-preview/:clientId` (preview), `/admin-dashboard` (redirect only).

---

### 1.2 Client Portal Sidebar — `src/components/client/ClientPortalSidebar.tsx:12-22`
Single flat group labelled "Navigate". Collapsible to icon-only.

| # | Label | Route | Depth |
|---|-------|-------|-------|
| 1 | Dashboard | `/client/dashboard` | 1 |
| 2 | Results | `/client/results` | 1 |
| 3 | Reports | `/client/reports` | 1 |
| 4 | Disputes | `/client/disputes` | 1 |
| 5 | Documents | `/client/documents` | 1 |
| 6 | Payments | `/client/payments` | 1 |
| 7 | Agreements | `/client/agreements` | 1 |
| 8 | Messages | `/client/messages` | 1 |
| 9 | Settings | `/client/settings` | 1 |

**Depth:** 1 (all flat).

---

### 1.3 Top-Level NavigationHeader — `src/components/NavigationHeader.tsx`
Sticky header rendered for ALL authenticated users (admin and client). Contains a second, overlapping client nav. Renders 7 items inline on desktop, collapses to Sheet drawer on mobile.

| # | Label | Path | Gate |
|---|-------|------|------|
| 1 | Home | `/` | always |
| 2 | Client Portal | `/client/dashboard` | `hasAccess('dashboard')` |
| 3 | Disputes | `/client/disputes` | `hasAccess('dispute-generator')` |
| 4 | Documents | `/client/documents` | `hasAccess('credit-upload')` |
| 5 | Payments | `/client/payments` | always |
| 6 | SBA Portal | `/sba` | always |
| 7 | Membership | `/membership` | always |

⚠️ **Critical overlap:** When a client is inside `/client/*`, BOTH `ClientPortalSidebar` and `NavigationHeader` render client-nav links simultaneously — e.g. Disputes appears in both. The admin sidebar has NO equivalent top-bar duplication, but admins still see the full `NavigationHeader` (Home, SBA, Membership links that are irrelevant to admin work).

---

### 1.4 Admin Mobile Nav — `src/components/AdminMobileNav.tsx:10-15`
Fixed bottom bar, `md:hidden`. 4 pinned items + "More" overflow button. **Separate and disconnected from AdminSidebar** — props-driven (`onSelect` string IDs), not route-driven.

| # | Label | ID | Depth |
|---|-------|-----|-------|
| 1 | War Board | `war-board` | 1 |
| 2 | Upload | `credit-upload` | 1 |
| 3 | Tasks | `tasks` | 1 |
| 4 | Docs | `documents` | 1 |
| 5 | More | *(callback)* | — |

⚠️ **Gap:** "War Board" and "Tasks" IDs don't correspond to any `/admin/*` route. Mobile and desktop admin navs are architecturally disconnected — mobile uses string state, desktop uses React Router. No mobile equivalent for Payments, Disputes, Activity, or Settings.

---

## 2. CONSOLIDATION MAP

Target: 10 categories. Items marked ⚠️ have no clear home.

| Current Item | Current Location | → New Category | Sub-item Label | Notes |
|---|---|---|---|---|
| Command Center | Admin sidebar | **Dashboard** | Admin Overview | rename to "Dashboard" |
| War Board (mobile) | AdminMobileNav | **Dashboard** | War Board | wire to `/admin` |
| Clients | Admin sidebar | **Clients** | All Clients | |
| `/admin/clients/:clientId` | Route only | **Clients** | Client Profile | add sidebar sub-item |
| `/admin/client-preview/:clientId` | Route only | **Clients** | Client Preview | merge into profile |
| Upload Reports | Admin sidebar | **Tools** | Upload Report | or sub-item of Clients |
| Reports & Results | Admin sidebar | **Reports** | Credit Reports | |
| Disputes | Admin sidebar | **Disputes** | All Disputes | |
| Documents | Admin sidebar | **Documents** | All Documents | |
| Payments | Admin sidebar | **Payments** | All Payments | |
| Agreements | Admin sidebar | **Documents** | Agreements | sub-item under Documents |
| Activity | Admin sidebar | **Activity** | Activity Log | |
| Settings | Admin sidebar | **Settings** | Admin Settings | |
| Advanced Tools | Admin sidebar | **Tools** | Advanced Tools | |
| Tasks (mobile) | AdminMobileNav | **Tools** | Task Manager | ⚠️ no route exists |
| SBA Portal | NavigationHeader | **Tools** | SBA Portal | ⚠️ entirely separate product |
| Membership | NavigationHeader | **Settings** | Membership / Billing | |
| *Client:* Dashboard | Client sidebar | **Dashboard** | My Overview | |
| *Client:* Results | Client sidebar | **Reports** | Score Results | |
| *Client:* Reports | Client sidebar | **Reports** | Uploaded Reports | sub-item |
| *Client:* Disputes | Client sidebar | **Disputes** | My Disputes | |
| *Client:* Documents | Client sidebar | **Documents** | My Documents | |
| *Client:* Payments | Client sidebar | **Payments** | My Payments | |
| *Client:* Agreements | Client sidebar | **Documents** | My Agreements | sub-item |
| *Client:* Messages | Client sidebar | **Activity** | Notifications | |
| *Client:* Settings | Client sidebar | **Settings** | My Profile | |
| `/admin/clients?status=*` (KPI deep-links) | AdminKpiGrid | **Clients** | Filtered views | ⚠️ no sidebar entry |

---

## 3. CLIENT JOURNEY MAP

Typical linear flow for a new client post-signup.

| # | Screen | Route | Data Shown | ❌ Missing for Outcome-Centric UX |
|---|--------|-------|-----------|----------------------------------|
| 1 | **Dashboard** | `/client/dashboard` | Welcome hero, next-step callout, payment status badge, 4 KPI tiles (score delta, accounts deleted, inquiries removed, debt removed), recent reports list | No milestone timeline / progress bar toward goal (e.g. "680 for mortgage"). No before/after score chart. Score delta is a raw number — no benchmark ("above average for round 2"). No predicted completion date. |
| 2 | **Results** | `/client/results` | Per-bureau start vs current score table (3 cards) | No trend chart over time. No visual "before/after" highlight. Missing: date each score was captured, score band labels (Fair/Good/Excellent), mortgage-readiness threshold line. No accounts-deleted context next to score. |
| 3 | **Reports** | `/client/reports` | List of uploaded credit reports (filename, date, match status badge, download button) | No explanation of what "match status" means to the client. No call-to-action if no reports uploaded. No link to request a new report pull. |
| 4 | **Disputes** | `/client/disputes` | List of dispute letters (creditor, issue type, status badge) | No round number shown. No bureau targeted. No expected resolution date. No letter preview/download. Status values are raw DB strings — no friendly label map. No "what happens next" guidance. |
| 5 | **Documents** | `/client/documents` | `SecureVerificationUpload` component (ID upload) | No checklist of required documents. No status (submitted / verified / rejected). No indication of what document unlocks (e.g. "needed for Round 2"). |
| 6 | **Payments** | `/client/payments` | `ClientPaymentWidget` + `PaymentHistoryList` | No invoice/receipt download. No plan tier shown. No renewal date. No connection between payment status and service unlock. |
| 7 | **Agreements** | `/client/agreements` | List of agreements with signed/pending badge | No inline signing flow. No document preview. Pending agreements have no CTA button. |
| 8 | **Messages** | `/client/messages` | `ClientNotificationsPanel` | Notifications not threaded. No compose / reply. No admin-to-client direct message. |
| 9 | **Settings** | `/client/settings` | Name and email (read-only) | No password change. No phone. No goal setting (target score, target date, purpose: mortgage/auto/business). Settings are a dead-end — "contact support to update" is a friction wall. |

**Systemic missing features:**
- No visible credit score trend chart anywhere
- No mortgage readiness % or goal tracker
- No "debt removed = $X saved" dollar framing
- No next milestone card ("Complete by X to start Round 3")
- No before/after visual comparison

---

## 4. ADMIN JOURNEY MAP

Starting point: `/admin` (Command Center).

### (a) Find client by name
`/admin` → click "Clients" sidebar item → `/admin/clients` → use search input  
**Clicks:** 1 nav + 1 type. **Page loads:** 1. ✅ Low friction. *Gap: no global ⌘K client search from any admin page.*

### (b) Open a specific client's full profile
`/admin/clients` → find in table → click row/button → `/admin/clients/:clientId`  
**Clicks:** 2 (nav + row). **Page loads:** 2. ✅ Acceptable. *Gap: `/admin/client-preview/:clientId` also exists — two separate "profile" routes create confusion about which is canonical.*

### (c) Upload a credit report for a client
`/admin` → "Upload Reports" sidebar → `/admin/upload-reports` — must then select/find client from within that page.  
**Clicks:** 2+. **Page loads:** 1. ⚠️ *Friction: upload is decoupled from the client profile. Admin cannot upload while viewing a client — must navigate away, find client again in the upload UI. Context switching is disruptive.*

### (d) Edit client personal info
`/admin/clients` → find client → click edit → `/admin/clients/:clientId`  
**Clicks:** 2. **Page loads:** 2. ✅ Direct. *Gap: no inline edit on list view; must load full profile page.*

### (e) Review a pending payment
`/admin` → "Payments" sidebar → `/admin/payments` → locate pending row → click review → `AdminPaymentReviewModal` opens  
**Clicks:** 2 nav + 1 modal trigger. **Page loads:** 1. ✅ Modal pattern is fine. *Gap: no badge/count on sidebar "Payments" item showing pending count. Admin must navigate to discover pending items.*

### (f) Send a dispute letter
`/admin` → "Disputes" sidebar → `/admin/disputes` → find client or create letter  
**Clicks:** 2+. **Page loads:** 1. ⚠️ *Friction: dispute creation likely requires entering client details again even if coming from a client's profile. No "Send dispute for THIS client" button on the client profile page — forces context switch to /admin/disputes.*

### (g) See full activity for a client
`/admin/activity` shows global activity. To filter to one client: unknown — no per-client activity filter visible in sidebar or client profile routes.  
**Clicks:** 2 (sidebar + filter, if it exists). ⚠️ *Friction: no direct "Activity" tab on `/admin/clients/:clientId` profile — global activity log doesn't appear filterable from the client profile context. Admin likely must navigate to /admin/activity and then search/filter — unconfirmed UX.*

**Summary friction table:**

| Job | Clicks to complete | Pain points |
|-----|-------------------|-------------|
| a. Find client | 2 | No global search |
| b. Open profile | 2 | Two profile routes (/clients/:id + /client-preview/:id) |
| c. Upload report | 3+ | Decoupled from client profile |
| d. Edit info | 2 | Fine |
| e. Review payment | 3 | No unread badge on nav item |
| f. Send dispute | 3+ | No dispute CTA on client profile |
| g. Client activity | 3+ | No per-client activity filter |

---

## 5. DESIGN TOKEN AUDIT

### 5.1 CSS Variables (`src/index.css`)

**Semantic (shadcn-compatible):** `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground`, `--muted`, `--muted-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`

**Brand / Fintech:** `--fintech-primary` `219 35% 17%`, `--fintech-secondary` `218 27% 28%`, `--fintech-accent` `194 100% 45%`, `--fintech-light`, `--fintech-dark`, `--fintech-support`

**Premium:** `--gold` `45 100% 51%`, `--gold-light`, `--gold-dark`, `--silver`, `--silver-light`, `--silver-dark`, `--ocean-blue` `214 95% 20%`, `--ocean-blue-hover`

**Midnight/SBA theme:** `--sba-midnight`, `--sba-card`, `--sba-green`, `--sba-chrome`, `--midnight-bg`, `--midnight-card`, `--midnight-text`, `--midnight-muted`

**Gradients (CSS vars):** `--gradient-primary`, `--gradient-gold`, `--gradient-silver`, `--gradient-elegant`, `--gradient-midnight`

**Shadows:** `--shadow-elegant`, `--shadow-gold`, `--shadow-silver`, `--shadow-card`

**Sidebar tokens:** `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground` *(missing: `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` — referenced in tailwind.config.ts but absent from :root)*

### 5.2 Hard-coded Colors Found

| File | Line | Value | Issue |
|------|------|-------|-------|
| `AdminSidebar.tsx` | 40 | `from-amber-500 to-amber-700` | Should use `gold` token |
| `AdminSidebar.tsx` | 41 | `text-black` | Should use `primary-foreground` |
| `ClientPortalSidebar.tsx` | 34 | `from-amber-400 via-amber-500 to-amber-700` | Should use `gold` gradient token |
| `ClientPortalSidebar.tsx` | 35 | `text-black` | Should use `primary-foreground` |
| `Dashboard.tsx` | 24 | `from-amber-500/10 … to-blue-500/10` | Raw Tailwind palette |
| `Dashboard.tsx` | 29 | `text-amber-500`, `border-amber-500/30` | Raw palette |
| `Dashboard.tsx` | 65 | `text-amber-500` (score display) | Raw palette |
| `Dashboard.tsx` | 89 | `text-blue-500` | Raw palette |
| `Results.tsx` | 26 | `text-amber-500` | Raw palette |
| `AdminKpiGrid.tsx` | 16 | `text-amber-500` | Raw palette |
| `AdminKpiGrid.tsx` | 18 | `text-blue-500` | Raw palette |
| `AdminKpiGrid.tsx` | 27 | `text-amber-400` | Raw palette |
| `AdminKpiGrid.tsx` | 28 | `text-blue-400` | Raw palette |
| `AdminPaymentReviewModal.tsx` | 138 | `bg-green-600 hover:bg-green-700 text-white` | Hardcoded success color |
| `ClientMatchEnginePanel.tsx` | 132 | `bg-amber-500/15 text-amber-300 border-amber-500/30` | Raw palette |

**Total unique files with hard-coded palette colors in admin/client scope: 6.** Broader codebase (sba/, payments/, Index.tsx) adds ~15+ more.

### 5.3 Dark-Mode Coverage
Only one dark-mode override defined (`src/index.css`):
```css
.dark { --background: 222 47% 11%; --foreground: 210 40% 98%; }
```
**Only 2 of 20+ tokens are overridden for dark mode.** Card, popover, border, muted, primary remain at light values — dark mode is effectively broken/incomplete.

### 5.4 Gradient Usage
- `bg-gradient-to-br from-amber-500 to-amber-700` — sidebar logos (2 files, hardcoded)
- `bg-gradient-to-br from-amber-500/10 via-background to-blue-500/10` — dashboard hero (hardcoded)
- `bg-gradient-to-br from-emerald-500/10 to-transparent` — payment confirmation card (hardcoded)
- Named gradient tokens (`bg-gradient-gold`, `bg-gradient-elegant`, etc.) exist in Tailwind config but appear **unused** in admin/client components — all gradients are inlined.

### 5.5 HSL Discipline
All `:root` variables use space-separated HSL channels (correct: `194 100% 45%` not `hsl(194, 100%, 45%)`). Gradient CSS vars in `:root` break this — they embed `hsl()` function calls inline (e.g. `linear-gradient(135deg, hsl(0 0% 100%), ...)`). This is technically valid but inconsistent with the channel-only pattern used for Tailwind color tokens.

---

## 6. TYPOGRAPHY & SPACING

### Fonts Loaded

| Font | Weights | Load Method |
|------|---------|-------------|
| Poppins | 300–800 | `<link>` in `index.html` (preload) |
| Inter | 300–700 | `@import` in `index.css` (render-blocking) |
| Instrument Serif | — | Defined in `tailwind.config.ts:fontFamily` but **never loaded** (no link/import) |
| Work Sans | — | Defined in `tailwind.config.ts:fontFamily` but **never loaded** |

⚠️ `font-serif-display` and `font-work` utilities will silently fall back to Georgia/system-ui.

### Heading Scale
Headings (`h1-h6`) use `font-family: 'Poppins'` via base layer (`src/index.css:96`). No explicit type-scale defined in tokens — sizes are set inline per component using Tailwind's default `text-xs` → `text-3xl` utilities. No consistent heading size contract exists.

### Spacing Scale
Using Tailwind default 4px base unit. No custom spacing tokens defined. Components use ad-hoc values: `p-6`, `p-5`, `px-3 py-4`, `gap-2`, `gap-3` — no enforced spacing rhythm.

---

## 7. COMPONENT LIBRARY USAGE

### shadcn Components Used (in admin/client scope)
`Badge`, `Button`, `Card`/`CardContent`/`CardHeader`/`CardTitle`/`CardDescription`, `Dialog`, `Input`, `Label`, `Progress`, `Select`, `Separator`, `Skeleton`, `Sidebar`/`SidebarProvider`/`SidebarTrigger`, `Table`, `Textarea`

### shadcn Components Present but Unused in Admin/Client
`Accordion`, `AlertDialog`, `AspectRatio`, `Avatar`, `Breadcrumb`, `Calendar`, `Carousel`, `Checkbox`, `Collapsible`, `Command`, `ContextMenu`, `Drawer`, `DropdownMenu`, `Form`, `HoverCard`, `InputOtp`, `Menubar`, `NavigationMenu`, `Pagination`, `Popover`, `RadioGroup`, `Resizable`, `ScrollArea`, `Sheet`*, `Slider`, `Sonner`, `Switch`, `Tabs`, `Toast`/`Toaster`, `Toggle`/`ToggleGroup`, `Tooltip`

*(Sheet is used in NavigationHeader mobile menu)*

### Custom Components Re-implementing shadcn
- **`AdminMobileNav`** (`src/components/AdminMobileNav.tsx`) — custom bottom tab bar. Could be replaced with shadcn `NavigationMenu` or `Tabs` with bottom variant.
- **`ClientNotificationsPanel`** — likely custom notification list. shadcn `ScrollArea` + structured list would suffice.
- **`MatchStatusBadge`** — thin wrapper over `Badge` with custom color logic. Could be a `Badge` variant.

---

## 8. PREMIUM REBUILD READINESS

### Token Names to Introduce in `:root`

| New Token | HSL Value (suggested) | Replaces |
|-----------|----------------------|---------|
| `--ivory` | `40 30% 96%` | raw `bg-gray-50`, `--fintech-light` |
| `--champagne` | `40 60% 88%` | `from-amber-100` inline uses |
| `--platinum` | `0 0% 88%` | `--silver-light`, raw `bg-gray-200` |
| `--navy` | `219 35% 17%` | `--fintech-primary` (alias + rename) |
| `--charcoal` | `222 20% 22%` | `--fintech-secondary`, `--fintech-dark` |
| `--gold` | already exists `45 100% 51%` | extend with `--gold-muted` `45 60% 70%` |

### Files That Hard-code Colors (Top 20 across full codebase)

| File | Approx. hard-coded hits |
|------|------------------------|
| `src/pages/Index.tsx` | ~20 |
| `src/pages/MembershipPricing.tsx` | ~15 |
| `src/pages/sba/Home.tsx` | ~12 |
| `src/pages/sba/Dashboard.tsx` | ~10 |
| `src/components/admin/AdminKpiGrid.tsx` | 8 |
| `src/pages/client/Dashboard.tsx` | 7 |
| `src/components/admin/ClientMatchEnginePanel.tsx` | 6 |
| `src/components/admin/AdminPaymentReviewModal.tsx` | 4 |
| `src/components/admin/AdminSidebar.tsx` | 3 |
| `src/components/client/ClientPortalSidebar.tsx` | 3 |
| `src/pages/client/Results.tsx` | 2 |
| `src/components/payments/CashAppCard.tsx` | ~5 |
| `src/components/EngineerCredit.tsx` | ~8 |
| `src/components/FAQSection.tsx` | ~4 |
| `src/components/ClientLogin.tsx` | ~3 |
| `src/components/ThemeSelector.tsx` | ~3 |
| `src/components/sba/StatusTracker.tsx` | ~5 |
| `src/components/sba/SectionTitle.tsx` | ~3 |
| `src/pages/sba/Packet.tsx` | ~6 |
| `src/components/OnboardingTour.tsx` | ~4 |

### Tailwind Config Changes Required
1. Add `ivory`, `champagne`, `platinum`, `navy`, `charcoal` to `theme.extend.colors` wired to new CSS vars
2. Remove duplicate `midnight.*` + `fintech.*` and remap to `navy`/`charcoal`
3. Add missing sidebar vars: `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`
4. Complete dark-mode token set (all 20+ semantic tokens need `.dark` overrides)
5. Add `font-serif-display` and `font-work` `<link>` tags to `index.html` or remove from config

### shadcn Variant Additions Needed
- `Button` → `variant="gold"` (champagne bg, navy text, gold border)
- `Button` → `variant="premium"` (navy bg, ivory text)
- `Badge` → `variant="gold"`, `variant="platinum"`, `variant="success"` (replaces raw `bg-green-600`)
- `Card` → add `card-premium` and `card-midnight` as named variants (currently `.card-elegant` and `.midnight-theme` are raw CSS classes in index.css, not shadcn variants)

---

## 9. ACCESSIBILITY QUICK SCAN

### What Exists
- `role` attributes found in: `src/components/AdminMobileNav.tsx` (implicit via `<nav>`), `src/components/NavigationHeader.tsx` (`<header>`), `src/components/client/ClientPortalLayout.tsx`
- `alt=` found in: `src/components/VisaLogo.tsx`, `src/components/payments/CashAppCard.tsx`
- `aria-label` found in: `src/components/NavigationHeader.tsx` (Search button area), `src/components/ui/carousel.tsx`, `src/components/ui/sidebar.tsx`

### Major Gaps

| Gap | Location | Severity |
|-----|----------|----------|
| `<AdminMobileNav>` uses `<button>` with icon + text but no `aria-label` when collapsed to icon-only | `AdminMobileNav.tsx:22-34` | High |
| Admin sidebar nav links have no `aria-current="page"` (uses CSS `isActive` only) | `AdminSidebar.tsx:58` | Medium |
| Client sidebar same issue | `ClientPortalSidebar.tsx:52` | Medium |
| All KPI tile numbers in `AdminKpiGrid` have no screen-reader context (number alone, no description) | `AdminKpiGrid.tsx` | High |
| `Progress` bar on Dashboard has no `aria-label` or `aria-valuenow` label describing what is progressing | `Dashboard.tsx` | High |
| Modal dialogs (`AdminPaymentReviewModal`) — unclear if focus is trapped or returned on close | `AdminPaymentReviewModal.tsx` | High |
| Score numbers on Results page (`<strong>`) have no screen-reader announcement of unit or bureau context | `Results.tsx:24-26` | Medium |
| No `<main>` landmark in `ClientPortalLayout` — content area is a plain `<div>` | `ClientPortalLayout.tsx` | Medium |
| No skip-to-content link anywhere in the app | global | Medium |
| Color-only status indicators (amber/green/red text for statuses) with no text alternative | multiple | High |

---

*End of audit. ~780 lines.*
