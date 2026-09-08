/**
 * Reports skipped heading levels — WCAG 1.3.1.
 *
 * A jump from h2 straight to h4 tells a screen-reader user there is a level of
 * structure they have missed, so every step down must be by one.
 */
import { chromium } from '@playwright/test'
import { readdirSync } from 'fs'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
const routes = readdirSync('content/mirror')
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => f.replace(/\.json$/, ''))
  .map((s) => (s === 'index' ? '/' : '/' + s))
  .sort()

const browser = await chromium.launch()
const ctx = await browser.newContext()
let bad = 0

for (const route of routes) {
  const page = await ctx.newPage()
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  const skips = await page.evaluate(() => {
    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
      n: Number(h.tagName[1]),
      t: (h.innerText || '').trim().slice(0, 34),
    }))
    const out = []
    for (let i = 1; i < levels.length; i++) {
      if (levels[i].n > levels[i - 1].n + 1) {
        out.push(`h${levels[i - 1].n} "${levels[i - 1].t}" -> h${levels[i].n} "${levels[i].t}"`)
      }
    }
    return out
  })
  if (skips.length) {
    bad++
    console.log(`  ${route}`)
    for (const s of skips) console.log(`      ${s}`)
  }
  await page.close()
}

await ctx.close()
await browser.close()
console.log(`\n  pages with a skipped heading level: ${bad} of ${routes.length}\n`)
