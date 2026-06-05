import { test, expect } from "@playwright/test";
import {
  ADMIN_PROTECTED_PATHS,
  adminLogin,
  enableAuthDebug,
  readAuthSnapshot,
  waitForGuardsReady,
} from "./helpers/auth";

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin auth + session stability", () => {
  test.beforeEach(async ({ page }) => {
    await enableAuthDebug(page);
  });

  test.skip(!EMAIL || !PASSWORD, "E2E_ADMIN_EMAIL/PASSWORD not provided");

  test("admin can log in and lands on /admin", async ({ page }) => {
    await adminLogin(page, EMAIL!, PASSWORD!);
    expect(page.url()).toContain("/admin");
    const snap = await readAuthSnapshot(page);
    expect(snap.guardsReady).toBe("true");
    expect(snap.isAdmin).toBe("true");
  });

  test("session survives hard refresh on protected route", async ({ page }) => {
    await adminLogin(page, EMAIL!, PASSWORD!);
    await page.reload();
    await waitForGuardsReady(page);
    expect(page.url()).not.toContain("/admin/login");
    const snap = await readAuthSnapshot(page);
    expect(snap.hasSession).toBe("true");
    expect(snap.isAdmin).toBe("true");
  });

  test("can navigate between protected admin routes without bouncing to /login", async ({
    page,
  }) => {
    await adminLogin(page, EMAIL!, PASSWORD!);
    for (const path of ADMIN_PROTECTED_PATHS) {
      await page.goto(path);
      await waitForGuardsReady(page);
      expect(page.url(), `nav to ${path}`).not.toContain("/admin/login");
      expect(page.url(), `nav to ${path}`).not.toMatch(/\/$/);
    }
  });

  test("session survives 90 seconds without redirect to /login", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await adminLogin(page, EMAIL!, PASSWORD!);
    const start = Date.now();
    const deadline = start + 90_000;
    while (Date.now() < deadline) {
      expect(page.url(), "must not bounce to /login").not.toContain(
        "/admin/login"
      );
      const snap = await readAuthSnapshot(page);
      expect(snap.hasSession).toBe("true");
      expect(snap.isAdmin).toBe("true");
      await page.waitForTimeout(10_000);
    }
    // Final check after the window.
    await page.reload();
    await waitForGuardsReady(page);
    expect(page.url()).not.toContain("/admin/login");
  });
});