import { test, expect } from "@playwright/test";
import {
  CLIENT_PROTECTED_PATHS,
  clientLogin,
  enableAuthDebug,
  readAuthSnapshot,
  waitForGuardsReady,
} from "./helpers/auth";

const EMAIL = process.env.E2E_CLIENT_EMAIL;
const PASSWORD = process.env.E2E_CLIENT_PASSWORD;

test.describe("client auth + session stability", () => {
  test.beforeEach(async ({ page }) => {
    await enableAuthDebug(page);
  });

  test.skip(!EMAIL || !PASSWORD, "E2E_CLIENT_EMAIL/PASSWORD not provided");

  test("client can log in and reach the client portal", async ({ page }) => {
    await clientLogin(page, EMAIL!, PASSWORD!);
    expect(page.url()).toContain("/client/");
    const snap = await readAuthSnapshot(page);
    expect(snap.hasUser).toBe("true");
  });

  test("client session survives hard refresh", async ({ page }) => {
    await clientLogin(page, EMAIL!, PASSWORD!);
    await page.reload();
    await waitForGuardsReady(page);
    expect(page.url()).toContain("/client/");
    expect(page.url()).not.toContain("/admin/login");
  });

  test("client can navigate across portal routes without redirect", async ({
    page,
  }) => {
    await clientLogin(page, EMAIL!, PASSWORD!);
    for (const path of CLIENT_PROTECTED_PATHS) {
      await page.goto(path);
      await waitForGuardsReady(page);
      expect(page.url(), `nav to ${path}`).toContain(path);
      expect(page.url(), `nav to ${path}`).not.toContain("/admin/login");
    }
  });

  test("client session survives 90 seconds without redirect", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await clientLogin(page, EMAIL!, PASSWORD!);
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      expect(page.url()).not.toContain("/admin/login");
      const snap = await readAuthSnapshot(page);
      expect(snap.hasSession).toBe("true");
      expect(snap.hasUser).toBe("true");
      await page.waitForTimeout(10_000);
    }
    await page.reload();
    await waitForGuardsReady(page);
    expect(page.url()).toContain("/client/");
  });
});