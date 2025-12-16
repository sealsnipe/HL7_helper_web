#!/usr/bin/env node
/**
 * Review Trigger Script
 *
 * This script pauses for 2 hours, then outputs a prompt for a full project review.
 * Used to schedule periodic comprehensive reviews of the HL7 Helper Web project.
 */

const DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const DELAY_DISPLAY = '2 hours';

console.log('='.repeat(60));
console.log('REVIEW TRIGGER SCRIPT');
console.log('='.repeat(60));
console.log(`Started at: ${new Date().toISOString()}`);
console.log(`Will trigger review in: ${DELAY_DISPLAY}`);
console.log('='.repeat(60));

// Progress updates every 15 minutes
const UPDATE_INTERVAL = 15 * 60 * 1000;
let elapsed = 0;

const progressInterval = setInterval(() => {
    elapsed += UPDATE_INTERVAL;
    const remaining = DELAY_MS - elapsed;
    const remainingMins = Math.round(remaining / 60000);
    console.log(`[${new Date().toISOString()}] ${remainingMins} minutes remaining...`);
}, UPDATE_INTERVAL);

// Main delay
setTimeout(() => {
    clearInterval(progressInterval);

    console.log('\n');
    console.log('='.repeat(60));
    console.log('REVIEW TRIGGER ACTIVATED');
    console.log('='.repeat(60));
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    console.log('\n');
    console.log('INSTRUCTION FOR CLAUDE:');
    console.log('-'.repeat(60));
    console.log(`
## FULL PROJECT REVIEW REQUIRED

Orchestrate a complete review of the HL7 Helper Web project:

### Visual-Reviewer Tasks (In-Depth)
Test MULTIPLE times ALL actions possible in the app:

1. **Main Editor (/) - Test 3+ times each:**
   - Load each example message
   - Edit multiple fields
   - Update Raw
   - Copy message
   - New Message / Clear

2. **Templates (/templates) - Test 3+ times each:**
   - View template list
   - Create new template
   - Edit template (name, content, variables)
   - Duplicate template
   - Delete template
   - Export/Import data

3. **Use Template (/templates/use) - Test 3+ times each:**
   - Select different templates
   - Fill in variable values
   - Verify serialization updates
   - Add multiple serializations
   - Copy serializations
   - Serialize & Load

4. **Global - Test all:**
   - Theme switching (all 7 themes)
   - Navigation links
   - Responsive behavior

### Code-Reviewer Tasks
- Review all source files for quality
- Check for security issues
- Verify TypeScript types
- Check for performance issues

### Developer Tasks
- Run all tests (npm test)
- Run build (npm run build)
- Run lint (npm run lint)
- Verify no regressions

### Consensus Required
All agents must agree the project is solid before completing.

Launch agents in PARALLEL for efficiency.
`);
    console.log('-'.repeat(60));
    console.log('END OF INSTRUCTION');
    console.log('='.repeat(60));

    process.exit(0);
}, DELAY_MS);

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    clearInterval(progressInterval);
    console.log('\nScript interrupted by user.');
    process.exit(1);
});
