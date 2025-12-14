import { test, expect } from '@playwright/test';

test.describe('Sticky Header on Template Pages', () => {
  test('templates page - header container stays sticky while scrolling', async ({ page }) => {
    await page.goto('/templates');

    // Get the sticky header container (first div with sticky class)
    const stickyContainer = page.locator('div.sticky');
    await expect(stickyContainer).toBeVisible();

    // Get initial position
    const initialBox = await stickyContainer.boundingBox();
    const initialY = initialBox?.y ?? 0;

    // Check that computed style has sticky positioning
    const position = await stickyContainer.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe('sticky');

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));

    // Get position after scroll
    const afterBox = await stickyContainer.boundingBox();
    const finalY = afterBox?.y ?? 0;

    // Header should remain fixed at top (y should be 0 or very close, not more than 5px)
    expect(Math.abs(finalY)).toBeLessThan(5);
    expect(stickyContainer).toBeVisible();
  });

  test('templates/create page - header container stays sticky while scrolling', async ({ page }) => {
    await page.goto('/templates/create');

    // Get the sticky header container
    const stickyContainer = page.locator('div.sticky');
    await expect(stickyContainer).toBeVisible();

    // Verify computed style
    const position = await stickyContainer.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe('sticky');

    // Get initial position
    const initialBox = await stickyContainer.boundingBox();
    const initialY = initialBox?.y ?? 0;

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 300));

    // Get position after scroll
    const afterBox = await stickyContainer.boundingBox();
    const finalY = afterBox?.y ?? 0;

    // Header should remain sticky at top
    expect(Math.abs(finalY)).toBeLessThan(5);
    expect(stickyContainer).toBeVisible();
  });

  test('templates/use page - header container stays sticky while scrolling', async ({ page }) => {
    await page.goto('/templates/use');

    // Get the sticky header container
    const stickyContainer = page.locator('div.sticky');
    await expect(stickyContainer).toBeVisible();

    // Verify computed style
    const position = await stickyContainer.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe('sticky');

    // Get initial position
    const initialBox = await stickyContainer.boundingBox();
    const initialY = initialBox?.y ?? 0;

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 300));

    // Get position after scroll
    const afterBox = await stickyContainer.boundingBox();
    const finalY = afterBox?.y ?? 0;

    // Header should remain sticky at top
    expect(Math.abs(finalY)).toBeLessThan(5);
    expect(stickyContainer).toBeVisible();
  });
});
