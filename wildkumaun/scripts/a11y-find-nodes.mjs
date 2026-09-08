/**
 * Prints the outerHTML of the nodes axe is failing, for the rules given.
 *
 * Some of these are built by the origin's scripts after load, so they are not in
 * the mirrored markup and grepping the JSON finds nothing — this reads the DOM
 * the browser actually ends up with.
 */
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
const ROUTES = (process.env.A11Y_ROUTES || '/,/about-us').split(',')
const RULES = (process.env.A11Y_RULES || 'aria-command-name,link-name').split(',')

const browser = await chromium.launch()
const ctx = await browser.newContext()

for (const route of ROUTES) {
  const page = await ctx.newPage()
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  const res = await new AxeBuilder({ page }).withRules(RULES).analyze()
  console.log('\n=== ' + route + ' ===')
  if (!res.violations.length) console.log('  clean')

  for (const v of res.violations) {
    console.log('\n  ' + v.id + ' — ' + v.help)
    for (const node of v.nodes) {
      const html = await page.evaluate((sel) => {
        const el = document.querySelector(sel)
        if (!el) return 'not found'
        const parent = el.parentElement
        return JSON.stringify({
          self: el.outerHTML.slice(0, 200),
          parentTag: parent ? parent.tagName.toLowerCase() : '',
          parentCls: parent ? (parent.className || '').toString().slice(0, 80) : '',
        })
      }, node.target[0])
      const info = JSON.parse(html === 'not found' ? '{"self":"not found"}' : html)
      console.log('    target : ' + node.target.join(' '))
      console.log('    html   : ' + info.self)
      if (info.parentTag) console.log('    parent : <' + info.parentTag + '> ' + info.parentCls)
    }
  }
  await page.close()
}

await ctx.close()
await browser.close()
console.log()
