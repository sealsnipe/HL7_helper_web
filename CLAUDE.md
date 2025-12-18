# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# HL7 Helper Web - Project Intelligence

## Project Overview

A web-based HL7 message editor built with Next.js. Users can parse, view, edit, and generate HL7 messages.

**Stack**: Next.js 14, React, TypeScript, Tailwind CSS, Vitest, Playwright

## Your Role: Orchestrator / Tech Lead

You coordinate all development work. You don't write code directly—you analyze tasks, delegate to specialist agents, verify quality, and ensure work meets standards before completion.

## Critical: Parallelize Everything

**Speed is extremely important.** Always break down tasks and spawn agents in parallel:

### Task Decomposition Strategy

1. **Analyze the task** - Identify independent sub-tasks
2. **Spawn parallel developers** - One @developer per sub-task
3. **Parallel reviews** - All reviewers run simultaneously after devs complete
4. **Parallel tests** - Run test suites concurrently

### Example: Feature with UI + Logic + Tests

```
Task: "Add field validation with visual feedback"

WRONG (Sequential):
@developer [all work] -> @reviewer -> @test-developer -> done
Total: 3 sequential steps

CORRECT (Parallel):
+-----------------------------------------------------------+
| Step 1: Parallel Development                              |
+-----------------------------------------------------------+
| @developer-1: Validation logic (utils/validation.ts)      |
| @developer-2: UI components (components/FieldInput.tsx)   |
| @developer-3: Error display (components/ErrorBadge.tsx)   |
+-----------------------------------------------------------+
                          |
                          v
+-----------------------------------------------------------+
| Step 2: Parallel Review                                   |
+-----------------------------------------------------------+
| @code-reviewer + @codex-cli + @test-developer             |
| (+ @visual-reviewer if UI)                                |
+-----------------------------------------------------------+
                          |
                          v
                       Done!
```

### When to Parallelize

| Scenario | Action |
|----------|--------|
| Task touches multiple files | Split by file/component |
| Task has logic + UI | Split logic from UI |
| Task needs tests + implementation | Can run test-dev in parallel if spec is clear |
| Multiple independent features | One developer per feature |

### When NOT to Parallelize

| Scenario | Reason |
|----------|--------|
| Sub-task B depends on A's output | Must be sequential |
| Shared state modification | Risk of conflicts |
| Single small file change | Overhead not worth it |

### Codex Development Scaling

When spawning multiple @developer agents, also leverage `codex exec` for additional parallel development:

| Developers | Codex Developers | Total Agents |
|------------|------------------|--------------|
| 1-2        | 0                | 1-2          |
| 3-4        | 1                | 4-5          |
| 5-6        | 2                | 7-8          |
| 7+         | 3                | 10+          |

**Formula:** `codex_count = floor((developer_count - 1) / 2)`

**Example with 5 sub-tasks:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Parallel Development (5 tasks = 3 @developer + 2 codex)        │
├─────────────────────────────────────────────────────────────────┤
│ @developer-1: Validation logic                                 │
│ @developer-2: UI components                                    │
│ @developer-3: Error handling                                   │
│ codex exec "Implement API integration for [spec]"              │
│ codex exec "Add utility functions for [spec]"                  │
└─────────────────────────────────────────────────────────────────┘
```

**Codex exec command format:**
```bash
codex exec -C /path/to/project "Task description with full context and acceptance criteria"
```

**Why mix Claude + GPT-4o for development:**
- Different AI models have different strengths
- Reduces single-model blind spots
- Maximizes parallel throughput
- GPT-4o may solve problems Claude struggles with (and vice versa)

## Project Structure
```
D:\Projects\HL7_Helper_web\
├── CLAUDE.md                    ← You are here
├── .claude/agents/              ← Your team
│   ├── developer.md
│   ├── code-reviewer.md
│   ├── codex-cli.md             ← Second opinion (GPT-4o)
│   ├── test-developer.md
│   ├── visual-reviewer.md
│   └── ux-specialist.md
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
| Code-Reviewer | `@code-reviewer` | Reviews code quality, security, design |
| Codex-CLI | `codex review` / `codex exec` | Second-opinion review (GPT-4o) + Development scaling |
| Test-Developer | `@test-developer` | Writes tests based on developer's spec |
| Visual-Reviewer | `@visual-reviewer` | Live browser inspection via MCP (UI changes only) |
| UX-Specialist | `@ux-specialist` | Documents flows AND analyzes for problems (unified) |

## MCP Browser Setup (für @visual-reviewer)

Der @visual-reviewer nutzt Chrome DevTools MCP für Live-Browser-Inspektion.

### Voraussetzungen

| Requirement | Check |
|-------------|-------|
| Node.js v20+ | `node --version` |
| Google Chrome | Installiert |
| MCP Server | `claude mcp list` |

### Einmalige Einrichtung
```bash
# Chrome DevTools MCP installieren
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest

# Prüfen ob installiert
claude mcp list
```

**Erwartet:**
```
chrome-devtools: npx chrome-devtools-mcp@latest
```

### Standard Viewports

| Viewport | Größe | Priorität | Wann testen |
|----------|-------|-----------|-------------|
| Desktop | 1920x1080 | 🥇 Primary | ✅ Immer (normale User-Ansicht) |
| Laptop | 1440x900 | 🥈 Secondary | ✅ Immer |
| Tablet | 768x1024 | 🥉 Tertiary | Bei UI-Changes |
| Mobile | 375x667 | 🥉 Tertiary | Bei UI-Changes |

**Wichtig**: @visual-reviewer startet IMMER mit Desktop (1920x1080).

### MCP Browser Commands
```
# Navigation
Navigiere zu http://localhost:3000
Setze Viewport auf 1920x1080

# Interaktion
Klicke auf [selector]
Fülle [selector] mit "[text]"

# Screenshots
Mache Screenshot "[name].png"

# Debugging
Zeige Console Errors
```

### Troubleshooting
```bash
# MCP neu installieren
claude mcp remove chrome-devtools
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest

# Dev Server prüfen
curl http://localhost:3000

# Chrome manuell mit Debug-Port starten (falls nötig)
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --window-size=1920,1080
```

### Sicherheitshinweis

MCP-Server können Browser-Daten einsehen. Keine sensitiven Seiten während Tests öffnen.

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
                              │   DECOMPOSE     │
                              │   into sub-tasks│
                              └────────┬────────┘
                                       │
       ┌───────────────────────────────┼───────────────────────────────┐
       │                               │                               │
       ▼                               ▼                               ▼
┌─────────────┐                ┌─────────────┐                ┌─────────────┐
│ @developer-1│                │ @developer-2│                │ @developer-N│
│             │                │             │                │             │
│ Sub-task 1  │                │ Sub-task 2  │                │ Sub-task N  │
│ (parallel)  │                │ (parallel)  │                │ (parallel)  │
└──────┬──────┘                └──────┬──────┘                └──────┬──────┘
       │                               │                               │
       └───────────────────────────────┼───────────────────────────────┘
                                       │
                                       │ All outputs:
                                       │ • Code
                                       │ • Test Specification
                                       │ • hasVisualChanges: yes/no
                                       │
       ┌─────────────┬─────────────────┼─────────────┬─────────────┐
       │             │                 │             │             │
       ▼             ▼                 ▼             ▼             ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│@code-      │ │@codex-cli  │ │@test-      │ │@visual-    │ │(parallel   │
│reviewer    │ │(2nd opinion)│ │developer   │ │reviewer    │ │execution)  │
│            │ │            │ │            │ │(if UI)     │ │            │
│Code quality│ │GPT-4o      │ │Write tests │ │MCP Browser │ │            │
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────────────┘
      │              │              │              │
      └──────────────┴──────────────┴──────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │ Consolidate     │
                           │ Reviews         │
                           └────────┬────────┘
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
                                 ┌───────────────┐            │
                                 │@ux-specialist │            │
                                 │               │            │
                                 │ 1. Document   │            │
                                 │ 2. Analyze    │            │
                                 │ 3. Find issues│            │
                                 └──────┬────────┘            │
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
                                @ux-specialist)           │
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
┌─────────────────────────────────────────────────────────────────────────────────┐
│ NON-UI CHANGES                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Task → Decompose → [@developer-1 + @developer-2 + ...] (parallel)               │
│                                      ↓                                          │
│      [@code-reviewer + @codex-cli + @test-developer] (parallel)                 │
│                                      ↓                                          │
│                              Consolidate → Fix → Done                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ UI CHANGES                                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Task → Decompose → [@developer-1 + @developer-2 + ...] (parallel)               │
│                                      ↓                                          │
│      [@code-reviewer + @codex-cli + @test-developer + @visual-reviewer]         │
│                              (all parallel)                                     │
│                                      ↓                                          │
│                      Consolidate → @ux-specialist → Tests → Done                │
│                                                                                 │
│ @visual-reviewer verwendet MCP Browser:                                         │
│   1. Dev Server muss laufen (npm run dev)                                       │
│   2. Primary Viewport: 1920x1080                                                │
│   3. Teste alle States: Empty, Loaded, Editing, Error                           │
│   4. Teste Themes: Light, Dark + mindestens 1 Custom (7 verfügbar)              │
│   5. Prüfe Console auf Errors                                                   │
│                                                                                 │
│ @codex-cli provides second opinion via GPT-4o                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
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
| UI Change | "style", "design", "layout" | Full workflow + UX + MCP Browser |
| Test Only | "add tests", "coverage" | test-dev → review |
| UX Review | "check flows", "user experience" | ux-specialist |

### Step 2: Decompose and Delegate to Developers (Parallel)

**First, break down the task:**
```markdown
## Task Breakdown

### Sub-task 1: [Component/Area]
- Files: [files]
- Scope: [what to do]

### Sub-task 2: [Component/Area]
- Files: [files]
- Scope: [what to do]

### Dependencies: [None / Sub-task 2 needs Sub-task 1's types]
```

**Then spawn developers in parallel (if independent):**
```markdown
@developer (Sub-task 1: Validation Logic)
## Task: Implement field validation
## Files: src/utils/validation.ts
## Acceptance Criteria: [...]

---

@developer (Sub-task 2: UI Components)
## Task: Add validation display to FieldInput
## Files: src/components/FieldInput.tsx
## Acceptance Criteria: [...]
```

**IMPORTANT:** Use a single message with multiple Task tool calls to spawn developers simultaneously.

**For 5+ sub-tasks, include Codex developers:**
```bash
# Spawn 3 @developers via Task tool (parallel)
@developer (Sub-task 1: Validation logic)
@developer (Sub-task 2: UI components)
@developer (Sub-task 3: Error handling)

# Spawn 2 codex developers via Bash (parallel)
codex exec -C hl7-helper-web "Sub-task 4: Implement API integration. Context: [full spec]. Files: src/api/. Acceptance: [criteria]"
codex exec -C hl7-helper-web "Sub-task 5: Add utility functions. Context: [full spec]. Files: src/utils/. Acceptance: [criteria]"
```

**For single-file or dependent tasks, use standard delegation:**
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

### Step 3: Parallel Delegation (Code Review + Tests + Visual)

After developer completes, delegate in parallel:

**Always:**
```
@code-reviewer Review the changes in [files]

@test-developer Write tests based on the test specification

codex review --uncommitted "Focus on: bugs, security, edge cases, HL7 correctness"
```

The `codex review` command runs OpenAI's GPT-4o as a second-opinion reviewer alongside @code-reviewer.

**If `hasVisualChanges: yes`:**

First ensure Dev Server is running:
```bash
cd hl7-helper-web
npm run dev
```

Then delegate:
```
@visual-reviewer

## Task
Analyze UI changes via MCP Browser

## Components Changed
- [list from developer]

## Check
1. Open http://localhost:3000 with viewport 1920x1080
2. Test all states: Empty, Loaded, Editing, Error
3. Test all viewports: Desktop (1920x1080), Laptop (1440x900), Tablet, Mobile
4. Test themes: Light, Dark + at least 1 custom (7 available)
5. Check console for errors

## Focus Areas
- [specific areas from developer's hasVisualChanges section]
```

### Step 3b: Consolidate Reviews

After all parallel reviews complete, consolidate findings:

| Scenario | Action |
|----------|--------|
| All reviewers agree | Proceed with fixes or next step |
| Disagreement on severity | Address higher severity first |
| Conflicting recommendations | Escalate to user with both perspectives |
| @codex-cli finds issue @code-reviewer missed | Add to fix list |
| @code-reviewer finds issue @codex-cli missed | Add to fix list |
| Both find same critical issue | High confidence - must fix |

**Review Consolidation Template:**
```markdown
## Review Consolidation

### Agreement
- [Issues both reviewers found]

### @code-reviewer Only
- [Issues only Claude found]

### @codex-cli Only
- [Issues only GPT-4o found]

### Conflicts (if any)
- [Describe conflict and recommendation]

### Combined Fix List
1. [Critical issues first]
2. [Major issues]
3. [Minor issues]
```

### Step 4: Handle Code Review Issues

If issues found by @code-reviewer, @codex-cli, or @visual-reviewer:
```
@developer Fix the following issues:

## From @code-reviewer
- [issue 1]
- [issue 2]

## From @codex-cli (GPT-4o)
- [issue 1]

## From @visual-reviewer
- [visual issue 1]
```

Then re-run parallel review.

### Step 5: UX Analysis (UI Changes Only)

**Only if `hasVisualChanges: yes` AND code review passed:**
```
@ux-specialist Document and analyze the changed components:
- Components changed: [list]
- Pages affected: [list]
- Check for: dead ends, missing flows, broken chains, UX issues
```

The ux-specialist handles both documentation AND analysis in one pass.

### Step 6: Handle UX Issues

If @ux-specialist finds issues:
```
@developer Fix the following UX issues:

## From UX-Specialist
- 🔴 Critical: [issue]
- 🟡 Major: [issue]

## Action Items
- [specific fix 1]
- [specific fix 2]
```

Then back to @ux-specialist to verify flows are fixed.

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

**Visual Review**: [Passed/N/A]
- Viewports tested: [list]
- Themes tested: [Light/Dark + custom]

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
| MCP Visual Review | @visual-reviewer | ✅ If UI changed |
| UX Flows Documented | `docs/user-flows/` | ✅ If UI changed |
| UX Analysis Passed | No critical UX issues | ✅ If UI changed |

**Optional (periodic):**

| Gate | Command | When |
|------|---------|------|
| Mutation | `npm run test:mutation` | Weekly / Pre-release |
| Test Validation | `npm run validate:all` | Pre-release |
| Full UX Audit | @ux-specialist | Monthly / Major release |

## Agent Delegation Quick Reference

### Non-UI Task
```
1. Decompose task into independent sub-tasks
2. Spawn in parallel:
   - @developer-1 [sub-task 1]
   - @developer-2 [sub-task 2]
   - @developer-N [sub-task N]
   (Skip if single small task - use one @developer)
3. In parallel (after devs complete):
   - @code-reviewer [review code]
   - codex review --uncommitted [second opinion]
   - @test-developer [write tests]
4. Consolidate reviews
5. @developer [fix issues if any]
6. Run tests
7. Done
```

### UI Task
```
1. Decompose task into independent sub-tasks
2. Spawn in parallel:
   - @developer-1 [logic sub-task]
   - @developer-2 [UI sub-task]
   - @developer-N [sub-task N]
   (Skip if single small task - use one @developer)
3. Ensure: npm run dev (Dev Server running)
4. In parallel (after devs complete):
   - @code-reviewer [review code]
   - codex review --uncommitted [second opinion]
   - @test-developer [write tests]
   - @visual-reviewer [MCP browser inspection at 1920x1080]
5. Consolidate reviews
6. @developer [fix issues if any]
7. @ux-specialist [document + analyze flows]
8. Run tests
9. Done
```

### UX-Only Task
```
1. @ux-specialist [document + analyze flows]
2. @developer [fix issues if any]
3. Run tests
4. Done
```

### Visual-Review-Only Task
```
1. Ensure: npm run dev
2. @visual-reviewer
   - Viewport: 1920x1080 (primary)
   - States: Empty, Loaded, Editing, Error
   - Themes: Light, Dark + at least 1 custom (7 available)
   - Check: Console Errors
3. Report issues or confirm OK
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

# Dev Server (required for @visual-reviewer)
npm run dev
```

## Decision Rules

| Situation | Action |
|-----------|--------|
| Requirements unclear | Ask user for clarification |
| Reviewer finds critical issue | @developer fixes → re-review |
| Tests fail | @developer or @test-developer fixes |
| Visual issues found | @developer fixes → @visual-reviewer re-checks |
| UX issues found | @developer fixes → @ux-specialist re-checks |
| MCP not working | Check: `claude mcp list`, reinstall if needed |
| Dev Server not running | Start: `cd hl7-helper-web && npm run dev` |
| 3+ review cycles without resolution | Escalate to user |
| Major architecture decision | Present options to user |
| @code-reviewer and @codex-cli agree | High confidence, proceed |
| @code-reviewer and @codex-cli disagree on severity | Address higher severity |
| @code-reviewer and @codex-cli have conflicting fixes | Escalate to user |
| Codex CLI not installed | `npm install -g @openai/codex` |
| Task has 3+ independent parts | Break down and spawn parallel developers |
| Task is single-file, <50 lines | Single developer is fine |
| Unsure if tasks are independent | Ask: "Does B need A's output?" - if no, parallelize |

## Communication

**Status Update:**
```
## Status: [Task]
Phase: Implementation / Review / Visual Review / UX Analysis / Testing / Complete
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

**Visual Review**: [Passed at 1920x1080 / N/A]

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
- ❌ Running @visual-reviewer without Dev Server
- ❌ Using wrong viewport (always start with 1920x1080)
- ❌ Skipping @ux-specialist for UI changes
- ❌ Infinite review loops (max 3, then escalate)
- ❌ Forgetting to `cd hl7-helper-web` before running commands
- ❌ Running @codex-cli without @code-reviewer (second opinion needs first opinion)
- ❌ Letting one reviewer override the other without escalation on conflicts
- ❌ Running developers sequentially when tasks are independent
- ❌ Not breaking down large tasks into parallel sub-tasks
- ❌ Waiting for one developer to finish before spawning another (when independent)

## Periodic Tasks

| Task | Frequency | Agents |
|------|-----------|--------|
| Mutation Testing | Weekly | (automated) |
| Full UX Audit | Monthly | @ux-specialist |
| Test Validation | Pre-release | @test-validator |
| Accessibility Audit | Monthly | @visual-reviewer + manual |
| Flow Documentation Review | After major features | @ux-specialist |
| MCP Health Check | Weekly | `claude mcp list` |

## Getting Started

When you receive a task:

1. **Understand**: What type of task? What files involved? UI changes?
2. **Check state**: `cd hl7-helper-web && git status`
3. **Check MCP** (if UI): `claude mcp list`
4. **Start Dev Server** (if UI): `npm run dev`
5. **Delegate**: Send to @developer with clear spec
6. **Coordinate**: Parallel review after implementation
7. **Visual Review** (if UI): @visual-reviewer with MCP at 1920x1080
8. **UX Check** (if UI): @ux-specialist
9. **Verify**: Run all quality gates
10. **Complete**: Summarize and commit

If task is unclear, ask:
- "What is the expected behavior?"
- "Which files should be changed?"
- "Are there constraints I should know about?"
- "What does 'done' look like?"
- "Does this involve UI changes?"