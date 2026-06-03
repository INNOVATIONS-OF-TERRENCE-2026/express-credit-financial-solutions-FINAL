# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/856f1e4e-3cd3-4ba8-bc81-51cf0128071c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/856f1e4e-3cd3-4ba8-bc81-51cf0128071c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/856f1e4e-3cd3-4ba8-bc81-51cf0128071c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Testing

Run the default Vitest suite (mocked, no network) with:

```sh
bunx vitest run
```

### Live SSN encryption round-trip test (opt-in)

`src/test/ssnEncryption.live.test.ts` exercises the real Supabase
`encrypt_ssn_secure` / `decrypt_ssn_secure` RPCs against the live
project. It is **skipped by default** and runs only when both of these
env vars are set:

```sh
E2E_SUPABASE_EMAIL=your-test-user@example.com \
E2E_SUPABASE_PASSWORD=*** \
bunx vitest run src/test/ssnEncryption.live.test.ts
```

The user must already exist in Supabase Auth and be allowed to insert
into `public.clients` (i.e. an ordinary signed-in client). The test
creates a single `clients` row and deletes it on completion.
