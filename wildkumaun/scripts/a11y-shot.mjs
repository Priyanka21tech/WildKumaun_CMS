import { chromium } from '@playwright/test'
import { mkdirSync } from 'fs'
const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
mkdirSync('reports/a11y', { recursive: true })
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2000)
// Tab until the nav menu, then hold there.
for (let i = 0; i < 9; i++) await page.keyboard.press('Tab')
await page.waitForTimeout(700)
const el = await page.evaluate(() => (document.activeElement?.innerText || '').trim())
console.log('focused:', el)
await page.screenshot({ path: 'reports/a11y/focus-after.png', clip: { x: 0, y: 0, width: 1440, height: 260 } })
console.log('saved reports/a11y/focus-after.png')
await ctx.close(); await browser.close()
