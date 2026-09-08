/**
 * Submits the enquiry form empty and checks what a screen reader would be told.
 *
 * Everything here is read from the accessibility tree or from ARIA state rather
 * than from what is on screen, because the whole point of the change is what
 * happens for someone who cannot see it.
 */
import { chromium } from '@playwright/test'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
const ROUTE = process.env.A11Y_ROUTE || '/contact-us'

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
await page.goto(BASE + ROUTE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1800)

const before = await page.evaluate(() => {
  const c = document.querySelector('.wpforms-error-container')
  return { summaryHidden: c?.hidden, invalidFields: document.querySelectorAll('[aria-invalid="true"]').length }
})
console.log('\n  before submit:', JSON.stringify(before))

await page.click('button.wpforms-submit')
await page.waitForTimeout(700)

const after = await page.evaluate(() => {
  const c = document.querySelector('.wpforms-error-container')
  const active = document.activeElement
  return {
    summaryHidden: c?.hidden,
    summaryRole: c?.getAttribute('role'),
    summaryText: (c?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160),
    summaryLinks: [...(c?.querySelectorAll('a') || [])].map((a) => a.textContent.trim()),
    focusIsSummary: active === c,
    focusedTag: active?.tagName.toLowerCase(),
    invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map((el) => ({
      id: el.id,
      describedby: el.getAttribute('aria-describedby'),
      message: document.getElementById(el.getAttribute('aria-describedby') || '')?.textContent,
    })),
  }
})

console.log('\n  after submitting an empty form')
console.log('    summary hidden        :', after.summaryHidden)
console.log('    summary role          :', after.summaryRole)
console.log('    focus moved to summary:', after.focusIsSummary, '(' + after.focusedTag + ')')
console.log('    summary text          :', after.summaryText)
console.log('    links in summary      :', after.summaryLinks.length)
for (const l of after.summaryLinks) console.log('        - ' + l)
console.log('    fields marked invalid :', after.invalid.length)
for (const f of after.invalid) console.log(`        ${f.id} -> ${f.describedby} = "${f.message}"`)

// Following the first link should land focus on the field it names.
if (after.summaryLinks.length) {
  await page.click('.wpforms-error-container a')
  await page.waitForTimeout(300)
  const landed = await page.evaluate(() => document.activeElement?.id)
  console.log('\n    clicking the first link focuses:', landed)
}

await ctx.close()
await browser.close()
console.log()
