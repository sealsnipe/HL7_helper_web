#!/usr/bin/env node
/**
 * Review Trigger Script with 30-Minute Brainstorming Intervals
 *
 * Triggers:
 * - 30 min: Brainstorm trigger (read notes, ponder, research, update notes)
 * - 60 min: Brainstorm trigger
 * - 90 min: Brainstorm trigger
 * - 120 min: Full project review trigger
 *
 * Notes are timestamped (never overwritten).
 */

const TRIGGERS = [
    { minutesAfterStart: 30, type: 'brainstorm' },
    { minutesAfterStart: 60, type: 'brainstorm' },
    { minutesAfterStart: 90, type: 'brainstorm' },
    { minutesAfterStart: 120, type: 'review' },
];

const startTime = new Date();
let currentTriggerIndex = 0;

console.log('='.repeat(60));
console.log('REVIEW TRIGGER SCRIPT (30-MIN INTERVALS)');
console.log('='.repeat(60));
console.log(`Started at: ${startTime.toISOString()}`);
console.log(`Triggers planned:`);
TRIGGERS.forEach((t, i) => {
    const triggerTime = new Date(startTime.getTime() + t.minutesAfterStart * 60 * 1000);
    console.log(`  ${i + 1}. [${t.minutesAfterStart} min] ${t.type.toUpperCase()} @ ${triggerTime.toISOString()}`);
});
console.log('='.repeat(60));
console.log('STATUS: RUNNING');
console.log('='.repeat(60));
console.log('');

// Status update every 5 minutes
const STATUS_INTERVAL = 5 * 60 * 1000;
const statusInterval = setInterval(() => {
    const now = new Date();
    const elapsedMs = now.getTime() - startTime.getTime();
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const nextTrigger = TRIGGERS[currentTriggerIndex];

    if (nextTrigger) {
        const remainingMin = nextTrigger.minutesAfterStart - elapsedMin;
        console.log(`[${now.toISOString()}] STATUS: Running | Elapsed: ${elapsedMin}min | Next: ${nextTrigger.type} in ${remainingMin}min`);
    }
}, STATUS_INTERVAL);

function triggerBrainstorm(iteration) {
    const timestamp = new Date().toISOString();
    console.log('\n');
    console.log('='.repeat(60));
    console.log(`BRAINSTORM TRIGGER #${iteration} ACTIVATED`);
    console.log('='.repeat(60));
    console.log(`Timestamp: ${timestamp}`);
    console.log('='.repeat(60));
    console.log(`
INSTRUCTION FOR CLAUDE:
---------------------------------------------------------

## BRAINSTORM SESSION #${iteration}

Read and reflect on the notes in \`.claude/notes/\`:

1. **Read existing notes:**
   - architecture-thoughts.md
   - ux-thoughts.md
   - code-quality-thoughts.md
   - workflow-thoughts.md

2. **Ponder and reflect:**
   - What ideas stand out as most valuable?
   - What gaps or questions remain?
   - Any new insights from the previous session?

3. **Research if needed:**
   - Look up best practices mentioned
   - Check if suggestions are still current
   - Verify technical feasibility

4. **Update notes:**
   - Create NEW timestamped notes (e.g., brainstorm-session-${iteration}-${timestamp.slice(0,10)}.md)
   - DO NOT overwrite existing notes
   - Add new insights, corrections, or expansions
   - Mark resolved questions
   - Add new questions discovered

5. **Check 2h timer status:**
   - Confirm script is still running
   - Report remaining time until next trigger

Example new note filename: brainstorm-session-${iteration}-${timestamp.slice(0,10)}.md

---------------------------------------------------------
END OF INSTRUCTION
==========================================================
`);
}

function triggerReview() {
    const timestamp = new Date().toISOString();
    console.log('\n');
    console.log('='.repeat(60));
    console.log('FULL REVIEW TRIGGER ACTIVATED');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${timestamp}`);
    console.log('='.repeat(60));
    console.log(`
INSTRUCTION FOR CLAUDE:
---------------------------------------------------------

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

---------------------------------------------------------
END OF INSTRUCTION
==========================================================
`);
}

// Schedule triggers
TRIGGERS.forEach((trigger, index) => {
    const delayMs = trigger.minutesAfterStart * 60 * 1000;

    setTimeout(() => {
        currentTriggerIndex = index + 1;

        if (trigger.type === 'brainstorm') {
            triggerBrainstorm(index + 1);
        } else if (trigger.type === 'review') {
            triggerReview();
            clearInterval(statusInterval);
            console.log('\n');
            console.log('='.repeat(60));
            console.log('ALL TRIGGERS COMPLETE');
            console.log('='.repeat(60));
            process.exit(0);
        }
    }, delayMs);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    clearInterval(statusInterval);
    console.log('\nScript interrupted by user.');
    console.log(`Ran for ${Math.floor((Date.now() - startTime.getTime()) / 60000)} minutes.`);
    process.exit(1);
});

// Keep process alive
process.stdin.resume();
