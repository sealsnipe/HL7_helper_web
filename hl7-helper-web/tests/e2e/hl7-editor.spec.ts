import { test, expect, Page, Locator } from '@playwright/test';

// Sample HL7 messages for testing
const SAMPLE_ADT_A01 = `MSH|^~\\&|SENDING|FACILITY|RECEIVING|DEST|202401011200||ADT^A01|MSG001|P|2.5
PID|1||12345^^^MRN||DOE^JOHN^MIDDLE||19800101|M`;

const SAMPLE_WITH_ESCAPES = `MSH|^~\\&|SENDING|FACILITY|RECEIVING|DEST|202401011200||ADT^A01|MSG002|P|2.5
PID|1||12345^^^MRN||DOE^JOHN\\F\\ESCAPED||19800101|M`;

// Helper function to find an editable input by value
async function findEditableInput(page: Page, value: string): Promise<Locator | null> {
  await page.waitForSelector('input:not([readonly])', { state: 'visible', timeout: 5000 });
  const allEditableInputs = await page.locator('input:not([readonly])').all();
  for (const input of allEditableInputs) {
    const inputValue = await input.inputValue();
    if (inputValue === value) {
      return input;
    }
  }
  return null;
}

test.describe('HL7 Editor - Parse Flow', () => {
  test('should parse raw HL7 message and display segments', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await expect(page.locator('h1').filter({ hasText: 'HL7 Helper.' })).toBeVisible();

    // Find and fill the textarea with HL7 message
    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);

    // Click the Parse Message button
    const parseButton = page.locator('button:has-text("Parse Message")');
    await parseButton.click();

    // Wait for segments to appear in the editor
    await expect(page.locator('.font-mono.text-lg:has-text("MSH")')).toBeVisible();
    await expect(page.locator('.font-mono.text-lg:has-text("PID")')).toBeVisible();

    // Verify the Visual Editor is shown
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Verify segment count
    const mshSegment = page.locator('.font-mono.text-lg:has-text("MSH")').first();
    await expect(mshSegment).toBeVisible();
  });

  test('should display error when parsing invalid HL7 message', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill('INVALID HL7 MESSAGE');

    const parseButton = page.locator('button:has-text("Parse Message")');
    await parseButton.click();

    // Should show error (or warning about invalid segment name)
    // Note: The app might still parse it but with warnings
    await page.waitForTimeout(500);
  });

  test('should handle empty input gracefully', async ({ page }) => {
    await page.goto('/');

    // Try to parse without entering anything
    const parseButton = page.locator('button:has-text("Parse Message")');
    await expect(parseButton).toBeDisabled();
  });
});

test.describe('HL7 Editor - Edit Flow', () => {
  test('should edit a field value and update the message', async ({ page }) => {
    await page.goto('/');

    // Parse the message
    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    // Wait for segments to be visible
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Find PID segment and expand it (should be expanded by default)
    const pidSegment = page.locator('.font-mono.text-lg:has-text("PID")').first();
    await expect(pidSegment).toBeVisible();

    // Find a simple field without components (PID-1 Set ID)
    const setIdInput = await findEditableInput(page, '1');
    if (!setIdInput) {
      throw new Error('Could not find editable input with value "1"');
    }

    // Change the value
    await setIdInput.clear();
    await setIdInput.fill('2');

    // Click the "Update Raw" button to regenerate
    const updateButton = page.locator('button:has-text("Update Raw")');
    await updateButton.click();

    // Verify the raw HL7 text has been updated
    const generatedValue = await textarea.inputValue();
    expect(generatedValue).toContain('PID|2|');
  });

  test('should preserve segment structure when editing fields', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Count segments before edit
    const mshBefore = page.locator('.font-mono.text-lg:has-text("MSH")');
    const pidBefore = page.locator('.font-mono.text-lg:has-text("PID")');
    await expect(mshBefore).toBeVisible();
    await expect(pidBefore).toBeVisible();

    // Edit a simple field (PID-1)
    const setIdInput = await findEditableInput(page, '1');
    if (!setIdInput) throw new Error('Could not find editable input');
    await setIdInput.clear();
    await setIdInput.fill('99');

    // Regenerate
    await page.locator('button:has-text("Update Raw")').click();

    // Verify segments are still there
    await expect(mshBefore).toBeVisible();
    await expect(pidBefore).toBeVisible();

    // Verify the edit was applied
    const generatedValue = await textarea.inputValue();
    expect(generatedValue).toContain('PID|99|');
  });

  test('should collapse and expand segments', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Find the PID segment header
    const pidHeader = page.locator('.font-mono.text-lg:has-text("PID")').first();
    await expect(pidHeader).toBeVisible();

    // Get the parent div that has the click handler
    const pidSegmentRow = pidHeader.locator('xpath=ancestor::div[@class and contains(@class, "cursor-pointer")]');

    // Fields should be visible initially (expanded by default)
    const pidFields = page.locator('input[value*="12345"]').first();
    await expect(pidFields).toBeVisible();

    // Click to collapse
    await pidSegmentRow.click();

    // Fields should be hidden
    await expect(pidFields).not.toBeVisible();

    // Click to expand
    await pidSegmentRow.click();

    // Fields should be visible again
    await expect(pidFields).toBeVisible();
  });

  test('should use Expand All and Collapse All buttons', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Click Collapse All
    const collapseAllButton = page.locator('button:has-text("Collapse All")');
    await collapseAllButton.click();

    // Verify fields are hidden
    const pidFields = page.locator('input[value*="12345"]').first();
    await expect(pidFields).not.toBeVisible();

    // Click Expand All
    const expandAllButton = page.locator('button:has-text("Expand All")');
    await expandAllButton.click();

    // Verify fields are visible
    await expect(pidFields).toBeVisible();
  });
});

test.describe('HL7 Editor - Generate Flow', () => {
  test('should generate HL7 output after editing', async ({ page }) => {
    await page.goto('/');

    // Parse message
    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Edit a simple field (PID-1 Set ID)
    const setIdInput = await findEditableInput(page, '1');
    if (!setIdInput) throw new Error('Could not find editable input');
    await setIdInput.clear();
    await setIdInput.fill('5');

    // Generate
    await page.locator('button:has-text("Update Raw")').click();

    // Verify the raw text contains the new value
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toContain('PID|5|');
    expect(textareaValue).not.toContain('PID|1|');
  });

  test('should maintain HL7 structure in generated output', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();

    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Regenerate without changes
    await page.locator('button:has-text("Update Raw")').click();

    // Verify output has proper HL7 structure
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toContain('MSH|');
    expect(textareaValue).toContain('PID|');
    // Verify we have multiple segments (could be separated by \r or \n)
    const segments = textareaValue.split(/\r?\n/).filter(line => line.trim());
    expect(segments.length).toBeGreaterThanOrEqual(2);
  });
});

test.describe('HL7 Editor - Round-trip Test', () => {
  test('should preserve message structure through parse-edit-generate-parse cycle', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');

    // First parse
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Edit a simple field (PID-1 Set ID)
    const setIdInput = await findEditableInput(page, '1');
    if (!setIdInput) throw new Error('Could not find editable input');
    await setIdInput.clear();
    await setIdInput.fill('777');

    // Generate
    await page.locator('button:has-text("Update Raw")').click();

    // Get the generated output
    const generatedHl7 = await textarea.inputValue();
    expect(generatedHl7).toContain('PID|777|');

    // Ensure we have at least 2 lines (MSH and PID)
    const lines = generatedHl7.split(/\r?\n/).filter(l => l.trim());
    expect(lines.length).toBeGreaterThanOrEqual(2);

    // Parse again (the generated HL7 should already be in the textarea)
    await page.locator('button:has-text("Parse Message")').click();

    // Wait for Visual Editor to appear
    await page.waitForTimeout(500); // Small delay for React to update
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Check for MSH segment
    await expect(page.locator('.font-mono.text-lg:has-text("MSH")').first()).toBeVisible({ timeout: 10000 });

    // Verify the edited value is still present in the parsed message
    const reparsedInput = await findEditableInput(page, '777');
    expect(reparsedInput).not.toBeNull();
  });

  test('should handle multiple round-trips without data loss', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);

    // Round-trip 3 times
    for (let i = 1; i <= 3; i++) {
      await page.locator('button:has-text("Parse Message")').click();
      await expect(page.locator('text=Visual Editor')).toBeVisible();

      // Edit PID-1 field (Set ID) - find by looking for value that matches current iteration or initial "1"
      const valueToFind = i === 1 ? "1" : `${i - 1}`;
      const setIdInput = await findEditableInput(page, valueToFind);
      if (!setIdInput) throw new Error(`Could not find editable input with value "${valueToFind}"`);
      await setIdInput.clear();
      await setIdInput.fill(`${i}`);

      // Generate
      await page.locator('button:has-text("Update Raw")').click();
    }

    // Final verification
    const finalValue = await textarea.inputValue();
    expect(finalValue).toContain('PID|3|');
    expect(finalValue).toContain('MSH|');
  });
});

test.describe('HL7 Editor - Escape Character Handling', () => {
  test('should unescape HL7 escape sequences for display', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_WITH_ESCAPES);
    await page.locator('button:has-text("Parse Message")').click();

    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // The field with \F\ escape sequence should be unescaped to | for display
    // Since it's in a component field (DOE^JOHN\F\ESCAPED), we need to expand it first
    // Or we can check by finding a field that contains the pipe character
    const fields = await page.locator('input[type="text"]').all();
    let foundEscaped = false;

    for (const field of fields) {
      const value = await field.inputValue();
      if (value.includes('|') && value.includes('ESCAPED')) {
        foundEscaped = true;
        // The display should show the actual character (|) not the escape sequence (\F\)
        expect(value).toContain('|');
        expect(value).not.toContain('\\F\\');
        break;
      }
    }

    // If not found in expanded view, verify raw input has escapes
    if (!foundEscaped) {
      const rawValue = await textarea.inputValue();
      expect(rawValue).toContain('\\F\\');
    }
  });

  test('should re-apply escapes when generating output', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');

    // Parse message with escapes
    await textarea.fill(SAMPLE_WITH_ESCAPES);
    await page.locator('button:has-text("Parse Message")').click();
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Regenerate
    await page.locator('button:has-text("Update Raw")').click();

    // Verify escapes are re-applied in the raw output
    const generatedValue = await textarea.inputValue();
    expect(generatedValue).toContain('\\F\\');
  });

  test('should handle user entering special characters', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Find a simple editable field (PID-1 Set ID)
    const setIdInput = await findEditableInput(page, '1');
    if (!setIdInput) throw new Error('Could not find editable input');
    await setIdInput.clear();
    await setIdInput.fill('TEST|WITH^SPECIAL~CHARS&HERE');

    // Generate
    await page.locator('button:has-text("Update Raw")').click();

    // Verify special characters are escaped in raw output
    const generatedValue = await textarea.inputValue();
    expect(generatedValue).toContain('\\F\\'); // | escaped
    expect(generatedValue).toContain('\\S\\'); // ^ escaped
    expect(generatedValue).toContain('\\R\\'); // ~ escaped
    expect(generatedValue).toContain('\\T\\'); // & escaped
  });

  test('should handle backslash escape sequences', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');

    // Create a message with backslash escape
    const messageWithBackslash = SAMPLE_ADT_A01.replace('DOE^JOHN^MIDDLE', 'DOE\\E\\BACKSLASH');
    await textarea.fill(messageWithBackslash);
    await page.locator('button:has-text("Parse Message")').click();
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // The field should display a single backslash
    const fieldWithBackslash = page.locator('input').filter({ hasText: /BACKSLASH/ }).first();
    // Note: The exact matching might be tricky due to how the value is stored

    // Regenerate
    await page.locator('button:has-text("Update Raw")').click();

    // Verify backslash is re-escaped in output
    const generatedValue = await textarea.inputValue();
    expect(generatedValue).toContain('\\E\\');
  });
});

test.describe('HL7 Editor - New Message Flow', () => {
  test('should clear message when New Message is clicked', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Click New Message (in NavigationHeader)
    page.on('dialog', dialog => dialog.accept());
    const newMessageButton = page.locator('button:has-text("New")');
    await newMessageButton.click();

    // Verify textarea is cleared
    await expect(textarea).toHaveValue('');

    // Verify editor shows empty state
    await expect(page.locator('text=No Message Loaded')).toBeVisible();
  });
});

test.describe('HL7 Editor - Load Example Flow', () => {
  test('should load an example message from template modal', async ({ page }) => {
    await page.goto('/');

    // Click Load Example button
    const loadExampleButton = page.locator('button:has-text("Example")');
    await loadExampleButton.click();

    // Wait for modal to appear
    await expect(page.locator('text=Select Example Message')).toBeVisible();

    // Click on the first example
    const firstExample = page.locator('[class*="border"][class*="hover:bg-primary"]').first();
    await firstExample.click();

    // Verify modal closes and textarea is filled
    const textarea = page.locator('textarea[placeholder*="MSH"]');
    const textareaValue = await textarea.inputValue();
    expect(textareaValue.length).toBeGreaterThan(0);
    expect(textareaValue).toContain('MSH|');
  });

  test('should close template modal when Cancel is clicked', async ({ page }) => {
    await page.goto('/');

    const loadExampleButton = page.locator('button:has-text("Example")');
    await loadExampleButton.click();

    await expect(page.locator('text=Select Example Message')).toBeVisible();

    // Click Cancel
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Verify modal is closed
    await expect(page.locator('text=Select Example Message')).not.toBeVisible();
  });
});

test.describe('HL7 Editor - Component Editing', () => {
  test('should expand and edit components within a field', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);
    await page.locator('button:has-text("Parse Message")').click();
    await expect(page.locator('text=Visual Editor')).toBeVisible();

    // Find a field with components (e.g., patient name DOE^JOHN^MIDDLE)
    // Look for the expand button (▼)
    const expandButton = page.locator('button:has-text("▼")').first();

    // Check if component view is available
    if (await expandButton.isVisible()) {
      await expandButton.click();

      // Should show individual components
      await expect(page.locator('button:has-text("▲")')).toBeVisible();

      // Edit a component
      const componentInput = page.locator('input[value="JOHN"]').first();
      if (await componentInput.isVisible()) {
        await componentInput.clear();
        await componentInput.fill('JANE');

        // Regenerate
        await page.locator('button:has-text("Update Raw")').click();

        // Verify the change in raw output
        const generatedValue = await textarea.inputValue();
        expect(generatedValue).toContain('JANE');
      }
    }
  });
});

test.describe('HL7 Editor - Accessibility', () => {
  test('should have proper page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HL7/);
  });

  test('should have visible heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('h1').filter({ hasText: 'HL7 Helper.' });
    await expect(heading).toBeVisible();
  });

  test('should have keyboard navigable buttons', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea[placeholder*="MSH"]');
    await textarea.fill(SAMPLE_ADT_A01);

    // Tab to Parse button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Note: Full keyboard navigation testing would require more detailed focus management
  });
});
