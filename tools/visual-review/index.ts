import { chromium, type Browser, type Page } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs/promises'
import * as path from 'path'

interface PageConfig {
  name: string
  path: string
  actions?: Array<{
    type: 'click' | 'fill' | 'wait'
    selector?: string
    value?: string
    duration?: number
  }>
}

interface Config {
  baseUrl: string
  pages: PageConfig[]
  viewports: Array<{ name: string; width: number; height: number }>
  outputDir: string
}

interface Issue {
  severity: 'critical' | 'major' | 'minor'
  category: string
  description: string
  location: string
  suggestion: string
}

const PROMPT = `You are a senior UI/UX engineer reviewing a screenshot for visual bugs.

Analyze for:
- Layout issues (overflow, overlap, misalignment)
- Text problems (truncation, contrast, orphans)
- Spacing inconsistencies
- Responsive issues
- Accessibility concerns (contrast, touch targets)
- Design consistency

Respond in JSON:
{
  "issues": [
    {
      "severity": "critical|major|minor",
      "category": "layout|text|spacing|accessibility|consistency",
      "description": "What's wrong",
      "location": "Where in screenshot",
      "suggestion": "How to fix"
    }
  ],
  "positives": ["What's done well"],
  "score": 1-10
}`

class VisualReviewer {
  private browser: Browser | null = null
  private client: Anthropic

  constructor() {
    this.client = new Anthropic()
  }

  async init() {
    this.browser = await chromium.launch()
  }

  async close() {
    await this.browser?.close()
  }

  private async capture(page: Page, name: string, dir: string): Promise<string> {
    const filepath = path.join(dir, `${name}.png`)
    await page.screenshot({ path: filepath, fullPage: true })
    return filepath
  }

  private async analyze(filepath: string): Promise<{ issues: Issue[]; positives: string[]; score: number }> {
    const data = await fs.readFile(filepath)
    const base64 = data.toString('base64')

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
          { type: 'text', text: PROMPT }
        ]
      }]
    })

    const text = response.content.find(c => c.type === 'text')
    if (!text || text.type !== 'text') return { issues: [], positives: [], score: 0 }

    try {
      const json = text.text.replace(/```json\s*|\s*```/g, '')
      const parsed = JSON.parse(json)
      return { issues: parsed.issues || [], positives: parsed.positives || [], score: parsed.score || 0 }
    } catch {
      return { issues: [], positives: ['Analysis failed to parse'], score: 0 }
    }
  }

  async review(config: Config) {
    await fs.mkdir(config.outputDir, { recursive: true })
    await this.init()

    const results: Array<{
      page: string
      viewport: string
      screenshot: string
      issues: Issue[]
      positives: string[]
      score: number
    }> = []

    try {
      for (const pageConfig of config.pages) {
        for (const viewport of config.viewports) {
          console.log(`Reviewing: ${pageConfig.name} @ ${viewport.name}`)

          const context = await this.browser!.newContext({
            viewport: { width: viewport.width, height: viewport.height }
          })
          const page = await context.newPage()

          await page.goto(`${config.baseUrl}${pageConfig.path}`, { waitUntil: 'networkidle' })

          if (pageConfig.actions) {
            for (const action of pageConfig.actions) {
              if (action.type === 'click') await page.click(action.selector!)
              if (action.type === 'fill') await page.fill(action.selector!, action.value!)
              if (action.type === 'wait') await page.waitForTimeout(action.duration || 1000)
            }
          }

          await page.waitForTimeout(500)

          const screenshot = await this.capture(
            page,
            `${pageConfig.name}-${viewport.name}`,
            config.outputDir
          )

          const analysis = await this.analyze(screenshot)
          results.push({
            page: pageConfig.name,
            viewport: viewport.name,
            screenshot,
            ...analysis
          })

          await context.close()
          await new Promise(r => setTimeout(r, 1000)) // Rate limit
        }
      }
    } finally {
      await this.close()
    }

    await this.writeReport(results, config.outputDir)
    return results
  }

  private async writeReport(results: Array<{
    page: string
    viewport: string
    screenshot: string
    issues: Issue[]
    positives: string[]
    score: number
  }>, dir: string) {
    const critical = results.flatMap(r => r.issues.filter(i => i.severity === 'critical'))
    const major = results.flatMap(r => r.issues.filter(i => i.severity === 'major'))
    const minor = results.flatMap(r => r.issues.filter(i => i.severity === 'minor'))
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

    const report = `# AI Visual Review Report
Generated: ${new Date().toISOString()}

## Summary
- Pages reviewed: ${[...new Set(results.map(r => r.page))].length}
- Viewports: ${[...new Set(results.map(r => r.viewport))].join(', ')}
- Average score: ${avgScore.toFixed(1)}/10
- Critical issues: ${critical.length}
- Major issues: ${major.length}
- Minor issues: ${minor.length}

## Critical Issues
${critical.length === 0 ? 'None\n' : critical.map(i => `- **${i.category}**: ${i.description}
  - Location: ${i.location}
  - Fix: ${i.suggestion}`).join('\n\n')}

## Major Issues
${major.length === 0 ? 'None\n' : major.map(i => `- **${i.category}**: ${i.description}
  - Fix: ${i.suggestion}`).join('\n\n')}

## Minor Issues
${minor.length === 0 ? 'None\n' : minor.map(i => `- ${i.description} - ${i.suggestion}`).join('\n')}

## Positives
${results.flatMap(r => r.positives).map(p => `- ${p}`).join('\n')}

## Per-Page Results
${results.map(r => `### ${r.page} (${r.viewport}) - Score: ${r.score}/10
- Issues: ${r.issues.length}
- Screenshot: ${path.basename(r.screenshot)}`).join('\n\n')}
`

    await fs.writeFile(path.join(dir, 'REPORT.md'), report)
    await fs.writeFile(path.join(dir, 'results.json'), JSON.stringify(results, null, 2))

    console.log(`\nReport saved to: ${path.join(dir, 'REPORT.md')}`)
    console.log(`Average score: ${avgScore.toFixed(1)}/10`)

    if (critical.length > 0) {
      console.log(`\n${critical.length} critical issues found!`)
      process.exit(1)
    }
  }
}

async function main() {
  const configPath = process.argv[2] || './config.json'
  const config: Config = JSON.parse(await fs.readFile(configPath, 'utf-8'))

  const reviewer = new VisualReviewer()
  await reviewer.review(config)
}

main().catch(console.error)
