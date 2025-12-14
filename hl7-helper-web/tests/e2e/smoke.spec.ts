import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('home page loads successfully', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Verify the page title contains "HL7"
    await expect(page).toHaveTitle(/HL7/);

    // Verify the main editor textarea is visible
    await expect(page.getByPlaceholder(/MSH/i)).toBeVisible();

    // Verify the empty state message is shown
    await expect(page.locator('text=No Message Loaded')).toBeVisible();

    // Verify navigation buttons are present (New Message, Load Example)
    await expect(page.getByRole('button', { name: /New/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Example/i })).toBeVisible();
  });
});
