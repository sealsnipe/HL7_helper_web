import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('home page loads successfully', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Verify the page title contains "HL7"
    await expect(page).toHaveTitle(/HL7/);

    // Verify the main hero heading is visible
    await expect(page.getByRole('heading', { name: 'HL7 Helper.' })).toBeVisible();

    // Verify the main editor textarea is visible
    await expect(page.getByPlaceholder(/MSH/i)).toBeVisible();

    // Verify the Parse Message button is visible
    await expect(page.getByRole('button', { name: /Parse Message/i })).toBeVisible();
  });
});
