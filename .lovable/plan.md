

# Production Document Workflow Rescue — Complete Repair Plan

## Problem Summary

The document ecosystem has multiple broken or partially-wired systems:
1. **BulkDocumentIntelligence**: DB insert fails because `bulk_upload_files.batch_id` is NOT NULL but code inserts without it
2. **ClientDocumentManager**: View/Download buttons use raw `uploaded_file_url` (a storage path, not a URL) — opens broken links
3. **AdminFileUploader**: Uploads to `client-documents` bucket with path `admin-docs/{clientId}/...` but storage policy checks `auth.uid() == foldername[1]` — admin uploads will fail unless admin policy covers it (it does via ALL policy, but client access won't work since clientId ≠ userId)
4. **Documents section** in admin dashboard (line 826-844): Has a dead "Choose Files" button (no handler attached), shows hardcoded template list, no real document management
5. **Download system**: ClientDocumentManager uses `window.open(existingDoc.uploaded_file_url)` which is just a storage path like `clientId/docType/timestamp.pdf` — not a valid URL. Needs signed URL generation.
6. **Storage bucket confusion**: BulkDocumentIntelligence uses `documents` bucket, DocumentUploadCenter uses `document-uploads`, AdminFileUploader uses `client-documents`, FileUploader uses `client-documents` — inconsistent but each has its own policies. This is acceptable if download logic matches.

## Plan

### 1. Migration: Make `batch_id` nullable on `bulk_upload_files`

The simplest correct fix. The batch system exists but individual uploads should work without a batch.

```sql
ALTER TABLE public.bulk_upload_files ALTER COLUMN batch_id DROP NOT NULL;
```

### 2. Rewrite `BulkDocumentIntelligence.tsx` — Fix upload pipeline

- Add file type validation (pdf, png, jpg, jpeg, webp, txt, doc, docx, csv)
- Add file size validation (20MB max)
- Add proper error differentiation (storage vs DB vs AI pipeline)
- Add progress indicators per file
- Add file size display
- Add a "Clear completed" button
- Keep both "Upload Documents" button and dropzone working
- Update dropzone `accept` to include all supported types
- After successful upload + DB insert, trigger AI pipeline (non-blocking, with error handling)
- Show uploaded file count and status summary

### 3. Fix `ClientDocumentManager.tsx` — Download/View system

The core bug: `uploaded_file_url` is a storage path, not a URL. View/Download buttons do `window.open(path)` which fails.

Fix:
- For View: generate a signed URL from the correct bucket (`client-documents`) and open in new tab
- For Download: generate signed URL, fetch blob, trigger download with correct filename
- Determine the correct bucket per document type (identity_docs use `client-documents`, credit_reports use `client-documents`)
- Add loading state to View/Download buttons

### 4. Fix `DocumentUploadCenter.tsx` — View button fix

Line 471-474 already uses `createSignedUrl` from `document-uploads` bucket — this is correct. Verify delete also works. This component is mostly fine.

### 5. Rebuild Admin Dashboard `documents` section (lines 826-844)

Currently a dead placeholder with a non-functional upload button and hardcoded template list. Replace with:
- Real document listing from `document_uploads` table (all users' documents)
- Working upload via `AdminFileUploader` component (already exists)
- Download buttons using signed URLs
- Status badges
- Filter by document type / status
- Link to Bulk Doc Intel section
- Include `BulkDocumentIntelligence` component inline or as a tab

### 6. Fix `AdminFileUploader.tsx` — Storage path consistency

The admin uploads to `client-documents` bucket with path `admin-docs/{clientId}/...`. The admin ALL policy covers this. But when clients try to view these docs, the client SELECT policy checks `auth.uid() == foldername[1]` — the path starts with `admin-docs` not the user's ID, so clients can't access.

Fix: Change admin upload path to `{clientId}/{category}/{timestamp}-{filename}` so client policies work. OR add an admin-specific download handler that generates signed URLs server-side. The simpler fix is to ensure admin download always uses signed URLs (admin has ALL access), and for client-facing views, store the path in DB and generate signed URLs on demand.

### 7. Client Portal document access

`ClientDocumentManager` is rendered in the client portal documents tab. Fix the signed URL generation (step 3) and it works. Also need to make sure `identity_docs` and `credit_reports` queries return data correctly for the logged-in user's client record.

### 8. Create a shared download utility

Create `src/lib/documentUtils.ts` with:
- `getSignedDownloadUrl(bucket, path)` — returns signed URL
- `downloadFile(bucket, path, filename)` — triggers browser download
- `previewFile(bucket, path)` — opens in new tab
- `getDocumentBucket(category)` — maps category to bucket name

### 9. Dashboard navigation — already well-covered

The sidebar already has Documents in PRIORITY and MANAGEMENT groups, Bulk Doc Intel in WORKFLOW, plus command cards. The main fix needed is making the Documents section content functional (step 5).

## Files to Create
- `src/lib/documentUtils.ts` — shared upload/download utilities

## Files to Edit
- `supabase/migrations/[timestamp]_fix_batch_id_nullable.sql` — schema fix
- `src/components/BulkDocumentIntelligence.tsx` — full repair
- `src/components/ClientDocumentManager.tsx` — signed URL download fix
- `src/components/AdminFileUploader.tsx` — minor path fix
- `src/pages/AdminDashboard.tsx` — replace dead documents section with real document manager
- `src/components/FileUploader.tsx` — add more file types, improve error messages

## Files NOT touched
- All existing autonomous, CIP, dispute, automation, pipeline components — untouched
- Routes, auth, themes — untouched
- Edge functions — untouched (AI pipeline calls remain non-blocking)

## Execution order
1. Migration (batch_id nullable)
2. Create documentUtils.ts
3. Fix BulkDocumentIntelligence
4. Fix ClientDocumentManager download
5. Fix FileUploader
6. Rebuild admin Documents section
7. Minor AdminFileUploader fix

