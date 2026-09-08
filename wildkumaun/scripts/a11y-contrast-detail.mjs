/**
 * Pulls the numbers behind axe's color-contrast violations.
 *
 * The rule result carries the measured foreground, background and ratio for
 * every failing node, which is what a fix has to be chosen against — guessing a
 * darker shade and re-scanning is slower and usually lands short of 4.5:1.
 */
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
const ROUTES = (process.env.A11Y_ROUTES || '/,/about-us,/contact-us,/gallery,/faqs').split(',')

const browser = await chromium.launch()
const ctx = await browser.newContext()

/** selector-shape -> { count, fg, bg, ratio, expected, sample } */
const groups = new Map()

for (const route of ROUTES) {
  const page = await ctx.newPage()
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  const res = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze()
  const rule = res.violations.find((v) => v.id === 'color-contrast')
  if (!rule) {
    await page.close()
    continue
  }

  for (const node of rule.nodes) {
    const data = (node.any?.[0]?.data) || {}
    const target = node.target.join(' ')
    // Collapse nth-child noise so repeated menu links group together.
    const shape = target.replace(/:nth-child\(\d+\)/g, '').replace(/\[href[^\]]*\]/g, '[href]')
    const key = `${shape} | ${data.fgColor} on ${data.bgColor}`
    const g = groups.get(key) || {
      count: 0,
      shape,
      fg: data.fgColor,
      bg: data.bgColor,
      ratio: data.contrastRatio,
      expected: data.expectedContrastRatio,
      fontSize: data.fontSize,
      fontWeight: data.fontWeight,
      sample: target,
      routes: new Set(),
    }
    g.count++
    g.routes.add(route)
    groups.set(key, g)
  }
  await page.close()
}

await ctx.close()
await browser.close()

const rows = [...groups.values()].sort((a, b) => b.count - a.count)
console.log(`\n  color-contrast failures, grouped — ${rows.length} distinct combinations\n`)
for (const r of rows) {
  console.log(
    `  x${String(r.count).padStart(3)}  ${String(r.ratio).padStart(5)}:1  (needs ${r.expected})  ` +
      `${r.fg} on ${r.bg}   ${r.fontSize}, weight ${r.fontWeight}`,
  )
  console.log(`        ${r.shape.slice(0, 100)}`)
  console.log(`        pages: ${[...r.routes].join(' ')}`)
}
console.log()
