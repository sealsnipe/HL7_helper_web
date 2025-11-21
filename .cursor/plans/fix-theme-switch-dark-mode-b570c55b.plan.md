<!-- b570c55b-1899-4d31-8679-20f9d05ba097 feeac7bd-0aa1-458b-b652-f55130e1c4d9 -->
# Fix Theme Switching Implementation

## Problems Identified

1. **Missing Dark Mode Classes**: Components (`MessageEditor`, `SegmentRow`, `FieldInput`) use hardcoded light colors (`bg-white`, `text-gray-700`, etc.) without `dark:` variants, so dark themes don't apply.

2. **CSS Variables Not Integrated**: CSS variables (`--background`, `--foreground`) are only applied to `body`, but components use Tailwind's hardcoded colors instead of these variables.

3. **Variant Syntax**: The `@variant dark` syntax may need verification for Tailwind v4, but even if correct, it won't help without `dark:` classes in components.

4. **System Theme**: "system" theme follows OS preference but has no explicit CSS definition.

## Solution Strategy

Two approaches:

- **Option A**: Add `dark:` variants to all color classes in components (quick but repetitive)
- **Option B**: Integrate CSS variables into Tailwind's theme system and use semantic color classes (better for custom themes)

Using **Option B** for better theme support.

## Implementation Steps

### 1. Update `globals.css`

- Verify/update `@variant dark` syntax for Tailwind v4
- Add more CSS variables for common colors (backgrounds, borders, text)
- Integrate CSS variables into Tailwind's `@theme` configuration
- Add variables for all theme variants (aurora, matrix, cyberpunk, ocean, sunset)

### 2. Update Components to Use Dark Mode Classes

- `MessageEditor.tsx`: Add `dark:` variants to all color classes
- `SegmentRow.tsx`: Add `dark:` variants to all color classes  
- `FieldInput.tsx`: Add `dark:` variants to all color classes
- `page.tsx`: Verify all `dark:` classes are present

### 3. Test Theme Switching

- Verify each theme applies correctly
- Check that all components respond to theme changes
- Ensure system theme works (switches between light/dark based on OS)

## Files to Modify

- `hl7-helper-web/src/app/globals.css` - Enhance CSS variables and Tailwind integration
- `hl7-helper-web/src/components/MessageEditor.tsx` - Add dark mode classes
- `hl7-helper-web/src/components/SegmentRow.tsx` - Add dark mode classes
- `hl7-helper-web/src/components/FieldInput.tsx` - Add dark mode classes
- `hl7-helper-web/src/app/page.tsx` - Verify/update dark mode classes

### To-dos

- [ ] Add Tailwind v4 dark mode variant configuration in globals.css to recognize data-theme attribute
- [ ] Verify that dark: utility classes work correctly when switching themes