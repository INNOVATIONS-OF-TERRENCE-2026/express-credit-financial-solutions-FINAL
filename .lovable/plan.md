

# Admin Command Center UI Restructure

## What changes
Restructure the AdminDashboard overview section into a high-visibility command center with a pinned action bar, large system cards, and a live processing overview panel. Add priority tools group to sidebar.

## Changes to `src/pages/AdminDashboard.tsx`

### 1. Pinned Action Bar (top of main content, always visible)
Add a sticky action bar below the existing header (`h-14` top bar) that renders on ALL sections (not just overview). Contains 4 primary action buttons:
- **Upload Documents** → `setActiveSection('bulk-docs')`
- **Process Backlog** → `setActiveSection('backlog')`
- **Run AI Analysis** → `setActiveSection('ai-analysis')`
- **Open Review Queue** → `setActiveSection('review-queue')`

Styled as a flex row with prominent buttons, bg-card border-b, sticky below header.

### 2. Restructure Overview Section
Replace the current overview with three blocks in order:

**Block A: Live Processing Overview** (new)
- Fetch live counts from Supabase: total profiles, disputes in review status, disputes with letters (approved), flagged disputes pending
- Display 4 stat cards: Total Clients, In Progress, Needs Review, Completed
- Add a red badge: "X Clients Waiting Action"

**Block B: Admin Command Center Cards** (replaces current Workflow Command Center + Quick Actions)
5 large interactive cards in a responsive grid (1 col mobile, 2-3 col desktop):

1. **Backlog Processing Center** (Zap icon, red accent)
   - Description: "Client Processing Grid, Review Queue, Pipeline"
   - onClick → `setActiveSection('backlog')`
   - Sub-links: Processing Grid, Review Queue, Pipeline as small buttons

2. **AI Ops Center** (Brain icon, cyan accent)
   - Description: "AI Analysis, AI Control Panel"
   - onClick → `setActiveSection('ai-analysis')`
   - Sub-links: AI Analysis, AI Ops

3. **Document Intelligence** (FileSearch icon, emerald accent)
   - Description: "Document Management, Bulk Upload System"
   - onClick → `setActiveSection('documents')`
   - Sub-links: Documents, Bulk Doc Intel

4. **Client Management** (Users icon, blue accent)
   - Description: "Client List, Profiles, Membership"
   - onClick → `setActiveSection('users')`
   - Sub-links: Clients, Membership

5. **System Control** (Settings icon, amber accent)
   - Description: "Admin Settings, Admin Tools"
   - onClick → `navigate('/admin/settings')`
   - Sub-links: Settings, Tools

Each card is ~150px tall with icon, title, description, and 2-3 small sub-link buttons at bottom.

**Block C: Keep existing BacklogOverview + stat cards** (below, unchanged)

### 3. Sidebar Priority Tools Group
Add a new group **"PRIORITY"** at the top of the `NAV_ITEMS` array (before OVERVIEW):
- Review Queue (ClipboardCheck)
- Processing Grid (Activity)
- Pipeline (GitBranch)
- Documents (Upload)

These duplicate entries from WORKFLOW but appear at the top for instant access. The sidebar rendering groups them under "⚡ PRIORITY TOOLS" label.

### 4. Remove redundancy
- Remove the old "Quick Actions" card (the 8-button grid) since the command center cards replace it
- Keep the Workflow Command Center 4-button row but move it inside Block A as secondary nav

## Files to edit
- `src/pages/AdminDashboard.tsx` — all changes in this single file

## Technical notes
- No new components needed
- No database changes
- No new dependencies
- Sticky action bar uses `sticky top-14 z-20` (below the existing `sticky top-0 z-30` header)
- Live counts use existing `users`, `disputes`, `notifications` state already fetched in `fetchAdminData`
- Sidebar priority group just adds entries to `NAV_ITEMS` with a new group name

