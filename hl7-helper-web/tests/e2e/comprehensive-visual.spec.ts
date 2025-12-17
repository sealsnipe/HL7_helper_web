import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

const THEMES = ['light', 'dark', 'aurora', 'matrix', 'cyberpunk', 'ocean', 'sunset'];

const SAMPLE_HL7 = `MSH|^~\\&|EPIC|HOSP|LAB|FAC|202401151430||ADT^A01|MSG001|P|2.5
PID|1||MRN12345^^^HOSP^MR||SMITH^JANE^M||19850315|F||W|123 MAIN ST^^CITY^ST^12345||555-1234|||M||ACC123456
PV1|1|I|ICU^101^A|E|||12345^DOC^JOHN^^^MD|||MED||||ADM|INS|||12345^DOC^JOHN^^^MD|OUT|ACC123456`;

const LIVE_PARSE_DELAY = 500; // Debounce + rendering buffer

// Helper function to fill textarea and wait for live parsing
async function fillAndWaitForParse(page: import('@playwright/test').Page, text: string) {
  const textarea = page.locator('textarea[placeholder*="MSH"]');
  await textarea.fill(text);
  await page.waitForTimeout(LIVE_PARSE_DELAY);
}

test.describe('Comprehensive Visual Review', () => {
  test.describe('Main Editor Page (/)', () => {
    for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
      test(`Empty state - ${vpName}`, async ({ page }) => {
        await page.setViewportSize(vpSize);
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        const screenshot = await page.screenshot({ fullPage: true });
        await page.screenshot({
          path: `D:\\Projects\\HL7_Helper_web\\visual-review-screenshots\\comprehensive\\01-main-empty-${vpName}.png`,
          fullPage: true,
        });

        // Verify layout
        const inputArea = await page.locator('textarea').first();
        await expect(inputArea).toBeVisible();
      });

      test(`Loaded state with message - ${vpName}`, async ({ page }) => {
        await page.setViewportSize(vpSize);
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Load message - auto-parsing
        await fillAndWaitForParse(page, SAMPLE_HL7);

        await page.screenshot({
          path: `D:\\Projects\\HL7_Helper_web\\visual-review-screenshots\\comprehensive\\02-main-loaded-${vpName}.png`,
          fullPage: true,
        });

        // Verify segments visible
        const mshSegment = page.locator('.font-mono.text-lg:has-text("MSH")');
        await expect(mshSegment).toBeVisible();
      });

      test(`Expanded segment - ${vpName}`, async ({ page }) => {
        await page.setViewportSize(vpSize);
        await page.goto('http://localhost:3000');

        await fillAndWaitForParse(page, SAMPLE_HL7);

        // Click first segment to expand
        const firstSegment = await page.locator('.font-mono.text-lg:has-text("MSH")').first();
        await firstSegment.click();
        await page.waitForTimeout(300);

        await page.screenshot({
          path: `D:\\Projects\\HL7_Helper_web\\visual-review-screenshots\\comprehensive\\03-main-expanded-${vpName}.png`,
          fullPage: true,
        });
      });

      test(`Editing state - ${vpName}`, async ({ page }) => {
        await page.setViewportSize(vpSize);
        await page.goto('http://localhost:3000');

        await fillAndWaitForParse(page, SAMPLE_HL7);

        // Click expand all
        const expandAllBtn = page.locator('button:has-text("Expand All")');
        if (await expandAllBtn.isVisible()) {
          await expandAllBtn.click();
          await page.waitForTimeout(300);
        }

        // Find first editable field and click
        const firstField = await page.locator('input:not([readonly])').first();
        if (await firstField.isVisible()) {
          await firstField.click();
        }

        await page.screenshot({
          path: `D:\\Projects\\HL7_Helper_web\\visual-review-screenshots\\comprehensive\\04-main-editing-${vpName}.png`,
          fullPage: true,
        });
      });
    }

    // Theme testing on desktop viewport
    for (const theme of THEMES) {
      test(`Theme: ${theme}`, async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.desktop);
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Load message
        await fillAndWaitForParse(page, SAMPLE_HL7);

        // Switch theme multiple times if needed to reach target
        const maxClicks = 10;
        for (let i = 0; i < maxClicks; i++) {
          const themeButton = await page
            .locator(
              'button[aria-label*="theme"], button:has-text("Theme"), button:has([class*="sun"]), button:has([class*="moon"])'
            )
            .first();
          if (await themeButton.isVisible()) {
            await themeButton.click();
            await page.waitForTimeout(200);

            // Check if we reached desired theme by inspecting body class
            const bodyClass = await page.evaluate(() => document.body.className);
            if (bodyClass.includes(theme)) {
              break;
            }
          }
        }

        await page.screenshot({
          path: `D:\\Projects\\HL7_Helper_web\\visual-review-screenshots\\comprehensive\\05-main-theme-${theme}.png`,
          fullPage: true,
        });
      });
    }
  });

  test.describe('Templates List Page (/templates)', () => {
    for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
      test(`Templates list - ${vpName}`, async ({ page }) => {
        await page.setViewportSize(vpSize);
        await page.goto('http://localhost:3000/templates');
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: `D:\\Projects\\HL7_Helper_web\\visual-review-screenshots\\comprehensive\\06-templates-list-${vpName}.png`,
          fullPage: true,
        });

        // Verify page loaded
        const heading = await page.locator('h1, h2').first();
        await expect(heading).toBeVisible();
      });
    }

    test('Create template modal', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('http://localhost:3000/templates');
      await page.waitForLoadState('networkidle');

      // Click create button
      const createBtn = await page
        .locator('button:has-text("Create"), button:has-text("New")')
        .first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(300);

        await page.screenshot({
          path: 'D:\\Projects\\HL7_Helper_web\\visual-review-screenshots\\comprehensive\\07-templates-create-modal.png',
          fullPage: true,
        });
      }
    });
  });

  test.describe('Use Template Page (/templates/use)', () => {
    for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
      test(`Use template page - ${vpName}`, async ({ page }) => {
        await page.setViewportSize(vpSize);
        await page.goto('http://localhost:3000/templates/use');
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: `D:\\Projects\\HL7_Helper_web\\visual-review-screenshots\\comprehensive\\08-use-template-empty-${vpName}.png`,
          fullPage: true,
        });

        // Verify page structure
        const mainContent = await page.locator('main, [role="main"]').first();
        await expect(mainContent).toBeVisible();
      });

      test(`Use template with selection - ${vpName}`, async ({ page }) => {
        await page.setViewportSize(vpSize);
        await page.goto('http://localhost:3000/templates/use');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Try to select a template from dropdown
        const select = await page.locator('select').first();
        if (await select.isVisible()) {
          const options = await select.locator('option').count();
          if (options > 1) {
            await select.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            await page.screenshot({
              path: `D:\\Projects\\HL7_Helper_web\\visual-review-screenshots\\comprehensive\\09-use-template-selected-${vpName}.png`,
              fullPage: true,
            });
          }
        }
      });
    }
  });

  test.describe('Console Errors', () => {
    test('Check for console errors on main page', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Interact with page
      await fillAndWaitForParse(page, SAMPLE_HL7);
      await page.waitForTimeout(500);

      expect(consoleErrors).toHaveLength(0);
    });

    test('Check for console errors on templates page', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('http://localhost:3000/templates');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      expect(consoleErrors).toHaveLength(0);
    });

    test('Check for console errors on use template page', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('http://localhost:3000/templates/use');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      expect(consoleErrors).toHaveLength(0);
    });
  });
});
