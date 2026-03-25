

# Plan: Update Pricing + Make Theme Accessible on Landing Page

## 1. Price Updates (3 files)

### `src/pages/MembershipPricing.tsx`
- Line 29: `price: 600` → `price: 1499.99`
- Line 51: `price: 350` → `price: 349.99`
- Line 71: `price: 500` → remove fixed price, change to display `"From $499.99"` with enhanced description
- Enhance the Tradelines card: add a note about pricing varying by credit age, credit limit, and reporting cycle ($499.99 - $1,499.99 range)
- Update the price display logic to handle the range format for tradelines

### `src/pages/Index.tsx` (landing page pricing cards, ~line 362-364)
- `price: '$600'` → `price: '$1,499.99'`
- `price: '$350'` → `price: '$349.99'`
- `price: '$500'` → `price: 'From $499.99'` with subtitle "Up to $1,499.99"
- Enhance Tradelines features list to include details about pricing factors (credit age, limit, reporting cycle)

### `src/components/ClientDashboard.tsx` (line 41, 44)
- `$350` references in `getMembershipFeatures` — update to `$349.99` (appears in setup tier)

## 2. Theme Selector on Landing Page

### `src/pages/Index.tsx`
- Import `ThemeSelector` component
- Add ThemeSelector to the landing page header area (top-right corner) so unauthenticated users can also switch themes
- Position it as a fixed/absolute element in the hero section or add a small floating button

### `src/pages/sba/Home.tsx`
- Import and add `ThemeSelector` to the SBA portal header area

### Verify existing coverage
- NavigationHeader already has ThemeSelector (covers all authenticated pages)
- AdminDashboard sidebar already has ThemeSelector
- Landing page and SBA Home are the gaps — both will be addressed

## Technical Details
- 4 files modified
- No new dependencies
- No data layer changes
- Price changes are purely presentational (no database or edge function impact)
- Theme selector uses existing `ThemeSelector` component — just needs to be imported and placed in the 2 pages that currently lack it

