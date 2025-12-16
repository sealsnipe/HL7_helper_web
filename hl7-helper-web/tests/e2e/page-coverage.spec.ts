import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Page Coverage Detection Test
 *
 * This test crawls the application to discover all reachable pages and compares
 * them against a known baseline. If new pages are detected, it fails with
 * instructions to spawn the @ux-analyst agent for proper documentation.
 *
 * Baseline file format: plain text, one route per line, sorted alphabetically
 * Baseline location: tests/baselines/pages-{timestamp}.txt
 */

const BASELINES_DIR = path.join(__dirname, '..', 'baselines');
const BASELINE_PREFIX = 'pages-';

interface PageDiscoveryResult {
  route: string;
  title: string;
  foundVia: 'navigation' | 'link' | 'redirect' | 'initial';
}

/**
 * Find the most recent baseline file
 */
function findLatestBaselineFile(): string | null {
  if (!fs.existsSync(BASELINES_DIR)) {
    return null;
  }

  const files = fs.readdirSync(BASELINES_DIR)
    .filter(f => f.startsWith(BASELINE_PREFIX) && f.endsWith('.txt'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(BASELINES_DIR, files[0]) : null;
}

/**
 * Read known pages from baseline file
 */
function readBaselinePages(filePath: string): Set<string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const pages = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
  return new Set(pages);
}

/**
 * Generate timestamp for new baseline file
 */
function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
}

/**
 * Write new baseline file
 */
function writeBaselineFile(pages: string[]): string {
  if (!fs.existsSync(BASELINES_DIR)) {
    fs.mkdirSync(BASELINES_DIR, { recursive: true });
  }

  const timestamp = generateTimestamp();
  const filename = `${BASELINE_PREFIX}${timestamp}.txt`;
  const filePath = path.join(BASELINES_DIR, filename);

  const content = [
    `# Page Coverage Baseline`,
    `# Generated: ${new Date().toISOString()}`,
    `# Total pages: ${pages.length}`,
    `#`,
    `# Format: One route per line, sorted alphabetically`,
    `# Lines starting with # are comments`,
    ``,
    ...pages.sort()
  ].join('\n');

  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

test.describe('Page Coverage Detection', () => {
  test('should detect all reachable pages and compare against baseline', async ({ page }) => {
    const discoveredPages = new Map<string, PageDiscoveryResult>();
    const visitedUrls = new Set<string>();
    const pagesToVisit: Array<{ url: string; via: PageDiscoveryResult['foundVia'] }> = [];

    // Start with the home page
    pagesToVisit.push({ url: '/', via: 'initial' });

    // Crawl the application
    while (pagesToVisit.length > 0) {
      const { url, via } = pagesToVisit.shift()!;

      // Normalize URL (remove trailing slash, query params for comparison)
      const normalizedUrl = url.split('?')[0].replace(/\/$/, '') || '/';

      if (visitedUrls.has(normalizedUrl)) {
        continue;
      }
      visitedUrls.add(normalizedUrl);

      try {
        // Navigate to the page
        await page.goto(normalizedUrl, { waitUntil: 'networkidle', timeout: 10000 });

        // Get the final URL (in case of redirects)
        const finalUrl = new URL(page.url()).pathname;
        const normalizedFinalUrl = finalUrl.replace(/\/$/, '') || '/';

        // Get page title
        const title = await page.title();

        // Record the discovered page
        if (!discoveredPages.has(normalizedFinalUrl)) {
          discoveredPages.set(normalizedFinalUrl, {
            route: normalizedFinalUrl,
            title: title,
            foundVia: via
          });
        }

        // Find all internal links on the page
        const links = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a[href]'));
          const buttons = Array.from(document.querySelectorAll('button[data-href], [role="link"]'));

          const hrefs: string[] = [];

          anchors.forEach(anchor => {
            const href = anchor.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
              hrefs.push(href);
            }
          });

          // Also check for Next.js Link components that might use router
          buttons.forEach(btn => {
            const href = btn.getAttribute('data-href');
            if (href) hrefs.push(href);
          });

          return hrefs;
        });

        // Add discovered links to the queue
        for (const link of links) {
          const absoluteLink = link.startsWith('/') ? link : `/${link}`;
          const normalizedLink = absoluteLink.split('?')[0].replace(/\/$/, '') || '/';

          if (!visitedUrls.has(normalizedLink) && !pagesToVisit.some(p => p.url === normalizedLink)) {
            pagesToVisit.push({ url: normalizedLink, via: 'link' });
          }
        }

        // Also check for navigation elements that might trigger page changes
        const navLinks = await page.evaluate(() => {
          // Look for common navigation patterns
          const navSelectors = [
            'nav a[href]',
            'header a[href]',
            '[role="navigation"] a[href]'
          ];

          const hrefs: string[] = [];
          navSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
              const href = el.getAttribute('href');
              if (href && !href.startsWith('http') && !href.startsWith('#')) {
                hrefs.push(href);
              }
            });
          });

          return hrefs;
        });

        for (const link of navLinks) {
          const absoluteLink = link.startsWith('/') ? link : `/${link}`;
          const normalizedLink = absoluteLink.split('?')[0].replace(/\/$/, '') || '/';

          if (!visitedUrls.has(normalizedLink) && !pagesToVisit.some(p => p.url === normalizedLink)) {
            pagesToVisit.push({ url: normalizedLink, via: 'navigation' });
          }
        }

      } catch (error) {
        // Page might not exist or timeout - skip it
        console.warn(`Could not visit ${normalizedUrl}: ${error}`);
      }
    }

    // Get list of discovered routes
    const discoveredRoutes = Array.from(discoveredPages.keys()).sort();

    // Find baseline file
    const baselineFile = findLatestBaselineFile();

    if (!baselineFile) {
      // No baseline exists - create one and pass the test
      const newBaselinePath = writeBaselineFile(discoveredRoutes);
      console.log(`\n${'='.repeat(80)}`);
      console.log('BASELINE CREATED');
      console.log('='.repeat(80));
      console.log(`No existing baseline found. Created initial baseline at:`);
      console.log(`  ${newBaselinePath}`);
      console.log(`\nDiscovered ${discoveredRoutes.length} pages:`);
      discoveredRoutes.forEach(route => {
        const info = discoveredPages.get(route)!;
        console.log(`  - ${route} (via: ${info.foundVia}, title: "${info.title}")`);
      });
      console.log('='.repeat(80));
      return; // Pass - this is initial setup
    }

    // Compare against baseline
    const knownPages = readBaselinePages(baselineFile);
    const newPages = discoveredRoutes.filter(route => !knownPages.has(route));
    const removedPages = Array.from(knownPages).filter(route => !discoveredRoutes.includes(route));

    // If there are new pages, fail with detailed instructions
    if (newPages.length > 0) {
      const errorMessage = [
        '',
        '='.repeat(80),
        'NEW PAGE(S) DETECTED - UX ANALYSIS REQUIRED',
        '='.repeat(80),
        '',
        `${newPages.length} new page(s) found that are not in the baseline:`,
        '',
        ...newPages.map(route => {
          const info = discoveredPages.get(route);
          return `  NEW: ${route}`;
        }),
        '',
        '-'.repeat(80),
        'REQUIRED ACTION',
        '-'.repeat(80),
        '',
        'A new page has been added to the application. This requires UX analysis',
        'to ensure proper documentation and adherence to UI principles.',
        '',
        'Please spawn the @ux-analyst agent with the following task:',
        '',
        '  @ux-analyst',
        '  ',
        '  ## New Page Detected',
        '  ',
        '  The following new page(s) have been added to the application:',
        ...newPages.map(route => `  - ${route}`),
        '  ',
        '  ## Required Tasks',
        '  1. Document the user flow(s) for the new page(s)',
        '  2. Update the flow map in docs/user-flows/README.md',
        '  3. Verify UI principles compliance (see .claude/ui-principles/)',
        '  4. Create/update flow documentation in docs/user-flows/',
        '  ',
        '  ## After Documentation',
        '  Run @ux-designer to analyze the new flows for any UX issues.',
        '',
        '-'.repeat(80),
        'UPDATING THE BASELINE',
        '-'.repeat(80),
        '',
        'After the UX analysis is complete and approved, update the baseline:',
        '',
        `  1. Delete or archive the old baseline: ${path.basename(baselineFile)}`,
        '  2. Run this test again to generate a new baseline',
        '  3. Commit the new baseline file',
        '',
        '-'.repeat(80),
        'CURRENT BASELINE INFO',
        '-'.repeat(80),
        `  File: ${baselineFile}`,
        `  Known pages: ${knownPages.size}`,
        `  Discovered pages: ${discoveredRoutes.length}`,
        '',
        '='.repeat(80),
      ].join('\n');

      // Fail the test with the detailed message
      expect(newPages, errorMessage).toHaveLength(0);
    }

    // Log removed pages as a warning (pages that used to exist but don't anymore)
    if (removedPages.length > 0) {
      console.warn(`\nWarning: ${removedPages.length} page(s) from baseline no longer found:`);
      removedPages.forEach(route => console.warn(`  REMOVED: ${route}`));
      console.warn(`\nConsider updating the baseline if these pages were intentionally removed.\n`);
    }

    // All pages match baseline - test passes
    console.log(`\nPage coverage check passed. ${discoveredRoutes.length} pages match baseline.`);
  });

  test('should verify all discovered pages are accessible', async ({ page }) => {
    // This test verifies that all pages in the baseline are actually accessible
    const baselineFile = findLatestBaselineFile();

    if (!baselineFile) {
      test.skip(!baselineFile, 'No baseline file exists yet. Run the discovery test first.');
      return;
    }

    const knownPages = readBaselinePages(baselineFile);
    const inaccessiblePages: Array<{ route: string; error: string }> = [];

    for (const route of knownPages) {
      try {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10000 });

        if (!response || response.status() >= 400) {
          inaccessiblePages.push({
            route,
            error: `HTTP ${response?.status() || 'no response'}`
          });
        }
      } catch (error) {
        inaccessiblePages.push({
          route,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (inaccessiblePages.length > 0) {
      const errorMessage = [
        '',
        'The following pages from the baseline are not accessible:',
        '',
        ...inaccessiblePages.map(p => `  - ${p.route}: ${p.error}`),
        '',
        'If these pages were removed intentionally, update the baseline file.',
      ].join('\n');

      expect(inaccessiblePages, errorMessage).toHaveLength(0);
    }
  });
});
