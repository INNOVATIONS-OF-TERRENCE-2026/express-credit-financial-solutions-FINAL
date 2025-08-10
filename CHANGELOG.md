# Changelog

## [Unreleased]

### Added
- Secret admin pages: `/admin/settings` and `/admin/tools` with admin-only access and redirect for non-admins.
- Migration to enhance `credit_reports` schema: added `file_name`, `storage_path`, `uploaded_by`, `uploaded_at` columns and made `fico_score` optional.

### Changed
- Credit Report Upload page:
  - Enforced PDF-only uploads
  - Stores reports in `credit-reports/CLIENT_ID/` (Supabase Storage)
  - Inserts rows into `credit_reports` with required metadata
  - Report list now reads from `credit_reports` and previews via signed URLs
- Document Automation Center:
  - Upload now also mirrors to private `documents` bucket and inserts a row into `documents` for immediate automation workflows while keeping existing UI list responsive
- Admin Clients (Manage):
  - Upload modal supports multi-file PDF upload; shows toast and auto-refreshes; signed URL preview works
- Education Center:
  - Category filter buttons restyled for contrast (dark blue background, white text) with accessible focus/hover outline via design tokens
- VisaLogo component:
  - Replaced image with text-based badge to eliminate load errors
- Branding cleanup:
  - Removed Lovable-specific CSS/meta from `index.html`; updated OG/Twitter images

### Fixed
- Quick Actions routes verified without console errors
- Admin-only pages now redirect non-admins to `/`

### Notes
- Security: Supabase linter warns that leaked password protection is disabled. This is a project-level auth setting; consider enabling it in the Supabase dashboard for improved security.
