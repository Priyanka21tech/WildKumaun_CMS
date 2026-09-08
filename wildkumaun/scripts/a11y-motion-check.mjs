import { chromium } from '@playwright/test'
const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
const browser = await chromium.launch()
for (const pref of ['no-preference', 'reduce']) {
  const ctx = await browser.newContext({ reducedMotion: pref === 'reduce' ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1800)
  const r = await page.evaluate(() => {
    let animated = 0, transitioned = 0
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el)
      const a = parseFloat(cs.animationDuration) || 0
      const t = parseFloat(cs.transitionDuration) || 0
      if (a > 0.001) animated++
      if (t > 0.001) transitioned++
    }
    return { animated, transitioned, marquee: document.querySelectorAll('marquee').length }
  })
  console.log(`  prefers-reduced-motion: ${pref.padEnd(14)} animations>0.001s: ${String(r.animated).padStart(4)}   transitions>0.001s: ${String(r.transitioned).padStart(4)}   <marquee>: ${r.marquee}`)
  await ctx.close()
}
await browser.close()
