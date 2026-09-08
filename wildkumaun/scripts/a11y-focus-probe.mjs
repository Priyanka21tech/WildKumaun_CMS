/**
 * Walks the page with real Tab presses and records the focus ring on each stop.
 *
 * Two things this gets right that a naive probe does not: it presses the key
 * rather than calling .focus(), because programmatic focus does not match
 * :focus-visible; and it treats outline-style:auto as a ring, because that is
 * the browser's own focus ring and its width computes to the string 'auto',
 * which parseFloat turns into NaN.
 */
import { chromium } from '@playwright/test'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
const ROUTE = process.env.A11Y_ROUTE || '/'
const STOPS = Number(process.env.A11Y_STOPS || 40)

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
await page.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)

const seen = []
for (let i = 0; i < STOPS; i++) {
  await page.keyboard.press('Tab')
  // Some elements carry 'transition: all .5s', so reading straight after the
  // key press samples the ring mid-animation and reports a width of 0.
  await page.waitForTimeout(600)
  const info = await page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return null
    const cs = getComputedStyle(el)
    const style = cs.outlineStyle
    const width = cs.outlineWidth
    const isAuto = style === 'auto' || width === 'auto'
    const px = parseFloat(width) || 0
    const hasRing = isAuto || (style !== 'none' && px > 0)
    const shadow = cs.boxShadow && cs.boxShadow !== 'none' ? cs.boxShadow.slice(0, 28) : ''
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().split(/\s+/).slice(0, 2).join('.'),
      text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 22).replace(/\n/g, ' '),
      raw: style + '/' + width,
      hasRing,
      shadow,
    }
  })
  if (info) seen.push(info)
}
await ctx.close()
await browser.close()

let bad = 0
console.log('\n  Tab walk on ' + BASE + ROUTE + ' — ' + seen.length + ' stops\n')
seen.forEach((s, i) => {
  const verdict = s.hasRing ? 'RING   ' : s.shadow ? 'shadow ' : 'NO-RING'
  if (!s.hasRing && !s.shadow) bad++
  console.log(
    '  ' + String(i + 1).padStart(2) + '. ' + verdict +
    ' <' + s.tag + '> ' + s.cls.padEnd(24) + ' "' + s.text + '"' +
    '  outline=' + s.raw + (s.shadow ? '  shadow=' + s.shadow : ''),
  )
})
console.log('\n  No visible focus indicator: ' + bad + ' of ' + seen.length + '\n')
