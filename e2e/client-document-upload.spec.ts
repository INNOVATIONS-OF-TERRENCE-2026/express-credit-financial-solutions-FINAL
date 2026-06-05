import { test, expect, Page } from "@playwright/test";
import {
  adminLogin,
  clientLogin,
  enableAuthDebug,
  waitForGuardsReady,
} from "./helpers/auth";

const CLIENT_EMAIL = process.env.E2E_CLIENT_EMAIL;
const CLIENT_PASSWORD = process.env.E2E_CLIENT_PASSWORD;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

/**
 * Minimal valid PDF bytes — a single empty page. Enough for the upload pipeline
 * (MIME = application/pdf, non-zero length) and avoids checking a real binary
 * into the repo.
 */
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n" +
    "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]>>endobj\n" +
    "xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000100 00000 n \n" +
    "trailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n",
  "utf8"
);

/**
 * Drives the SecureVerificationUpload "Other Supporting Documents" tile, which
 * is optional (won't collide with required-doc state) and writes a row that
 * the admin Document Inbox surfaces via the `documents` table.
 */
async function uploadOtherSupportingDoc(page: Page, fileName: string) {
  await page.goto("/client/documents");
  await waitForGuardsReady(page);

  // Each UploadZone renders a Label + dropzone region; the hidden <input
  // type="file"> from react-dropzone lives inside the dropzone div directly
  // under that label. Scope to the "Other Supporting Documents" tile.
  const otherTile = page
    .locator("label", { hasText: /Other Supporting Documents/i })
    .locator("..");
  await otherTile.waitFor({ state: "visible" });

  const fileInput = otherTile.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: fileName,
    mimeType: "application/pdf",
    buffer: MINIMAL_PDF,
  });

  // The tile flips to a green "Uploaded" state once the storage + insert
  // round-trip resolves.
  await expect(otherTile.getByText(/Uploaded/i)).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("client document upload + admin/client visibility", () => {
  test.beforeEach(async ({ page }) => {
    await enableAuthDebug(page);
  });

  test.skip(
    !CLIENT_EMAIL || !CLIENT_PASSWORD,
    "E2E_CLIENT_EMAIL/PASSWORD not provided"
  );

  test("client uploads a PDF and sees it after refresh", async ({ page }) => {
    const fileName = `e2e-client-upload-${Date.now()}.pdf`;

    await clientLogin(page, CLIENT_EMAIL!, CLIENT_PASSWORD!);
    await uploadOtherSupportingDoc(page, fileName);

    // Hard refresh — the verification status card reads `documents` with
    // doc_type='other_supporting' and increments its counter when ≥1 row
    // is owned by the signed-in user.
    await page.reload();
    await waitForGuardsReady(page);

    const card = page.locator("text=/Verification Documents/i").locator("..");
    await expect(
      card.getByText(/Other Supporting Documents \(\d+\)/i)
    ).toBeVisible({ timeout: 30_000 });
  });

  test("admin sees the uploaded PDF in the Document Inbox after refresh", async ({
    browser,
  }) => {
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASSWORD,
      "E2E_ADMIN_EMAIL/PASSWORD not provided"
    );

    const fileName = `e2e-admin-visible-${Date.now()}.pdf`;

    // 1. Client uploads in its own context.
    const clientCtx = await browser.newContext();
    const clientPage = await clientCtx.newPage();
    await enableAuthDebug(clientPage);
    await clientLogin(clientPage, CLIENT_EMAIL!, CLIENT_PASSWORD!);
    await uploadOtherSupportingDoc(clientPage, fileName);
    await clientCtx.close();

    // 2. Admin in a fresh context — must see the file in /admin/documents
    //    after a hard refresh, with the row searchable by filename token.
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await enableAuthDebug(adminPage);
    await adminLogin(adminPage, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await adminPage.goto("/admin/documents");
    await waitForGuardsReady(adminPage);
    await adminPage.reload();
    await waitForGuardsReady(adminPage);

    // The list autoloads via useAdminClientDocuments; filter by the unique
    // filename token rather than scrolling the entire inbox.
    const search = adminPage.getByPlaceholder(/search client, file name/i);
    await search.fill(fileName);

    const row = adminPage.locator("tr", { hasText: fileName });
    await expect(row).toBeVisible({ timeout: 30_000 });
    // Sanity: View + Download action buttons are wired (filePath present).
    await expect(
      row.getByRole("button", { name: new RegExp(`View ${fileName}`, "i") })
    ).toBeEnabled();
    await expect(
      row.getByRole("button", { name: new RegExp(`Download ${fileName}`, "i") })
    ).toBeEnabled();

    await adminCtx.close();
  });
});