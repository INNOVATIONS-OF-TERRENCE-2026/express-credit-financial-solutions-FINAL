## Root cause

`/onboarding` (`src/pages/ClientOnboarding.tsx`) renders `DigitalSignature` for the "Complete Your Client Agreement" card. That component is broken for this use case in two compounding ways:

1. **Storage RLS denies the upload.** `DigitalSignature.handleSign` uploads to the `signatures` bucket with a flat filename:
   ```
   signature_${user.id}_${Date.now()}.png
   ```
   The bucket's INSERT policy requires the first folder segment to equal `auth.uid()`:
   ```
   (bucket_id = 'signatures') AND (auth.uid()::text = (storage.foldername(name))[1])
   ```
   Because there is no `${user.id}/` folder prefix, `storage.foldername(name)[1]` is `null`, the policy fails, the upload throws, and the user sees the toast **"Failed to save signature. Please try again."** This is exactly what clients are hitting.

2. **No agreement record is ever written.** Even if the upload succeeded, the page passes `onSignatureSaved={async () => {}}` — an empty handler. Nothing is inserted into `client_agreements`, so `useClientAgreement` keeps returning `hasSignedAgreement = false` forever and the UI never advances.

The rest of the app already has a correct, production-grade signing path: `ClientAgreementModal` draws a canvas signature, generates a signed PDF via `jsPDF`, uploads to the `client-agreements` bucket under `${user.id}/...` (matching its RLS), inserts into `client_agreements` with `user_id` + `client_id`, and writes audit + timeline rows. `useClientAgreement` already reads from that exact table.

## Fix (surgical, frontend only)

Swap the broken inline `DigitalSignature` on the onboarding page for the existing, working `ClientAgreementModal`. No DB/RLS/auth/router changes required.

### File: `src/pages/ClientOnboarding.tsx`

- Remove `import { DigitalSignature } from '@/components/DigitalSignature'`.
- Add `import { ClientAgreementModal } from '@/components/ClientAgreementModal'`.
- Add local state `const [agreementOpen, setAgreementOpen] = useState(false)`.
- In the "Complete Your Client Agreement" card, when `!hasSignedAgreement`:
  - Replace the embedded `DigitalSignature` block with a short explainer + a primary "Review & Sign Agreement" button that sets `agreementOpen = true`.
- Render `<ClientAgreementModal isOpen={agreementOpen} onClose={() => setAgreementOpen(false)} onAgreementSigned={() => { setAgreementOpen(false); refetchAgreementStatus(); }} />` once inside the page.
- Keep the existing green "Agreement Signed" success state as-is (it already keys off `hasSignedAgreement`).

### Why this is safe

- No changes to auth, routing, RLS, schema, or any other working flow.
- `ClientAgreementModal` is already used elsewhere in the app and is known-good against the current storage policies on `client-agreements` and the `client_agreements` table.
- `DigitalSignature` is left untouched for any other caller; only the onboarding page stops using it.
- `useClientAgreement` already polls `client_agreements` by `user_id`, so the green "Agreement Signed" state will flip automatically after a successful sign.

## Verification

1. Log in as a client with no signed agreement, visit `/onboarding`.
2. Click **Review & Sign Agreement** → modal opens.
3. Draw signature (or type fallback), enter full legal name, click **I Agree & Sign Agreement**.
4. Expect: success toast, modal closes, card flips to green "Agreement Signed".
5. In Supabase, confirm a new row in `client_agreements` for this `user_id` and a PDF in the `client-agreements` bucket at `${user.id}/...-service-agreement.pdf`.
6. Reload `/onboarding` → still shows green signed state.
