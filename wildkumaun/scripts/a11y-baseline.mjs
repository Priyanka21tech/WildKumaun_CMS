/**
 * Accessibility baseline scan.
 *
 * Runs axe-core against the key routes and writes a JSON snapshot to
 * reports/a11y/. This is the "before" number the remediation work is measured
 * against, so it is a script rather than a test: a test tells you pass or fail,
 * a baseline has to keep the detail.
 *
 * Needs the dev server running on localhost:3000.
 *   npm run dev          (in another terminal)
 *   npm run a11y:baseline
 */
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'

/**
 * Every page the mirror serves, not a sample of five.
 *
 * The first five were the ones being worked on, and reporting "0 violations"
 * from them read as a statement about the site. It was a statement about 5 of
 * 26 pages — and the pages left out are the photograph-heavy ones, which is
 * where the contrast and alt-text problems live.
 *
 * Read from the mirror index so a page added there is scanned without anyone
 * remembering to add it here.
 */
const ROUTES = JSON.parse(
  readFileSync(path.resolve('content/mirror/_pages.json'), 'utf8'),
).map((page) => page.route ?? `/${page.slug}`)

/**
 * `best-practice` alongside the WCAG tags.
 *
 * Two of the seventeen checkpoints — one H1 per page, and headings in order —
 * are axe's `page-has-heading-one` and `heading-order`, and both sit in
 * best-practice rather than under a WCAG success criterion. With only the wcag
 * tags listed, neither was running: the checklist had two items that nothing was
 * actually testing.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

const outDir = path.resolve('reports/a11y')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext()
const results = []

for (const route of ROUTES) {
  const page = await context.newPage()
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(1500) // Elementor scripts settle

    const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze()

    const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 }
    for (const v of axe.violations) {
      if (v.impact && byImpact[v.impact] !== undefined) byImpact[v.impact] += v.nodes.length
    }

    results.push({
      route,
      ...byImpact,
      violations: axe.violations.map((v) => ({
        ruleId: v.id,
        impact: v.impact,
        help: v.help,
        wcag: v.tags.filter((t) => t.startsWith('wcag')).join(', '),
        nodes: v.nodes.length,
        sample: v.nodes[0]?.target?.join(' ') ?? '',
      })),
    })

    const line = Object.entries(byImpact).map(([k, n]) => `${k}:${n}`).join('  ')
    console.log(`  ${route.padEnd(16)} ${line}   (${axe.violations.length} rules)`)
  } catch (err) {
    console.log(`  ${route.padEnd(16)} ERROR: ${err.message.split('\n')[0]}`)
    results.push({ route, error: err.message })
  } finally {
    await page.close()
  }
}

await context.close()
await browser.close()

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const snapshot = {
  scannedAt: new Date().toISOString(),
  baseUrl: BASE,
  standard: 'WCAG 2.2 AA',
  tags: TAGS,
  totals: results.reduce(
    (acc, r) => ({
      critical: acc.critical + (r.critical || 0),
      serious: acc.serious + (r.serious || 0),
      moderate: acc.moderate + (r.moderate || 0),
      minor: acc.minor + (r.minor || 0),
    }),
    { critical: 0, serious: 0, moderate: 0, minor: 0 },
  ),
  pages: results,
}

writeFileSync(path.join(outDir, `baseline-${stamp}.json`), JSON.stringify(snapshot, null, 2))
writeFileSync(path.join(outDir, 'latest.json'), JSON.stringify(snapshot, null, 2))

console.log('\nTOTALS:', snapshot.totals)
console.log('Saved:  reports/a11y/latest.json')
