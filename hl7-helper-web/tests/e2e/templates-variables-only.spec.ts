import { test, expect, Page } from '@playwright/test';

/**
 * E2E Regression Tests: Variables Only Data Integrity Fix
 *
 * CRITICAL BUG (FIXED):
 * When editing templates in "Variables Only" mode, ALL segments without
 * HELPERVARIABLE placeholders were permanently deleted on save.
 *
 * ROOT CAUSE:
 * - User switches to "Variables Only" view mode
 * - displaySegments shows filtered view (only fields with variables)
 * - MessageEditor receives filtered segments
 * - On edit, handleEditorUpdate received filtered segments back
 * - Generated HL7 from filtered segments = DATA LOSS
 *
 * FIX:
 * - Added fullSegments state to preserve complete data
 * - handleEditorUpdate merges filtered updates back into fullSegments
 * - Generates HL7 from fullSegments, not displaySegments
 *
 * THESE TESTS:
 * Verify the complete user workflow end-to-end, ensuring all segments
 * are preserved when editing in Variables Only mode.
 */

// Debounce delay for parsing
const PARSE_DELAY = 500;

// Test data - Message with both variable and non-variable fields
const TEST_MESSAGE_WITH_VARIABLES = `MSH|^~\\&|SEND|FAC|RECV|DEST|202401011200||ADT^A01|MSG001|P|2.5\rPID|1||HELPERVARIABLE^^^MRN||DOE^JOHN||19800101|M\rPV1|1|I|WARD1^BED2||||||SUR||||||ADM\rOBX|1|ST|CODE||ResultValue|||F`;

// Message with multiple variables in different segments
const TEST_MESSAGE_MULTI_VARIABLES = `MSH|^~\\&|SEND|FAC|RECV|DEST|202401011200||ADT^A01|MSG001|P|2.5\rPID|1||HELPERVARIABLE^^^MRN||HELPERVARIABLE2^JOHN||19800101|M\rPV1|1|I|WARD1^BED2||||||SUR||||||ADM\rOBX|1|ST|HELPERVARIABLE3||ResultValue|||F\rOBX|2|ST|STABLE||StableValue|||F`;

/**
 * Helper: Navigate to templates page and wait for it to load
 */
async function navigateToTemplates(page: Page) {
  await page.goto('/templates');
  await page.waitForSelector('text=Template Management', { timeout: 5000 });
}

/**
 * Helper: Create a new template with specific content
 */
async function createTemplate(page: Page, name: string, content: string) {
  // Click New Template button
  const newButton = page.locator('button:has-text("New Template")');
  await newButton.click();

  // Wait for the new template row to expand in edit mode
  await page.waitForTimeout(500);

  // Fill in template name using data-testid
  const nameInput = page.locator('[data-testid="template-name-input"]');
  await nameInput.clear();
  await nameInput.fill(name);

  // Fill in content
  const contentTextarea = page.locator('[data-testid="edit-content-textarea"]');
  await contentTextarea.clear();
  await contentTextarea.fill(content);

  // Wait for parsing
  await page.waitForTimeout(PARSE_DELAY);

  return contentTextarea;
}

/**
 * Helper: Click Save and wait for save to complete
 */
async function saveTemplate(page: Page) {
  const saveButton = page.locator('[data-testid="template-save-btn"]');
  await saveButton.click();
  await page.waitForTimeout(300);
}

/**
 * Helper: Switch to Variables Only view mode
 */
async function switchToVariablesOnly(page: Page) {
  const variablesButton = page.locator('button:has-text("Variables Only")');
  await variablesButton.click();
  await page.waitForTimeout(300);
}

/**
 * Helper: Find an editable input by value (from hl7-editor.spec.ts pattern)
 */
async function findEditableInput(page: Page, value: string) {
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

/**
 * Helper: Click Edit button for a specific template by name
 */
async function clickEditForTemplate(page: Page, templateName: string) {
  // Find template rows using data-testid pattern
  const rows = await page.locator('[data-testid^="template-row-"]').all();

  for (const row of rows) {
    const text = await row.textContent();
    if (text && text.includes(templateName)) {
      // Extract template ID from the row's data-testid
      const testId = await row.getAttribute('data-testid');
      if (testId) {
        const templateId = testId.replace('template-row-', '');
        const editButton = page.locator(`[data-testid="edit-btn-${templateId}"]`);
        await editButton.click();
        return;
      }
    }
  }
  throw new Error(`Could not find Edit button for template: ${templateName}`);
}

test.describe('Templates - Variables Only Data Integrity', () => {
  test('CRITICAL: should preserve non-variable segments when editing in Variables Only mode', async ({
    page,
  }) => {
    // PROOF: Fails if fullSegments merge logic is removed - the primary regression test
    await navigateToTemplates(page);

    const templateName = 'Data Loss Test';

    // Create template with 4 segments: MSH, PID (has variable), PV1 (no variable), OBX (no variable)
    await createTemplate(page, templateName, TEST_MESSAGE_WITH_VARIABLES);

    // Save initial template
    await saveTemplate(page);

    // Verify template was saved - wait for read-only mode
    await page.waitForTimeout(500);

    // Start editing
    await clickEditForTemplate(page, templateName);
    await page.waitForTimeout(500);

    // Switch to Variables Only mode - this filters displaySegments to only show PID
    await switchToVariablesOnly(page);

    // Edit the HELPERVARIABLE field
    const variableInput = await findEditableInput(page, 'HELPERVARIABLE');
    if (!variableInput) {
      throw new Error('Could not find HELPERVARIABLE input in Variables Only mode');
    }

    await variableInput.clear();
    await variableInput.fill('MODIFIED_VALUE');
    await page.waitForTimeout(300);

    // Save - this is where the bug occurred (data loss)
    await saveTemplate(page);

    // Start editing again to verify the saved content
    await clickEditForTemplate(page, templateName);
    await page.waitForTimeout(500);

    // Get the raw HL7 content from the textarea
    const textarea = page.locator('[data-testid="edit-content-textarea"]');
    const content = await textarea.inputValue();

    // CRITICAL CHECKS: All 4 segments must be preserved
    expect(content).toContain('MSH|'); // Header
    expect(content).toContain('PID|'); // Had the variable
    expect(content).toContain('PV1|'); // NO VARIABLE - must not be deleted!
    expect(content).toContain('OBX|'); // NO VARIABLE - must not be deleted!

    // Verify the edit was applied
    expect(content).toContain('MODIFIED_VALUE');
    expect(content).not.toContain('HELPERVARIABLE');

    // Verify segment count
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    expect(lines.length).toBe(4);
  });

  test('should preserve all segments with multiple variable edits', async ({ page }) => {
    // PROOF: Fails if merge logic doesn't handle multiple segment updates correctly
    await navigateToTemplates(page);

    const templateName = 'Multi Var Test';

    // 5 segments: MSH, PID (2 vars), PV1 (no var), 2x OBX (1 has var, 1 doesn't)
    await createTemplate(page, templateName, TEST_MESSAGE_MULTI_VARIABLES);
    await saveTemplate(page);
    await page.waitForTimeout(500);

    // Start editing
    await clickEditForTemplate(page, templateName);
    await page.waitForTimeout(500);

    // Switch to Variables Only
    await switchToVariablesOnly(page);

    // Edit all variables
    const var1 = await findEditableInput(page, 'HELPERVARIABLE');
    if (var1) {
      await var1.clear();
      await var1.fill('VAR1_MOD');
      await page.waitForTimeout(200);
    }

    const var2 = await findEditableInput(page, 'HELPERVARIABLE2');
    if (var2) {
      await var2.clear();
      await var2.fill('VAR2_MOD');
      await page.waitForTimeout(200);
    }

    const var3 = await findEditableInput(page, 'HELPERVARIABLE3');
    if (var3) {
      await var3.clear();
      await var3.fill('VAR3_MOD');
      await page.waitForTimeout(200);
    }

    // Save
    await saveTemplate(page);

    // Verify - start editing again
    await clickEditForTemplate(page, templateName);
    await page.waitForTimeout(500);

    const textarea = page.locator('[data-testid="edit-content-textarea"]');
    const content = await textarea.inputValue();

    // All 5 segments must be preserved
    expect(content).toContain('MSH|');
    expect(content).toContain('PID|');
    expect(content).toContain('PV1|'); // NO VARIABLE - must be preserved!
    expect(content).toContain('OBX|');

    // All edits applied
    expect(content).toContain('VAR1_MOD');
    expect(content).toContain('VAR2_MOD');
    expect(content).toContain('VAR3_MOD');

    // Non-variable data preserved
    expect(content).toContain('StableValue'); // From second OBX

    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    expect(lines.length).toBe(5);
  });

  test('should preserve segments across view mode switches', async ({ page }) => {
    // PROOF: Fails if switching views corrupts state
    await navigateToTemplates(page);

    const templateName = 'View Switch Test';

    await createTemplate(page, templateName, TEST_MESSAGE_WITH_VARIABLES);
    await saveTemplate(page);
    await page.waitForTimeout(500);

    // Start editing
    await clickEditForTemplate(page, templateName);
    await page.waitForTimeout(500);

    // Variables Only → All Fields → Variables Only → Edit → Save
    await switchToVariablesOnly(page);
    await page.locator('button:has-text("All Fields")').click();
    await page.waitForTimeout(300);
    await switchToVariablesOnly(page);

    const variableInput = await findEditableInput(page, 'HELPERVARIABLE');
    if (variableInput) {
      await variableInput.clear();
      await variableInput.fill('SWITCHED_VALUE');
      await page.waitForTimeout(200);
    }

    await saveTemplate(page);

    // Verify - start editing again
    await clickEditForTemplate(page, templateName);
    await page.waitForTimeout(500);

    const textarea = page.locator('[data-testid="edit-content-textarea"]');
    const content = await textarea.inputValue();

    expect(content).toContain('MSH|');
    expect(content).toContain('PID|');
    expect(content).toContain('PV1|');
    expect(content).toContain('OBX|');
    expect(content).toContain('SWITCHED_VALUE');

    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    expect(lines.length).toBe(4);
  });

  test('should show field descriptions (not "Field X") in Variables Only mode - read-only', async ({
    page,
  }) => {
    // PROOF: Fails if messageType prop is not passed to MessageEditor in read-only mode
    // This verifies the fix where messageType is extracted from template.messageType
    // and passed to MessageEditor so field descriptions can be loaded from definitions
    await navigateToTemplates(page);

    const templateName = 'Field Descriptions Test RO';

    // Create template with ADT^A01 message type and HELPERVARIABLE in PID-3 (Patient Identifier List)
    await createTemplate(page, templateName, TEST_MESSAGE_WITH_VARIABLES);
    await saveTemplate(page);
    await page.waitForTimeout(500);

    // After save, the template collapses automatically
    // Click the template row to expand to read-only view
    const rows2 = await page.locator('[data-testid^="template-row-"]').all();
    for (const row of rows2) {
      const text = await row.textContent();
      if (text && text.includes(templateName)) {
        // Click the row header (not a button) to expand
        const rowHeader = row.locator('div').first();
        await rowHeader.click();
        break;
      }
    }
    await page.waitForTimeout(500);

    // Switch to Variables Only mode in read-only view
    const variablesButton = page.locator('[data-testid="view-mode-variables"]');
    await variablesButton.click();
    await page.waitForTimeout(300);

    // Get the structured view content
    const structuredView = page.locator('[data-testid="template-content-editor"]').first();
    const content = await structuredView.textContent();

    // CRITICAL CHECK: Should show "Patient Identifier List" (field description from definition)
    // NOT "Field 3" (generic fallback when definitions aren't loaded)
    expect(content).toContain('Patient Identifier List');
    expect(content).not.toContain('Field 3');
  });

  test('should show field descriptions (not "Field X") in Variables Only mode - edit mode', async ({
    page,
  }) => {
    // PROOF: Fails if messageType prop is not passed to MessageEditor in edit mode
    // This verifies the fix where editType is converted from "ADT-A01" to "ADT^A01"
    // and passed to MessageEditor so field descriptions can be loaded
    await navigateToTemplates(page);

    const templateName = 'Field Descriptions Edit Test';

    // Create template with ADT^A01 message type
    await createTemplate(page, templateName, TEST_MESSAGE_WITH_VARIABLES);
    await saveTemplate(page);
    await page.waitForTimeout(500);

    // Start editing
    await clickEditForTemplate(page, templateName);
    await page.waitForTimeout(500);

    // Switch to Variables Only mode in edit mode
    await switchToVariablesOnly(page);

    // Get the structured view content
    const structuredView = page.locator('[data-testid="template-content-editor"]');
    const content = await structuredView.textContent();

    // CRITICAL CHECK: Should show field description, not generic "Field X"
    expect(content).toContain('Patient Identifier List');
    expect(content).not.toContain('Field 3');
  });
});
