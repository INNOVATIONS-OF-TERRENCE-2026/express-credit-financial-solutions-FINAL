import { test, expect, type Page } from "@playwright/test";

const EXPECTED_TITLE =
  "Express Credit & Financial Solutions | Credit Restoration & Funding Readiness";

const EXPECTED_DESCRIPTION =
  "Premium credit restoration and funding readiness firm based in Texas. Structured FCRA-aligned strategy, Metro 2 dispute preparation, and mortgage and auto financing preparation. Results vary by client profile.";

const EXPECTED_OG_DESCRIPTION =
  "A premium credit restoration firm built for funding readiness. Structured strategy, Metro 2 dispute preparation, and mortgage and auto financing support.";

const EXPECTED_TWITTER_DESCRIPTION =
  "Premium credit restoration firm built for funding readiness. Structured FCRA-aligned strategy and Metro 2 dispute preparation.";

const BANNED_PHRASES = [
  "#1 rated",
  "AI-powered",
  "guaranteed results",
  "boost credit scores 100+",
  "domination",
  "dominate",
  "skyrocket",
];

async function metaContent(page: Page, selector: string): Promise<string> {
  return (await page.locator(selector).first().getAttribute("content")) ?? "";
}

test.describe("Homepage SEO — funding readiness positioning", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test("document title matches funding readiness positioning", async ({ page }) => {
    await expect(page).toHaveTitle(EXPECTED_TITLE);
  });

  test("meta description, OG, Twitter, and canonical tags are correct", async ({ page }) => {
    expect(await metaContent(page, 'meta[name="description"]')).toBe(EXPECTED_DESCRIPTION);
    expect(await metaContent(page, 'meta[name="title"]')).toBe(EXPECTED_TITLE);

    // OpenGraph / Facebook
    expect(await metaContent(page, 'meta[property="og:title"]')).toBe(EXPECTED_TITLE);
    expect(await metaContent(page, 'meta[property="og:description"]')).toBe(EXPECTED_OG_DESCRIPTION);
    expect(await metaContent(page, 'meta[property="og:type"]')).toBe("website");
    expect(await metaContent(page, 'meta[property="og:url"]')).toContain("expresscreditfinancials.org");
    expect(await metaContent(page, 'meta[property="og:image"]')).toMatch(/^https?:\/\//);

    // Twitter
    expect(await metaContent(page, 'meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(await metaContent(page, 'meta[name="twitter:title"]')).toBe(EXPECTED_TITLE);
    expect(await metaContent(page, 'meta[name="twitter:description"]')).toBe(EXPECTED_TWITTER_DESCRIPTION);

    // Canonical (Google) + geo + robots
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href");
    expect(canonical).toContain("expresscreditfinancials.org");
    expect(await metaContent(page, 'meta[name="robots"]')).toContain("index");
    expect(await metaContent(page, 'meta[name="geo.region"]')).toBe("US-TX");
  });

  test("no banned over-claim language in meta tags or title", async ({ page }) => {
    const haystack = [
      await page.title(),
      await metaContent(page, 'meta[name="description"]'),
      await metaContent(page, 'meta[property="og:title"]'),
      await metaContent(page, 'meta[property="og:description"]'),
      await metaContent(page, 'meta[name="twitter:title"]'),
      await metaContent(page, 'meta[name="twitter:description"]'),
      await metaContent(page, 'meta[name="keywords"]'),
    ]
      .join(" \n ")
      .toLowerCase();

    for (const phrase of BANNED_PHRASES) {
      expect(haystack, `Banned phrase "${phrase}" must not appear in SEO tags`).not.toContain(
        phrase.toLowerCase(),
      );
    }
  });
});
