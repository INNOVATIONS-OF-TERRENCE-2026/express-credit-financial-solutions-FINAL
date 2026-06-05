import { test, expect, type Page } from "@playwright/test";

/**
 * Mobile / responsive visual + layout regression check for the
 * funding-readiness homepage. Asserts typography scale, line-height,
 * and section/card spacing stay consistent at common breakpoints.
 *
 * Visual snapshots are stored next to this spec under
 * homepage-responsive.spec.ts-snapshots/. Update with:
 *   bunx playwright test e2e/homepage-responsive.spec.ts --update-snapshots
 */

type Viewport = {
  name: string;
  width: number;
  height: number;
  // Acceptable computed font-size range for the hero h1 at this width.
  heroFontSizeMin: number;
  heroFontSizeMax: number;
};

const VIEWPORTS: Viewport[] = [
  { name: "mobile-375", width: 375, height: 812, heroFontSizeMin: 40, heroFontSizeMax: 52 },
  { name: "mobile-390", width: 390, height: 844, heroFontSizeMin: 40, heroFontSizeMax: 52 },
  { name: "tablet-768", width: 768, height: 1024, heroFontSizeMin: 44, heroFontSizeMax: 80 },
  { name: "desktop-1280", width: 1280, height: 800, heroFontSizeMin: 68, heroFontSizeMax: 140 },
];

async function settle(page: Page) {
  // Disable animations & transitions for stable visual snapshots.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
}

test.describe("Homepage — responsive typography & spacing", () => {
  for (const vp of VIEWPORTS) {
    test(`renders cleanly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "networkidle" });
      await settle(page);

      // --- Typography: hero h1 font-size scales by breakpoint ---
      const heroH1 = page.locator("h1").first();
      await expect(heroH1).toBeVisible();
      const heroMetrics = await heroH1.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          fontSize: parseFloat(cs.fontSize),
          lineHeight: parseFloat(cs.lineHeight),
        };
      });
      expect(heroMetrics.fontSize).toBeGreaterThanOrEqual(vp.heroFontSizeMin);
      expect(heroMetrics.fontSize).toBeLessThanOrEqual(vp.heroFontSizeMax);
      // Luxury hero leading is tight (~0.95).
      const ratio = heroMetrics.lineHeight / heroMetrics.fontSize;
      expect(ratio).toBeGreaterThan(0.85);
      expect(ratio).toBeLessThan(1.25);

      // --- Body line-height stays readable (>= 1.4x) ---
      const paragraph = page.locator("p").first();
      if (await paragraph.count()) {
        const pMetrics = await paragraph.evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            fontSize: parseFloat(cs.fontSize),
            lineHeight: parseFloat(cs.lineHeight),
          };
        });
        const pRatio = pMetrics.lineHeight / pMetrics.fontSize;
        expect(pRatio).toBeGreaterThanOrEqual(1.3);
        expect(pRatio).toBeLessThanOrEqual(2.0);
      }

      // --- No horizontal overflow on small screens ---
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      // Allow 2px of subpixel slack.
      expect(overflow.scroll, `horizontal overflow at ${vp.width}px`).toBeLessThanOrEqual(
        overflow.client + 2,
      );

      // --- Visual regression: hero region snapshot ---
      const hero = page.locator("section, header").first();
      await expect(hero).toHaveScreenshot(`hero-${vp.name}.png`, {
        maxDiffPixelRatio: 0.03,
        animations: "disabled",
      });

      // --- Visual regression: full-page snapshot (catches card spacing drift) ---
      await expect(page).toHaveScreenshot(`homepage-${vp.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.04,
        animations: "disabled",
      });
    });
  }
});
