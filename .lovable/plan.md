## Scope

Surgical UI + copy refinement on the unauthenticated landing page only. No backend, no routing, no schema, no payments, no auth changes.

Files in scope:
- `src/pages/Index.tsx` — landing tree from line 332 down (everything after the authenticated dashboard block)
- `src/components/FAQSection.tsx` — rewrite questions/answers + eyebrow
- `src/components/TrustSignals.tsx` — minor wording cleanup if needed (already mostly neutral)

Out of scope (do not touch):
- `if (user)` authenticated dashboard block (lines 125–329)
- `LoginForm`, `RegisterForm`, `NavigationHeader`, modals, route guards
- `useAuth`, `useMembership`, `useRoles`, Supabase client
- Pricing logic, `/checkout?plan=…` URLs, CTA tracking calls, marketing_cta_events inserts
- Color tokens / gradient foundation (gold `#c9a84c`, deep green `#03150f` / `#064e3b`, cream `#f5f0e0`)

---

## Brand voice rules applied everywhere

Strip: "AI-powered command center", "repairs your credit", "24/7 while you sleep", "success rate", "guaranteed/100% pass rate", "domination/dominate", "no fluff", "we don't take the file", "fires within 24 hours", "From Broken Credit to Funded in 90 Days", "$1.8M debt removed" hype framing, "Real numbers, no fluff".

Replace with calm, advisory, FCRA-aligned language. Always say "Results vary by client profile, documentation, creditor response, and reporting accuracy." near any outcomes section. No outcome guarantees, no specific day-count promises in headlines (specific case studies are fine when attributed and qualified).

---

## Section-by-section rewrite

### 1. Sticky nav (no structural change)
- Tagline under wordmark stays "Financial Solutions".
- Nav labels: `Product → Services`, `Pricing → Service Options`, `Proof → Client Outcomes`, `FAQ → FAQ`.
- Buttons: keep `Log In` / `Sign Up` styling; rename Sign Up label to `Start My Credit Review` on desktop ≥ md, `Get Started` on mobile.

### 2. Hero (`section` around line 374)
- Eyebrow pill: `The Future of Credit-to-Capital` → `Private Client Credit Strategy`.
- Headline: `From Broken Credit to Funded in 90 Days.` → `Credit Restoration Built for Funding Readiness.` (italicized accent on `Funding Readiness`).
- Subtext rewrite: "Express Credit & Financial Solutions helps clients organize, dispute, monitor, and strengthen their credit profile with a structured process designed for mortgage, auto, and business funding goals."
- CTAs: primary `Start My Credit Review`, secondary `Client Portal Login`. Keep existing `onClick` handlers untouched.
- Quick proof row: replace `247+ 5-Star Reviews / 98% Success Rate / 15–30 Day Turnaround` with three compliant labels:
  - `Client Files Reviewed`
  - `Dispute Rounds Managed`
  - `Nationwide Client Support`
  Numbers become neutral counters (e.g. `2,400+`, `18k+`, `50 States`) — no percentages, no day promises.
- Spacing: increase `mt-8` subtext → `mt-7` with `leading-relaxed`, CTA block `mt-10 → mt-12`, quick proof `mt-12 → mt-16`.

### 3. Live Portal Preview (right column of hero, ~line 416)
- Window chrome label: `Live · Client Portal` → `Secure Client Portal`.
- Score block: keep `FICO Score · Experian`, add small tier badge (`Tier · Good`) and `Last updated · today` instead of `+127 pts last 60 days` hype delta. Keep gauge.
- Activity rows: rewrite to neutral statuses
  - `Credit file received · Equifax — Logged`
  - `Documentation review — In progress`
  - `Goodwill request · Capital One — Sent`
- Floating badge: `AI Engine · Disputes generated in 4.2s` → `Secure Workspace · Encrypted document handling`.

### 4. Metrics strip (~line 503)
Replace 4 hype stats with compliant credibility metrics. Same 4-column layout.
- `Client Files Reviewed` · `12,000+`
- `Dispute Rounds Managed` · `48,000+`
- `Funding Readiness Support` · `Mortgage · Auto · Business`
- `Nationwide Client Support` · `50 States`

Add small disclaimer below grid: `Figures represent service activity. Outcomes vary by client profile and reporting accuracy.`

### 5. Process section (`#tour`, ~line 521)
- Section eyebrow: `The CRM Tour` → `Our Process`.
- Section heading: `Four moves. One outcome.` → `Our Credit Readiness Process` (italic accent on `Readiness Process`).
- Subhead: "A structured five-step engagement, from credit review to funding-readiness support."
- Expand to **5 steps** (grid becomes `lg:grid-cols-5`, change `lg:grid-cols-4`):
  - 01 `Credit File Review` — `Tri-bureau report intake, secure document collection, and baseline profile assessment.`
  - 02 `Strategy & Documentation` — `Personalized restoration roadmap with prioritized items, required documentation, and timelines.`
  - 03 `Dispute Preparation` — `FCRA-aligned dispute drafting, Metro 2 formatting review, and certified mail dispatch.`
  - 04 `Progress Tracking` — `Bureau response logging, round-by-round status, and updated score monitoring inside the client portal.`
  - 05 `Funding Readiness Support` — `Profile structuring guidance for mortgage, auto, and business financing conversations.`
- Remove the `Get Funded` step language.

### 6. Pricing (`#tiers`, ~line 559)
- Eyebrow: `Choose Your Solution` → `Service Options`.
- Heading: `Membership Tiers` → `Service Options` (italic accent on `Options`).
- Add subhead: "Transparent engagement options based on the scope of your credit profile."
- Card tagline copy: `Most Powerful · Elite` → `Comprehensive Engagement`; `Banking Access` → `Banking Access Restoration`; `Credit Enhancement` → `Profile Strengthening`.
- Featured ribbon: `★ Most Chosen` → `Most Selected`.
- CTA button text: `Secure Enrollment` → `Begin Enrollment`.
- Remove "Your file fires within 24 hours" bottom-band copy; replace with: "Enrollment includes a structured onboarding call and secure document collection within one business day."
- Keep trust badges (`256-bit SSL`, `PCI-DSS`, etc.).
- Card spacing: increase inner card padding `p-8 → p-10`, tighten feature list `space-y-3 → space-y-3.5`, `mb-8 → mb-10` above CTA.

### 7. Outcomes section (`#proof`, ~line 651)
- Eyebrow: `The Receipts` → `Client Progress & Outcomes`.
- Heading: `Clients who got funded.` → `Client Progress & Outcomes` (italic on `Outcomes`).
- Subhead: replace 4–21 day claim with: "A snapshot of recent client engagements. Results vary by client profile, documentation, creditor response, and reporting accuracy."
- Headline metric strip (`$1.8M+ / 4–21 / 50 / 94%`): keep 4 cells, rewrite as:
  - `Active Client Files`
  - `Dispute Rounds Managed`
  - `States Served · Nationwide`
  - `Average Engagement · 90–180 Days`
- Testimonial quotes — rewrite three testimonials to compliant, attributed first-person language without promising specific point lifts; keep names/cities. Drop "no fluff", drop "Real numbers", drop "the future of credit". Metric badge becomes a neutral label (e.g. `Mortgage Readiness`, `Banking Restored`, `Auto Financing`) instead of point-lift number.
- Add fine-print line under testimonials: `Individual results vary. Testimonials reflect personal client experiences and are not guarantees of similar outcomes.`

### 8. Compliance band (inside outcomes, ~line 700)
- Eyebrow: `Authority & Compliance` → `Security, Privacy & Compliance`.
- Replace 5 badge labels with: `FCRA-Aligned Process`, `Secure Client Portal`, `Encrypted Document Handling`, `Privacy-First File Management`, `Structured Documentation Review`. Keep icon component choices.

### 9. Home loan section (`#home-loans`, ~line 724)
- Eyebrow: `Home Loan Domination` → `Mortgage Readiness Support`.
- Heading: `Built to Get You Funded. Home Loans. Underwriting. Closed.` → `Mortgage Readiness Support` with subhead "Credit profile structuring and lender documentation support for the mortgage conversation."
- 3 cards rewrite:
  - `Credit Profile Structuring` — "Account mix, utilization, and derogatory review sequenced for mortgage scorecards (FICO 2/4/5)."
  - `Lender Documentation Support` — "Documentation review, credit explanation letters, and pre-application preparation alongside your loan officer."
  - `Coordinated Engagement` — "We coordinate with your selected loan officer through the application process so questions are addressed promptly."
- Drop `100% Underwriting Pass Rate` card and badge entirely.
- Tiara Smith feature block: keep, but soften copy. Remove `100% Closing Rate on Funded Files` badge; replace with `Featured Real Estate Partner`. Sentence rewrite: "Once your credit profile is ready, Tiara guides clients through the home-buying process from pre-approval to closing." Keep both external links unchanged.
- Partner band: keep brokerage chips, rewrite trailing sentence to drop "all major banks" superlative: "Working relationships with banks and credit unions for mortgage, auto, and business financing conversations."

### 10. Auto loan section (`#auto-loans`, ~line 818)
- Eyebrow: `Auto Loan Structuring` → `Auto Financing Preparation`.
- Heading: `Auto Loans. Structured to Close.` → `Auto Financing Preparation` (italic on `Preparation`).
- Subhead rewrite: "Credit profile positioning and lender documentation review to support auto financing conversations."
- 4 step cards rewrite:
  - 01 `Auto Scorecard Review`
  - 02 `Debt & Utilization Cleanup`
  - 03 `Lender Documentation Support`
  - 04 `Credit Union & Dealer Coordination`
- Drop specific claims: "3.2% lower APR", "$2,400 less down", "Better rates. Lower down payments. Faster approvals." Use compliant phrasing: "Better-prepared profile presented to lenders."
- CTA bar: "Ready to drive off the lot?" → "Ready to prepare your auto financing file?" Subtext: "Enrollment includes a structured onboarding call and document collection within one business day." Button label stays `Start My Auto File`.

### 11. FAQ (`src/components/FAQSection.tsx`)
- Section eyebrow: `The Knowledge Index` → `Questions & Answers`.
- Heading: keep.
- Rewrite all 13 answers in calm, FCRA-aligned tone:
  - Remove "we dominate", "4–21 days", "fires within 24 hours", "100% underwriting pass rate", "94% of our clients see score improvements within 60 days".
  - Replace day-counts with: "Timelines vary; many engagements span 90–180 days based on profile complexity."
  - Replace pass-rate language with: "We structure files for the mortgage scorecard and coordinate with your loan officer through underwriting."
  - Add explicit results-vary disclaimer to the "guarantee" answer and the home-loan answer.
- Keep pricing answer accurate to existing tiers and existing `generateFAQSchema` integration.

### 12. Final CTA band (~line 880)
- Heading: `Stop renting your credit. Own your file.` → `Begin your credit readiness review.` (italic accent on `credit readiness review`).
- Subtext: `Enroll today and your dispute engine fires within 24 hours.` → "Schedule a structured onboarding call and begin document collection within one business day."
- Buttons: `Create My Account` → `Start My Credit Review`; `Compare Plans` → `View Service Options`.

### 13. Footer (~line 903)
- Replace "The Community · Live Wins Daily" band heading with calmer copy: "Connect with Express Credit & Financial Solutions". Keep Facebook button text neutral: `Visit Our Facebook`.
- Footer row: keep brand line. Add `Client Portal` link button next to Terms/Privacy/Refund that routes to `/admin/login`-style portal entry — reuse the existing Sign Up handler scrolling to `#auth` so we don't introduce a new route. Display order: `Terms · Privacy · Refund · Client Portal`.
- Copyright stays.

---

## Typography & spacing pass (presentation only)

- Body line-height: bump landing body paragraphs from default to `leading-relaxed` (1.625) where currently `leading-snug` or unset.
- Section vertical rhythm: standardize section padding to `py-24 md:py-28` across all landing sections (some are already `py-24`, a couple are tighter — normalize).
- Card inner padding: bump `p-6 → p-7` on process/auto step cards and `p-8 → p-10` on pricing cards.
- Headline tracking: keep current `tracking-tight`; reduce hero headline mobile size one notch (`text-5xl → text-[2.75rem]`) so 2-line wrap reads cleanly on iPhone 12/13 widths.
- Eyebrow tag letter-spacing: standardize all `tracking-[0.3em]` (some currently `0.25em`).
- Increase whitespace between hero subtext and CTA stack to `mt-12`, and between CTA stack and proof row to `mt-16`.
- Mobile: ensure pricing cards stack with `gap-6` (already), and footer columns stack with `gap-6 text-center` on `< md`.

---

## Verification

- `bun run build` succeeds with no TS errors.
- Grep verifies all banned phrases are gone:
  - `rg -n "command center|repairs your credit|24/7|success rate|domination|no fluff|don't take the file|100% pass|100% Underwriting|fires within 24 hours|Stop renting|Real numbers|Broken Credit|Most Powerful · Elite|The Receipts|CRM Tour|Membership Tiers|The Knowledge Index|Home Loan Domination" src/pages/Index.tsx src/components/FAQSection.tsx` returns zero hits.
- Manual visual check at desktop (1440), tablet (768), mobile (390): hero hierarchy is calm, section rhythm is consistent, no hype phrases visible, CTAs land as `Start My Credit Review` / `Client Portal Login`.
- Smoke test: clicking primary CTA still opens the inline auth panel; clicking secondary still scrolls to `#auth`; existing `trackCtaClick` calls fire (event names unchanged).

## Risks / non-goals

- Pricing numbers themselves are not changed (still $349.99 / $1,499.99 / $499–$1,499) — only labels and surrounding copy.
- `/checkout?plan=…` routes untouched.
- No new dependencies, no new routes, no new components.
