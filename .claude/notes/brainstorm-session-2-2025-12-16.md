# Brainstorm Session #2 - Research and Deep Dive

**Timestamp**: 2025-12-16T13:23:31 UTC
**Session Type**: 60-minute interval research session
**Timer Status**: 60 min elapsed, next trigger in 30 min

---

## 1. Research Findings

### Visual Testing: Percy vs Chromatic

Based on research, here's the comparison for our project:

| Aspect | Percy | Chromatic | Our Fit |
|--------|-------|-----------|---------|
| **Focus** | Full-page, cross-browser | Component-level, Storybook | Percy better (we use Playwright E2E) |
| **Parallelization** | Limited in base plan | Unlimited included | Chromatic wins |
| **Git Baseline** | Basic algorithm | Git-based, branch-aware | Chromatic wins |
| **CI Integration** | GitHub Actions, GitLab | Same | Tie |
| **Cost** | Per-screenshot | Per-snapshot | Similar |

**Recommendation for HL7 Helper Web**:
- We already use Playwright for visual tests (5 baseline snapshots)
- **Percy** is better for our page-level E2E approach
- Alternative: Keep Playwright for now, evaluate Percy if cross-browser issues arise
- Estimated effort: 4-8 hours to integrate Percy

**Sources**:
- [Percy vs Chromatic Comparison](https://www.chromatic.com/compare/percy)
- [Visual Testing Tools Comparison 2025](https://vizzly.dev/visual-testing-tools-comparison/)

---

### PWA (Progressive Web App) for Next.js

**Good news**: Next.js 14+ has built-in PWA support!

**Setup Steps**:
1. Create `app/manifest.ts` or `app/manifest.json` (built-in Next.js support)
2. Add icons to `/public` directory
3. For offline: Use [Serwist](https://serwist.pages.dev/) (next-pwa successor)
4. Configure service worker for caching

**Effort Estimate**: 4-6 hours for basic PWA, 8-12 hours with full offline support

**Benefits for HL7 Helper Web**:
- Install prompt ("Add to Home Screen")
- Works offline (critical for hospital environments with spotty WiFi!)
- App-like experience
- No app store approval needed

**Concerns**:
- Service workers add complexity
- Caching strategy needs careful design (don't cache stale templates)
- Testing is harder (need to test with service worker enabled/disabled)

**Verdict**: Worth pursuing after Phase 2. Hospital environments benefit from offline mode.

**Sources**:
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Serwist (next-pwa successor)](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7)

---

### React 19 `use()` Hook

**What it does**: Simplifies data fetching by eliminating useEffect + useState pattern.

**Current Code (templates/page.tsx)**:
```typescript
// Before: useEffect + useState
const [templates, setTemplates] = useState<Template[]>([]);
useEffect(() => {
  loadTemplates().then(setTemplates);
}, []);
```

**With React 19 use()**:
```typescript
// After: use() with Suspense
const templatesPromise = loadTemplates(); // Create once

function TemplateList() {
  const templates = use(templatesPromise);
  return <div>{templates.map(...)}</div>;
}

// Wrap with Suspense
<Suspense fallback={<Skeleton />}>
  <TemplateList />
</Suspense>
```

**Benefits**:
- Cleaner code
- Automatic loading states via Suspense
- Better integration with error boundaries
- Streaming SSR compatible

**Caveats**:
- Promise must be created outside component (or cached)
- Need `cache()` wrapper for memoization
- Error boundary required for error handling

**Verdict**: Apply to template loading in Phase 1. Low risk, high code quality improvement.

**Sources**:
- [React 19 use() Documentation](https://react.dev/reference/react/use)
- [use() Hook Guide](https://blog.stackademic.com/effective-data-fetching-in-next-js-15-and-react-19-with-the-use-hook-5de67a431d29)

---

## 2. Session #1 Questions Resolved

**Q3: Visual regression across platforms?**
- **Answer**: Percy for cloud-based, or accept Playwright limitations
- **Decision**: Stay with Playwright for now, add Percy if cross-browser issues arise

**Q4: Is PWA worth pursuing?**
- **Answer**: YES, especially for hospital environments (offline support)
- **Decision**: Add to roadmap after Phase 2, before Phase 3

**Q5: React 19 use() hook for data loading?**
- **Answer**: YES, apply to template loading
- **Decision**: Include in Phase 1 quick wins

---

## 3. New Insights from Research

### Insight 1: Hospital Environment Considerations

HL7 messages are used in healthcare. Hospital environments have:
- Spotty WiFi in some areas
- Security restrictions on software installation
- Need for reliability over features

**Implications**:
- PWA with offline support is HIGH value
- Local-first persistence (already implemented) is critical
- Security (XSS protection) is well-implemented
- Should consider HIPAA compliance messaging (even though we don't store PHI)

### Insight 2: Storybook Could Benefit Component Development

While researching Chromatic (built for Storybook), I realized:
- We don't have Storybook set up
- FieldInput (350 LOC) would benefit from isolated component development
- Storybook helps document component API

**Consideration**: Add Storybook before splitting FieldInput
- Shows component in isolation
- Documents props and states
- Enables visual regression at component level
- Effort: 4-6 hours initial setup

### Insight 3: Service Worker Caching Strategy

For PWA offline support, need careful caching:
- **Cache**: Static assets (JS, CSS, icons)
- **Network-first**: API data, templates
- **Never cache**: localStorage/IndexedDB operations (already local)

**Our data flow**:
```
User imports template → IndexedDB (local)
User edits message → In-memory (component state)
User exports → File download (no network)
```

This is ALREADY offline-compatible! PWA would just add:
- Install prompt
- Cached JS/CSS for faster loads
- Offline indicator

---

## 4. Refined Priority Order (Updated)

### Phase 1: Quick Wins (Updated)
1. **Bundle Analyzer** - 1 hour ⬅️ DATA FIRST
2. **React 19 use() for template loading** - 2 hours ⬅️ NEW
3. **FieldInput Split** - 8 hours (strongest signal)
4. **Zod Runtime Validation** - 4 hours
5. **Pre-commit Hooks (Husky)** - 1 hour

### Phase 1.5: Developer Experience
6. **Storybook Setup** - 4 hours (benefits component work)
7. **useHl7Editor Hook** - 4 hours

### Phase 2: Major Features (No changes)
8. **Undo/Redo System**
9. **Field Search/Jump**
10. **Message Validation**

### Phase 2.5: PWA (New)
11. **PWA Manifest + Icons** - 2 hours
12. **Service Worker (Serwist)** - 4 hours
13. **Offline Testing** - 2 hours

### Phase 3: Polish (No changes)
- Keyboard shortcuts
- Interpretation
- Virtualization (if needed)

---

## 5. Technical Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual testing | Keep Playwright, evaluate Percy later | No cross-browser issues yet |
| PWA | Yes, after Phase 2 | Hospital environment benefits |
| React 19 use() | Yes, Phase 1 | Low risk, cleaner code |
| Storybook | Yes, before FieldInput split | Helps component development |
| Percy vs Chromatic | Percy (if needed) | We do page-level, not component-level |

---

## 6. New Questions Discovered

**Q8: Should we add HIPAA disclaimer?**
- App processes HL7 (health data format)
- We don't store/transmit PHI (all local)
- But users might not know that
- **Action**: Add "Data stays on your device" message?

**Q9: Storybook before or after FieldInput split?**
- Before: Can document current API, helps refactoring
- After: Less to document initially
- **Leaning**: Before, as it aids the refactoring

**Q10: Should templates sync to cloud?**
- Current: Local only (IndexedDB/localStorage)
- Future: Cloud sync for teams?
- **Scope**: Out of scope for now, but architecture should allow it

---

## 7. Action Items for Session #3

1. **Investigate**: Storybook setup effort for Next.js 14
2. **Draft**: HIPAA/data privacy messaging
3. **Check**: Bundle analyzer output (if time)
4. **Prepare**: Phase 1 implementation checklist

---

## 8. Timer Status Check

- Script started: 2025-12-16T12:23:31 UTC
- Current time: ~2025-12-16T13:25 UTC
- Elapsed: ~62 minutes
- Next brainstorm trigger: ~28 minutes (13:53:31 UTC)
- Final review trigger: ~58 minutes (14:23:31 UTC)

**Status**: Timer running correctly. On track for Session #3 and final review.

---

## 9. Summary of Session #2

**Research Completed**:
- Percy vs Chromatic → Percy better for our use case
- PWA for Next.js → Feasible, 4-6 hours, valuable for hospitals
- React 19 use() → Apply to template loading, Phase 1

**Decisions Made**:
- Add Storybook to roadmap
- Add PWA after Phase 2
- React 19 use() in Phase 1
- Stay with Playwright for visual tests

**New Considerations**:
- HIPAA/privacy messaging
- Hospital offline requirements
- Cloud sync as future possibility

---

**End of Session #2**
*This note will NOT be overwritten. Session #3 will create a new file.*
