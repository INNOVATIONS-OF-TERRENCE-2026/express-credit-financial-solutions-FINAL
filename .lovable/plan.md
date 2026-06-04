## Goal

Today `/admin/documents` only shows rows from `credit_report_uploads`. Client portal uploads (ID, SSN, address proof via `SecureVerificationUpload`) and generic `document_uploads` / `document_archive` rows are invisible to admin. Unify them into a single sortable, filterable table with filename, client, type, timestamp, and view/download links.

## What ships

### 1. Unified source aggregator

A new hook `useAdminClientDocuments` queries four tables in parallel and normalizes the rows into one `AdminDoc` shape:

| Source table | Bucket | Notes |
|---|---|---|
| `credit_report_uploads` | `document-uploads` | Already shown today — keep behavior |
| `document_uploads` | `documents` | Uses `file_url` (path), `upload_date` |
| `document_archive` | `document-archive` | Uses `file_path`, `upload_date` |
| `client_verification_secure` | `verification-docs` | Expanded into up to 3 virtual rows per user (ID / SSN / Address) using the `*_document_url` columns |

Normalized shape:

```text
{ id, source, clientId|userId, clientName, fileName,
  filePath, bucket, docType, sizeBytes?, status, uploadedAt }
```

Client display name resolved via a single `clients` lookup joined in memory on `user_id`.

### 2. Rewritten `AdminDocumentList`

Replaces the current component. Keeps the same import path so `AdminDocumentsPage` doesn't change. Adds:

- Source filter (All / Verification / Credit Reports / General / Archive)
- Client search box (matches name or email substring)
- Sort by uploaded date (default desc)
- Columns: Client · File name · Source · Type · Size · Uploaded · Actions
- Actions reuse existing `previewFile` / `downloadFile` from `@/lib/documentUtils` with the correct bucket per row
- Refresh button, empty state, loading skeleton

### 3. No schema changes

All four tables already exist with admin-readable RLS policies (admins reach them via `has_role('admin')`). No migrations needed. Storage URLs are generated client-side via signed URLs through the existing `documentUtils` helpers, which already work on private buckets.

### 4. Files touched

- New: `src/hooks/useAdminClientDocuments.ts`
- Rewrite: `src/components/AdminDocumentList.tsx`
- Unchanged: `src/pages/AdminDocumentsPage.tsx` (still renders `<AdminDocumentList />`)

### 5. Out of scope (call out, don't build)

- Bulk download / zip export
- Inline document preview modal (keeps current "open in new tab" via `previewFile`)
- Marking docs reviewed from this view (that lives on the disputes / review-queue pages)
- Realtime subscriptions (Refresh button only, matches current pattern)

## Acceptance

- A client portal upload via `/client/documents` (ID/SSN/Address) appears in `/admin/documents` immediately after Refresh, with the correct filename, the client's name, source = "Verification", and a working View + Download.
- Existing `credit_report_uploads` rows still render exactly as before.
- Filtering by source narrows the list; clearing the filter restores all rows.
- No new console errors; no RLS errors for an admin user.
