## Root Cause

On `/dispute-center`, the **Credit Report Upload Center** card (`src/components/EnhancedCreditReportUpload.tsx`) renders the file picker like this:

```tsx
<label htmlFor="credit-upload" className="cursor-pointer">
  <Button disabled={uploading}>Browse Files</Button>
</label>
<input id="credit-upload" type="file" className="hidden" ... />
```

shadcn's `<Button>` renders as a real `<button>` element. Browsers **do not** forward a label-click to the associated input when the click target is itself an interactive `<button>` — the button swallows the event. Result: clicking "Browse Files" does literally nothing, no file dialog ever opens, no upload ever starts. This matches the symptom ("doesn't work at all").

Storage RLS, table RLS, and the bucket (`credit-reports`) are all correct — verified against Supabase. No backend changes needed.

## Files to Modify

- `src/components/EnhancedCreditReportUpload.tsx` — fix the upload trigger and tighten the UX.

## Changes

1. Replace the `<label>`-wrapped Button with a `useRef<HTMLInputElement>()` and an `onClick={() => inputRef.current?.click()}` on the Button. Move the hidden `<input>` out of the label.
2. Also wire **drag-and-drop** on the dashed area so users can drop a PDF directly (matches the visual affordance of the dropzone).
3. Keep `accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"` aligned with what `useFileUploadSecurity` actually validates (drop `.csv,.txt` from `accept` since they get rejected by validation anyway — confusing).
4. Add a clear empty-state hint when `uploads.length === 0` so the table area doesn't look broken.

## Out of Scope

- No DB migration, no RLS change, no edge function change, no auth change.
- No styling overhaul — surgical fix only.

## Verification

- Click **Browse Files** → OS file dialog opens.
- Pick a PDF → progress bar advances, row appears in the "Uploaded Files" table, `analyze-credit-report` is invoked, toast confirms success.
- Drag-and-drop a PDF onto the dashed area → same flow.
- Existing rows still preview / download / delete correctly.
