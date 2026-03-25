

# Plan: Theme System + Complete Dashboard Redesign

## Summary
Build a comprehensive theme system (light/dark mode + 32 color themes) and redesign all dashboards with a premium fintech aesthetic. This is broken into 3 major workstreams that touch ~20 files.

## Workstream 1: Theme Infrastructure

### New file: `src/contexts/ThemeContext.tsx`
- ThemeProvider wrapping the app with `next-themes` (already installed) for light/dark mode
- Custom color theme system using CSS custom properties — 32 named themes stored in a `THEMES` constant array
- Each theme defines: `--theme-accent`, `--theme-accent-foreground`, `--theme-surface`, `--theme-surface-hover` as HSL values
- Theme selection persisted via localStorage
- Exports: `useThemeConfig()` hook returning `{ mode, setMode, colorTheme, setColorTheme, themes }`

### New file: `src/components/ThemeSelector.tsx`
- Accessible from NavigationHeader (gear icon) and all pages via a Sheet/Drawer
- Top section: Light / Dark / System toggle (3 buttons)
- Bottom section: 32 color theme swatches in a 4x8 grid, each a colored circle with checkmark on active
- Responsive: full-width drawer on mobile

### 32 Color Themes (name + accent color):
Ocean Blue (#3B82F6), Emerald (#10B981), Sunset Orange (#F97316), Ruby Red (#EF4444), Violet (#8B5CF6), Fuchsia (#D946EF), Rose (#F43F5E), Amber (#F59E0B), Teal (#14B8A6), Indigo (#6366F1), Lime (#84CC16), Cyan (#06B6D4), Sky (#0EA5E9), Pink (#EC4899), Slate (#64748B), Gold (#EAB308), Coral (#FF6B6B), Mint (#00D4AA), Lavender (#A78BFA), Peach (#FDBA74), Electric (#7C3AED), Neon Green (#22C55E), Arctic (#38BDF8), Crimson (#DC2626), Bronze (#CD7F32), Sapphire (#2563EB), Magenta (#E11D48), Honey (#FCD34D), Forest (#166534), Plum (#7E22CE), Steel (#475569), Champagne (#F5E6CC)

### Modify: `src/index.css`
- Add proper `:root` (light mode) CSS variables alongside existing `.dark` variables
- Light mode: white/gray backgrounds, dark text, proper contrast
- Dark mode: keep existing dark fintech palette (slate-900/950 backgrounds, light text)
- Add `[data-theme="X"]` selectors for each of 32 color themes that override `--primary`, `--accent`, `--ring`, `--border` to the theme accent color
- Add utility classes: `.glass-card`, `.glass-card-hover`, `.stat-number`, `.section-label`

### Modify: `src/App.tsx`
- Wrap with `ThemeProvider` from next-themes (defaultTheme="dark", attribute="class")
- Wrap with custom `ThemeConfigProvider` from ThemeContext

### Modify: `src/main.tsx`
- No changes needed (providers added in App.tsx)

## Workstream 2: NavigationHeader Redesign

### Modify: `src/components/NavigationHeader.tsx`
- Remove ALL inline `style` attributes (text-shadow, drop-shadow)
- Background: `bg-background/95 backdrop-blur-xl border-b border-border` (adapts to light/dark)
- Nav links: `text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-accent/10`
- Active link: `text-foreground bg-accent/10`
- Mobile: Replace horizontal scroll with Sheet (hamburger menu icon) sliding from left
- Add ThemeSelector trigger button (Palette icon) next to sign out
- Remove purple neon glow, blue-yellow gradient, bg-black buttons
- All colors use semantic tokens (foreground, muted-foreground, accent, etc.) — works in both light and dark

## Workstream 3: Dashboard Redesigns

### Modify: `src/pages/Index.tsx` (Authenticated Dashboard)
- **Remove**: DocumentArchive, ChatHistoryPanel, CreditScanSummary, large SBA banner card
- **Add Hero Stats Row**: 4 cards (Credit Score, Active Disputes, Documents, Membership) using glass-card styling with semantic colors
- **Add Quick Actions Strip**: Horizontal scrollable row of compact pills (icon + label), `overflow-x-auto`
- **Add 2-column layout**: Left (Recent Activity from real data — audit_logs/dispute_letters, Dispute Pipeline mini bar), Right (AI Assistant compact, Membership card)
- Landing page (unauthenticated): Keep video hero — update form cards to use `bg-card border-border` instead of hardcoded fintech colors, so they adapt to theme
- All hardcoded `text-primary-foreground`, `bg-white/10` replaced with semantic tokens

### Modify: `src/pages/AdminDashboard.tsx`
- Replace 12-tab `TabsList` with sidebar layout:
  - New `AdminSidebar` component using Sheet on mobile, fixed sidebar on desktop
  - Sidebar: `w-64 bg-card border-r border-border`, nav items grouped into sections
  - Active item: `bg-accent/10 text-foreground border-l-2 border-primary`
  - Content area: `flex-1 p-6`
- Overview: Keep BacklogOverview + 4 KPI cards but use `glass-card` styling
- All tabs become sidebar nav items — same content, better layout
- Remove hardcoded `text-green-600`, `text-blue-600`, `text-purple-600` from System tab — use semantic colors
- Loading state: Replace spinner with Skeleton components
- Use `useState` for activeSection instead of Tabs component

### Modify: `src/components/BacklogOverview.tsx`
- Restyle cards: `glass-card` with colored icon backgrounds (`bg-primary/10 text-primary` rounded-lg)
- Add `stat-number` class to count display
- Animate-fade-in on mount

### Modify: `src/components/CasePipelineDashboard.tsx`
- Restyle status buttons as connected pipeline segments with accent colors
- Filter cards below styled with `glass-card`
- Mobile: vertical stack instead of horizontal overflow

### Modify: `src/components/ClientPortal.tsx`
- Replace `grid-cols-7` TabsList with responsive approach: horizontal scrollable on desktop, Select dropdown on mobile
- Replace raw `<details>` with Accordion component for dispute letters
- All `bg-slate-800`, `text-yellow-400` replaced with semantic tokens
- Add glass-card styling to stat cards

### Modify: `src/components/ClientDashboard.tsx`
- Replace `card-premium`, `card-elegant`, `status-basic` classes with semantic token equivalents
- Keep SecureVerificationUpload integration
- Ensure all text readable in both light and dark

### Modify: `src/components/FloatingChat.tsx`
- Chat bubble: `bg-card/95 backdrop-blur-xl border-border rounded-2xl`
- Messages: user = `bg-primary/10 border-primary/20`, assistant = `bg-muted`
- Open button: `bg-primary text-primary-foreground rounded-full w-14 h-14`
- Remove any hardcoded dark colors

### Modify: `src/components/DisputeTimelineTracker.tsx`
- Replace `bg-blue-100 text-blue-800` with `bg-primary/10 text-primary`
- Keep animate-pulse on urgent deadlines

## Key Design Principles

- **Every color reference uses CSS custom properties** (via Tailwind semantic tokens like `bg-card`, `text-foreground`, `border-border`, `bg-primary`, etc.)
- **Light mode**: Clean white/gray surfaces, dark text, colored accents
- **Dark mode**: Slate-900/950 surfaces, white/gray text, colored accents
- **Color themes**: Override `--primary` and `--accent` to the chosen theme color — everything else adapts automatically
- **No inline styles** — all styling via Tailwind classes
- **Mobile-first**: All tab navs become dropdowns or sheets below md breakpoint

## Technical Details
- ~20 files modified/created
- 2 new files: ThemeContext.tsx, ThemeSelector.tsx
- No new npm dependencies (next-themes already installed)
- No changes to auth, data fetching, edge functions, or Supabase queries
- All existing functionality preserved — only JSX structure and Tailwind classes change
- Theme persists across sessions via localStorage

## Implementation Order
1. ThemeContext + ThemeSelector + CSS variables (foundation)
2. App.tsx provider wrapping
3. NavigationHeader redesign (visible on every page)
4. Index.tsx authenticated dashboard redesign
5. AdminDashboard sidebar layout conversion
6. ClientPortal + ClientDashboard + BacklogOverview + CasePipelineDashboard restyling
7. FloatingChat + DisputeTimelineTracker restyling
8. Index.tsx landing page (unauthenticated) semantic token update

