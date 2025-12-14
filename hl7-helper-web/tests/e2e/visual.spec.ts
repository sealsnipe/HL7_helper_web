import { test, expect } from '@playwright/test';

// Sample HL7 message for visual tests
const SAMPLE_ADT_A01 = `MSH|^~\\&|SENDING|FACILITY|RECEIVING|DEST|202401011200||ADT^A01|MSG001|P|2.5
PID|1||12345^^^MRN||DOE^JOHN^MIDDLE||19800101|M`;

test.describe('Visual Regression Tests', () => {
  test('empty editor state', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to fully load
    await expect(page.locator('h1').filter({ hasText: 'HL7 Helper.' })).toBeVisible();

    // Verify we're in the empty state
    await expect(page.locator('text=No Message Loaded')).toBeVisible();

    // Take screenshot
    await expect(page).toHaveScreenshot('empty-editor.png');
  });

  test('parsed message with segments displayed', async ({ page }) => {
    await page.goto('/');

    // Fill and parse the message
    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    // Wait for Visual Editor to be visible
    await expect(page.locator('text=Visual Editor')).toBeVisible();
    await expect(page.locator('.font-mono.text-lg:has-text("MSH")')).toBeVisible();
    await expect(page.locator('.font-mono.text-lg:has-text("PID")')).toBeVisible();

    // Take screenshot
    await expect(page).toHaveScreenshot('parsed-message.png');
  });

  test('expanded segment showing fields', async ({ page }) => {
    await page.goto('/');

    // Parse the message
    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    // Wait for Visual Editor and segments
    await expect(page.locator('text=Visual Editor')).toBeVisible();
    await expect(page.locator('.font-mono.text-lg:has-text("PID")')).toBeVisible();

    // Ensure PID segment is expanded and fields are visible
    const pidFields = page.locator('input[value*="12345"]').first();
    await expect(pidFields).toBeVisible();

    // Take screenshot showing expanded segment with fields
    await expect(page).toHaveScreenshot('expanded-segment.png');
  });

  test('collapsed segments', async ({ page }) => {
    await page.goto('/');

    // Parse the message
    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    // Wait for Visual Editor
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Collapse all segments
    const collapseAllButton = page.locator('button:has-text("Collapse All")');
    await collapseAllButton.click();

    // Verify fields are hidden
    const pidFields = page.locator('input[value*="12345"]').first();
    await expect(pidFields).not.toBeVisible();

    // Take screenshot of collapsed state
    await expect(page).toHaveScreenshot('collapsed-segments.png');
  });

  test('mobile responsive layout', async ({ page }) => {
    // Set mobile viewport (iPhone SE size)
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Wait for the page to load
    await expect(page.locator('h1').filter({ hasText: 'HL7 Helper.' })).toBeVisible();

    // Parse a message
    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    // Wait for Visual Editor
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Take screenshot of mobile layout
    await expect(page).toHaveScreenshot('mobile-layout.png');
  });
});
