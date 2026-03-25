

# Global Command Palette Search Bar

## What this builds
A universal search bar (Cmd+K / Ctrl+K) accessible from every page in the app. Users type any feature, page, or tool name and instantly navigate there. Uses the existing `cmdk` library and `Command` UI component already installed in the project.

## Architecture

1. **New component: `src/components/GlobalSearchCommand.tsx`**
   - Uses the existing `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem` from `src/components/ui/command.tsx`
   - Registers all navigable routes and admin dashboard sections
   - Role-aware: admins see admin sections, regular users see client features
   - Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows) opens it from anywhere
   - Clicking a result navigates immediately via `useNavigate`
   - For admin dashboard sections, navigates to `/admin` with a query param or uses a shared state setter

2. **Search index structure**
   - **Client routes**: Home, Dispute Center, Data Freeze, Documents, Credit Report Upload, Education, Credit Building, Credit Monitoring, AI Assistant, Score Tracker, Membership, Onboarding, Goodwill Letters, Document Center, SBA Portal
   - **Admin routes**: Admin Dashboard, Admin Clients, Admin Settings, Admin Tools, Client Portal Management
   - **Admin dashboard sections** (for admins only): Overview, Backlog Tools, Review Queue, Pipeline, AI Analysis, AI Ops, Clients, Membership, Disputes, Documents, Credit Reports, Email, System
   - Each entry has: label, keywords (for fuzzy matching), icon, category group, route/action, role requirement

3. **Integration points**
   - **`src/components/NavigationHeader.tsx`**: Add a search trigger button in the header nav bar
   - **`src/pages/AdminDashboard.tsx`**: Add search trigger in the top bar header; support URL param `?section=` so the command palette can deep-link to admin sections
   - **`src/App.tsx`**: Mount `<GlobalSearchCommand />` at the app root so it's available on every page
   - Admin sections use a custom event or URL query param to set `activeSection` when navigating from outside the admin dashboard

4. **Deep-linking admin sections**
   - When user selects an admin section from outside `/admin`, navigate to `/admin?section=review-queue`
   - `AdminDashboard` reads `searchParams` on mount and sets `activeSection` accordingly
   - When already on `/admin`, directly update `activeSection` via a shared callback stored in a lightweight context or custom event

5. **UI details**
   - Search trigger button visible in NavigationHeader and AdminDashboard top bar
   - Shows "Search everything... ⌘K" placeholder
   - Groups results by category: "Pages", "Admin Tools", "AI & Workflow", "Client Features"
   - Each result shows icon + label + category badge
   - Empty state: "No results found"

## Files to create/edit
- **Create**: `src/components/GlobalSearchCommand.tsx`
- **Edit**: `src/App.tsx` — mount the component
- **Edit**: `src/components/NavigationHeader.tsx` — add search trigger button
- **Edit**: `src/pages/AdminDashboard.tsx` — add search trigger in top bar + read URL `?section=` param on mount

## Technical notes
- No new dependencies needed; `cmdk` and the `Command` UI component already exist
- Role detection via `useRoles().isAdmin()` and `useAuth().user` for conditional search entries
- No database queries needed; this is a static route/feature index with role gating

