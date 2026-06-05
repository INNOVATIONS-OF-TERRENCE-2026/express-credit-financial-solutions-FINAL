import { expect, Page } from "@playwright/test";

export const ADMIN_PROTECTED_PATHS = [
  "/admin",
  "/admin/clients",
  "/admin/disputes",
  "/admin/documents",
  "/admin/settings",
];

export const CLIENT_PROTECTED_PATHS = [
  "/client/dashboard",
  "/client/results",
  "/client/documents",
  "/client/payments",
  "/client/settings",
];

/** Enables the floating AuthDebugPanel by setting localStorage before app boot. */
export async function enableAuthDebug(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("ec_debug_auth", "1");
    } catch {
      /* ignore */
    }
  });
}

/** Waits for the auth-debug panel to report that auth + roles have settled. */
export async function waitForGuardsReady(page: Page, timeout = 20_000) {
  const panel = page.locator('[data-testid="auth-debug"]');
  await panel.waitFor({ state: "attached", timeout });
  await expect
    .poll(async () => await panel.getAttribute("data-guards-ready"), { timeout })
    .toBe("true");
}

export async function readAuthSnapshot(page: Page) {
  const panel = page.locator('[data-testid="auth-debug"]');
  await panel.waitFor({ state: "attached" });
  return {
    authReady: await panel.getAttribute("data-auth-ready"),
    rolesReady: await panel.getAttribute("data-roles-ready"),
    membershipReady: await panel.getAttribute("data-membership-ready"),
    guardsReady: await panel.getAttribute("data-guards-ready"),
    hasSession: await panel.getAttribute("data-has-session"),
    hasUser: await panel.getAttribute("data-has-user"),
    role: await panel.getAttribute("data-role"),
    isAdmin: await panel.getAttribute("data-is-admin"),
    path: await panel.getAttribute("data-path"),
  };
}

export async function adminLogin(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel(/admin email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /sign in to admin/i }).click();
  await page.waitForURL("**/admin", { timeout: 30_000 });
  await waitForGuardsReady(page);
  const snap = await readAuthSnapshot(page);
  expect(snap.hasUser).toBe("true");
  expect(snap.isAdmin).toBe("true");
}

export async function clientLogin(page: Page, email: string, password: string) {
  // The client login UI lives on the Index page (slug-based ClientLogin modal
  // surfaces inside the portal flow). Use Supabase JS via the page context so
  // we don't depend on any specific marketing-page layout.
  await page.goto("/");
  await waitForGuardsReady(page);
  const result = await page.evaluate(
    async ({ email, password }) => {
      const w = window as any;
      const client =
        w.__EXPRESS_CREDIT_SUPABASE__ ||
        w.supabase ||
        null;
      if (!client?.auth?.signInWithPassword) {
        return { ok: false, reason: "supabase client not exposed on window" };
      }
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      return { ok: !error, error: error?.message, userId: data?.user?.id };
    },
    { email, password }
  );
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
  await page.goto("/client/dashboard");
  await waitForGuardsReady(page);
  const snap = await readAuthSnapshot(page);
  expect(snap.hasUser).toBe("true");
}