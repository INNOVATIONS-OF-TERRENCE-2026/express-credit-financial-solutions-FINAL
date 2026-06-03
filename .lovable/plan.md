## Goal

Reposition the landing page around Express Credit's loan-approval dominance (home + auto), surface the Tiara Smith realtor partnership, list brokerage/banking partners, and globally remove em-dashes (—) from all user-facing copy on the landing experience.

## Scope (frontend / presentation only)

Files in play:
- `src/pages/Index.tsx` (landing page)
- `src/components/FAQSection.tsx` (copy + new FAQ entries)

No backend, auth, schema, RLS, or route changes.

## 1. Remove every em-dash (—)

Sweep both files and replace every `—` with a clean substitute based on context:
- Mid-sentence emphasis → comma or period
- Range separators like "4–21 days" stay (those are en-dashes, not em-dashes, and the user did not flag them)
- Parenthetical asides → restructure into two clauses

Confirmed current em-dash locations to fix:
- `Index.tsx` lines 321, 462, 592, 596 (comment)
- `FAQSection.tsx` lines 8, 12, 32

After the rewrite, grep the two files for `—` and require zero matches before finishing.

## 2. New "Home Loan Approval Domination" section

Insert a dedicated section on the landing page (placed after the results/metrics block, before testimonials) covering:

- Headline: "Built to Get You Funded. Home Loans, Underwriting, Closed."
- Sub-copy emphasizing: 100% underwriting success rate, proactive lender communication, credit structured specifically for mortgage approval.
- Three pillar cards:
  1. Credit Structured for Underwriting (tradelines, utilization, derog removal sequenced for mortgage scorecards)
  2. Proactive Lender Communication (we talk to the loan officer and underwriter directly)
  3. 100% Underwriting Pass Rate on files we structure
- "Realtor Partner Spotlight" card for Tiara Smith:
  - Name: Tiara Smith
  - Slogan: "Tiara Has The Key"
  - Texas-based top realtor partnership
  - Two CTAs: Visit website (`https://www.tiarahasthekey.com`) and View Zillow profile (`https://www.zillow.com/profile/tiarahasthekey`)
  - Both links open in a new tab with `rel="noopener noreferrer"`
- "Brokerage & Lending Partners" strip listing:
  - Brokerages: United Real Estate, Keller Williams Realty, Coldwell Banker, eXp Realty, Compass
  - Banking: "All major banks and credit unions"
  - Rendered as styled text chips (no third-party logos; matches the recent decision to remove third-party payment logos)

Styling: reuses the existing Editorial Prestige tokens (`#0d0d0d` base, `#c9a84c` gold accents, serif display + work sans), bento-style card layout consistent with the rest of the page. No new dependencies.

## 3. New "Auto Loan Structuring" section

Compact section beneath the home-loan block:
- Headline: "Auto Loans, Structured to Close."
- Copy on how Express Credit positions clients for auto financing approval (score positioning, debt-to-income clean-up, lender-ready file).
- Single CTA tied into the existing sign-up / log-in trigger already on the page (no new auth flow).

## 4. FAQ updates (`FAQSection.tsx`)

Add three new FAQ entries (and scrub em-dashes from existing ones):
1. "Do you help clients get approved for a home loan / mortgage?" - covers underwriting structuring, 100% pass rate, lender communication.
2. "Do you work with realtors?" - calls out Tiara Smith partnership and brokerages (United Real Estate, Keller Williams, Coldwell Banker, eXp Realty, Compass).
3. "Can you help me qualify for an auto loan?" - yes, with structuring approach.

## 5. Verification

- `rg -n "—" src/pages/Index.tsx src/components/FAQSection.tsx` returns no matches.
- Visual check of the landing page in the preview at 1032px confirms new sections render cleanly inside the existing Editorial Prestige theme.
- No changes to routes, auth, Supabase, or admin code.

## Out of scope

- No new images / logo assets (text chips only, per prior removal of third-party logos).
- No backend, schema, or RLS changes.
- No changes to membership pricing, checkout, or testimonials beyond em-dash cleanup.
