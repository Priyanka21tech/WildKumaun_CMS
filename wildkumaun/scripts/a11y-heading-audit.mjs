/**
 * Lists the heading outline of every mirrored page as the browser sees it.
 *
 * Read from the rendered DOM rather than content/mirror/*.json, because the CMS
 * blocks and the header and footer are spliced in at render time and contribute
 * headings of their own — an outline taken from the mirror alone would be the
 * wrong one to make a decision against.
 */
import { chromium } from '@playwright/test'
import { readdirSync, writeFileSync, mkdirSync } from 'fs'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'

const routes = readdirSync('content/mirror')
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => f.replace(/\.json$/, ''))
  .map((slug) => (slug === 'index' ? '/' : '/' + slug))
  .sort()

const browser = await chromium.launch()
const ctx = await browser.newContext()
const rows = []

for (const route of routes) {
  const page = await ctx.newPage()
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(900)
    const info = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
        .filter((h) => h.offsetParent !== null || h.tagName === 'H1')
        .map((h) => ({ level: h.tagName.toLowerCase(), text: (h.innerText || '').trim().slice(0, 46) }))
      return { h1: hs.filter((h) => h.level === 'h1').length, headings: hs.slice(0, 6) }
    })
    rows.push({ route, ...info })
    const first = info.headings[0]
    console.log(
      `  ${route.padEnd(38)} h1=${info.h1}   first: ${first ? first.level + ' "' + first.text + '"' : '(none)'}`,
    )
  } catch (err) {
    console.log(`  ${route.padEnd(38)} ERROR ${err.message.split('\n')[0]}`)
  } finally {
    await page.close()
  }
}

await ctx.close()
await browser.close()

mkdirSync('reports/a11y', { recursive: true })
writeFileSync('reports/a11y/headings.json', JSON.stringify(rows, null, 2))
console.log(`\n  pages without an h1: ${rows.filter((r) => r.h1 === 0).length} of ${rows.length}`)
console.log('  saved reports/a11y/headings.json\n')
