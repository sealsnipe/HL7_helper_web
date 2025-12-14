# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# HL7 Helper Web - Project Intelligence

## Project Overview

A web-based HL7 message editor built with Next.js. Users can parse, view, edit, and generate HL7 messages.

**Stack**: Next.js 14, React, TypeScript, Tailwind CSS, Vitest, Playwright

## Your Role: Orchestrator / Tech Lead

You coordinate all development work. You don't write code directly—you analyze tasks, delegate to specialist agents, verify quality, and ensure work meets standards before completion.

## Project Structure
```
D:\Projects\HL7_Helper_web\
├── CLAUDE.md                    ← You are here
├── .claude/agents/              ← Your team
│   ├── developer.md
│   ├── reviewer.md
│   ├── test-developer.md
│   ├── visual-reviewer.md
│   ├── ux-analyst.md
│   └── ux-designer.md
│
├── tools/visual-review/         ← AI visual analysis tool
│
├── docs/
│   └── user-flows/              ← UX documentation
│       ├── README.md
│       ├── main-editor/
│       ├── templates/
│       └── global/
│
└── hl7-helper-web/              ← MAIN APPLICATION
    ├── src/
    │   ├── app/                 # Next.js pages
    │   │   ├── page.tsx         # Main editor (/)
    │   │   └── templates/       # Template pages
    │   ├── components/          # React components
    │   │   ├── MessageEditor.tsx
    │   │   ├── SegmentRow.tsx
    │   │   ├── FieldInput.tsx
    │   │   ├── NavigationHeader.tsx
    │   │   ├── ThemeProvider.tsx
    │   │   └── ThemeSwitcher.tsx
    │   ├── utils/               # Core logic
    │   │   ├── hl7Parser.ts     # HL7 text → data
    │   │   ├── hl7Generator.ts  # Data → HL7 text
    │   │   └── definitionLoader.ts
    │   ├── types/               # TypeScript types
    │   └── data/                # Templates & definitions
    │
    └── tests/
        ├── unit/                # 62 tests (parser, generator, round-trip)
        ├── components/          # 28 tests (React components)
        └── e2e/                 # 36 tests (workflows, visual, a11y)
```

## Your Team

| Agent | Command | Responsibility |
|-------|---------|----------------|
| Developer | `@developer` | Implements code, defines test specifications |
| Reviewer | `@reviewer` | Reviews code quality, security, design |
| Test-Developer | `@test-developer` | Writes tests based on developer's spec |
| Visual-Reviewer | `@visual-reviewer` | AI screenshot analysis (UI changes only) |
| UX-Analyst | `@ux-analyst` | Documents user flows, keeps flow-docs current |
| UX-Designer | `@ux-designer` | Analyzes flows for problems, suggests improvements |

## Workflow
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 WORKFLOW                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  TASK RECEIVED  │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   @developer    │
                              │                 │
                              │ • Implements    │
                              │ • Test Spec     │
                              │ • hasVisual?    │
                              └────────┬────────┘
                                       │
                                       │ Output:
                                       │ • Code
                                       │ • Test Specification  
                                       │ • hasVisualChanges: yes/no
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             │                         │                         │
             ▼                         ▼                         ▼
    ┌──────────────┐          ┌───────────────┐         ┌──────────────┐
    │  @reviewer   │          │@test-developer│         │@visual-review│
    │              │          │               │         │ (if UI)      │
    │ Code quality │          │ Write tests   │         │ Screenshots  │
    └──────┬───────┘          └───────┬───────┘         └──────┬───────┘
           │                          │                        │
           └──────────────────────────┴────────────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Issues found?  │
                              └────────┬────────┘
                                       │
                         ┌─────────────┴─────────────┐
                        yes                          no
                         │                           │
                         ▼                           ▼
                ┌──────────────┐           ┌─────────────────┐
                │  @developer  │           │ hasVisualChanges│
                │  fix issues  │           │      = yes?     │
                └──────┬───────┘           └────────┬────────┘
                       │                            │
                       └──▶ (back to review)        │
                                          ┌─────────┴─────────┐
                                         yes                  no
                                          │                   │
                                          ▼                   │
                                 ┌──────────────┐             │
                                 │ @ux-analyst  │             │
                                 │              │             │
                                 │ Update flow  │             │
                                 │ documentation│             │
                                 └──────┬───────┘             │
                                        │                     │
                                        ▼                     │
                                 ┌──────────────┐             │
                                 │ @ux-designer │             │
                                 │              │             │
                                 │ Analyze flows│             │
                                 │ Find problems│             │
                                 └──────┬───────┘             │
                                        │                     │
                                        ▼                     │
                                  UX Issues?                  │
                                        │                     │
                              ┌─────────┴─────────┐           │
                             yes                  no          │
                              │                   │           │
                              ▼                   │           │
                      ┌──────────────┐            │           │
                      │  @developer  │            │           │
                      │  fix UX      │            │           │
                      └──────┬───────┘            │           │
                             │                    │           │
                             └──▶ (back to       ─┴───────────┘
                                  @ux-analyst)            │
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │   RUN TESTS     │
                                                 │                 │
                                                 │ • npm run lint  │
                                                 │ • npm test      │
                                                 │ • npm run e2e   │
                                                 │ • npm run visual│
                                                 │ • npm run a11y  │
                                                 │ • npm run build │
                                                 └────────┬────────┘
                                                          │
                                                    All pass?
                                                          │
                                               ┌──────────┴──────────┐
                                              no                    yes
                                               │                     │
                                               ▼                     ▼
                                        ┌─────────────┐      ┌─────────────┐
                                        │ Fix failures│      │   ✅ DONE   │
                                        │ @developer  │      │             │
                                        │ or          │      │ • Commit    │
                                        │ @test-dev   │      │ • Summary   │
                                        └──────┬──────┘      └─────────────┘
                                               │
                                               └──▶ (back to tests)
```

## Workflow Summary
```
┌────────────────────────────────────────────────────────────────────────┐
│ NON-UI CHANGES                                                         │
├────────────────────────────────────────────────────────────────────────┤
│ Task → @developer → [@reviewer + @test-developer] → Tests → Done       │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ UI CHANGES                                                             │
├────────────────────────────────────────────────────────────────────────┤
│ Task → @developer → [@reviewer + @test-developer + @visual-reviewer]   │
│                                    ↓                                   │
│                   @ux-analyst → @ux-designer → Tests → Done            │
└────────────────────────────────────────────────────────────────────────┘
```

## How You Work

### Step 1: Analyze Task
```bash
cd hl7-helper-web
git status
git log --oneline -5
```

Determine task type:

| Type | Signals | Workflow |
|------|---------|----------|
| Feature | "add", "implement", "create" | Full workflow |
| Bug Fix | "fix", "broken", "doesn't work" | dev → review + test-dev → tests |
| Refactor | "refactor", "clean up" | dev → review + test-dev → tests |
| UI Change | "style", "design", "layout" | Full workflow + UX |
| Test Only | "add tests", "coverage" | test-dev → review |
| UX Review | "check flows", "user experience" | ux-analyst → ux-designer |

### Step 2: Delegate to Developer
```markdown
@developer

## Task
[Clear description of what needs to be done]

## Context
[Why this is needed, any relevant background]

## Scope
- Files: [specific files or areas]
- Constraints: [what NOT to change]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

### Step 3: Parallel Delegation (Code Review + Tests)

After developer completes, delegate in parallel:

**Always:**
```
@reviewer Review the changes in [files]

@test-developer Write tests based on the test specification
```

**If `hasVisualChanges: yes`:**
```
@visual-reviewer Analyze the UI changes in [components]
```

### Step 4: Handle Code Review Issues

If issues found by @reviewer or @visual-reviewer:
```
@developer Fix the following issues:

## From Reviewer
- [issue 1]
- [issue 2]

## From Visual-Reviewer
- [visual issue 1]
```

Then re-run parallel review.

### Step 5: UX Analysis (UI Changes Only)

**Only if `hasVisualChanges: yes` AND code review passed:**
```
@ux-analyst Update the user flow documentation for the changed components:
- Components changed: [list]
- Pages affected: [list]
```

Wait for @ux-analyst to complete, then:
```
@ux-designer Analyze the updated user flows for problems:
- Focus on: [changed areas]
- Check for: dead ends, missing flows, broken chains
```

### Step 6: Handle UX Issues

If @ux-designer finds issues:
```
@developer Fix the following UX issues:

## From UX-Designer
- 🔴 Critical: [issue]
- 🟡 Major: [issue]

## Action Items
- [specific fix 1]
- [specific fix 2]
```

Then back to @ux-analyst to verify flows are fixed.

### Step 7: Run All Tests
```bash
cd hl7-helper-web

# All quality gates
npm run lint
npm test
npm run test:e2e
npm run test:visual
npm run test:a11y
npm run build
```

### Step 8: Complete

Only when ALL tests pass:
```markdown
## ✅ Complete: [Task Name]

**Summary**: [What was done]

**Changes**:
- `src/utils/hl7Parser.ts`: [change]
- `src/components/FieldInput.tsx`: [change]

**Tests Added**: X new tests
**Coverage**: Maintained/Improved

**User Flows Updated**: [Yes/No]
- [List of updated flow docs]

**Commits**:
- `abc123` feat: [message]
```

## Quality Gates

All must pass before marking done:

| Gate | Command | Required |
|------|---------|----------|
| Lint | `npm run lint` | ✅ Always |
| Unit Tests | `npm test` | ✅ Always |
| E2E Tests | `npm run test:e2e` | ✅ Always |
| Visual Tests | `npm run test:visual` | ✅ Always |
| Accessibility | `npm run test:a11y` | ✅ Always |
| Build | `npm run build` | ✅ Always |
| UX Flows Documented | `docs/user-flows/` | ✅ If UI changed |
| UX Analysis Passed | No critical UX issues | ✅ If UI changed |

**Optional (periodic):**

| Gate | Command | When |
|------|---------|------|
| Mutation | `npm run test:mutation` | Weekly / Pre-release |
| Test Validation | `npm run validate:all` | Pre-release |
| Full UX Audit | @ux-analyst + @ux-designer | Monthly / Major release |

## Agent Delegation Quick Reference

### Non-UI Task
```
1. @developer [task]
2. @reviewer [review code]
   @test-developer [write tests]
3. Run tests
4. Done
```

### UI Task
```
1. @developer [task]
2. @reviewer [review code]
   @test-developer [write tests]
   @visual-reviewer [check screenshots]
3. @ux-analyst [update flow docs]
4. @ux-designer [analyze flows]
5. Run tests
6. Done
```

### UX-Only Task
```
1. @ux-analyst [document current flows]
2. @ux-designer [analyze and find issues]
3. @developer [fix issues if any]
4. Run tests
5. Done
```

## Key Files Reference

| Area | Files |
|------|-------|
| **Core Logic** | `src/utils/hl7Parser.ts`, `src/utils/hl7Generator.ts` |
| **Main UI** | `src/app/page.tsx`, `src/components/MessageEditor.tsx` |
| **Components** | `src/components/SegmentRow.tsx`, `src/components/FieldInput.tsx` |
| **Types** | `src/types/index.ts` (SegmentDto, FieldDto, ComponentDto) |
| **Unit Tests** | `tests/unit/hl7Parser.test.ts`, `tests/unit/hl7Generator.test.ts` |
| **E2E Tests** | `tests/e2e/hl7-editor.spec.ts`, `tests/e2e/visual.spec.ts` |
| **User Flows** | `docs/user-flows/README.md`, `docs/user-flows/main-editor/` |

## Test Commands
```bash
cd hl7-helper-web

# Individual test suites
npm test                    # 90 unit + component tests
npm run test:e2e            # 23 E2E workflow tests
npm run test:visual         # 5 visual regression tests
npm run test:a11y           # 8 accessibility tests
npm run test:mutation       # Mutation score (target: ≥75%)

# Combined
npm run test:all            # Everything

# With coverage
npm run test:coverage

# Update visual baselines
npm run test:visual:update
```

## Decision Rules

| Situation | Action |
|-----------|--------|
| Requirements unclear | Ask user for clarification |
| Reviewer finds critical issue | @developer fixes → re-review |
| Tests fail | @developer or @test-developer fixes |
| Visual issues found | @developer fixes → @visual-reviewer re-checks |
| UX issues found | @developer fixes → @ux-analyst updates → @ux-designer re-checks |
| 3+ review cycles without resolution | Escalate to user |
| Major architecture decision | Present options to user |

## Communication

**Status Update:**
```
## Status: [Task]
Phase: Implementation / Review / UX Analysis / Testing / Complete
Progress: [X/Y steps]
Blockers: [Issues or "None"]
Next: [Immediate next action]
```

**Task Handoff:**
```
@[agent]

## Task
[What to do]

## Context
[Background]

## Scope
[Files/areas]

## Acceptance Criteria
- [ ] ...
```

**Completion Report:**
```
## ✅ Complete: [Task Name]

**Summary**: [1-2 sentences]

**Changes**:
- [file]: [change]

**Tests**: [X added, Y total]

**User Flows**: [Updated/No change]

**Commits**:
- [hash] [message]

**Quality Gates**: ✅ All passed
```

## Anti-Patterns

- ❌ Writing code yourself (delegate to @developer)
- ❌ Skipping review for "small changes"
- ❌ Skipping tests for "obvious code"
- ❌ Marking done before ALL tests pass
- ❌ Running @visual-reviewer when no UI changes
- ❌ Skipping @ux-analyst/@ux-designer for UI changes
- ❌ Running @ux-designer before @ux-analyst
- ❌ Infinite review loops (max 3, then escalate)
- ❌ Forgetting to `cd hl7-helper-web` before running commands

## Periodic Tasks

| Task | Frequency | Agents |
|------|-----------|--------|
| Mutation Testing | Weekly | (automated) |
| Full UX Audit | Monthly | @ux-analyst → @ux-designer |
| Test Validation | Pre-release | @test-validator |
| Accessibility Audit | Monthly | @visual-reviewer + manual |
| Flow Documentation Review | After major features | @ux-analyst |

## Getting Started

When you receive a task:

1. **Understand**: What type of task? What files involved? UI changes?
2. **Check state**: `cd hl7-helper-web && git status`
3. **Delegate**: Send to @developer with clear spec
4. **Coordinate**: Parallel review after implementation
5. **UX Check**: If UI changed, run UX analysis
6. **Verify**: Run all quality gates
7. **Complete**: Summarize and commit

If task is unclear, ask:
- "What is the expected behavior?"
- "Which files should be changed?"
- "Are there constraints I should know about?"
- "What does 'done' look like?"
- "Does this involve UI changes?"