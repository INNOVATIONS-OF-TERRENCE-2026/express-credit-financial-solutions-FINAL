import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Express Credit CRM auth/session E2E tests.
 *
 * Required env vars to actually run the auth specs (otherwise tests
 * `test.skip` themselves so CI never reports false failures):
 *
 *   E2E_BASE_URL              – Preview/published URL (defaults to localhost:8080)
 *   E2E_ADMIN_EMAIL           – Admin login email
 *   E2E_ADMIN_PASSWORD        – Admin login password
 *   E2E_CLIENT_EMAIL          – Client login email
 *   E2E_CLIENT_PASSWORD       – Client login password
 *
 * Run locally:
 *   bunx playwright install --with-deps
 *   E2E_BASE_URL=https://expresscreditfinancials.org \
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
 *   E2E_CLIENT_EMAIL=... E2E_CLIENT_PASSWORD=... \
 *   bunx playwright test
 */
const baseURL = process.env.E2E_BASE_URL || "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});