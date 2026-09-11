/**
 * Focus order — WCAG 2.4.3.
 *
 * Tab follows the order of the document. The criterion is met when that order
 * still makes sense to somebody who cannot see the page, and it is broken by
 * exactly two things: a positive tabindex, which jumps the queue, and CSS that
 * moves an element somewhere its position in the document does not match.
 *
 * This reads both. What it cannot do is watch focus move — for that the page has
 * to run in a browser, and the last section of the output says which checks are
 * still owed a human.
 *
 * Needs the dev server running.
 *   node scripts/a11y-focus-order.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
const routes = JSON.parse(
  fs.readFileSync(path.resolve('content/mirror/_pages.json'), 'utf8'),
).map((p) => p.route ?? `/${p.slug}`)

const css = fs.readFileSync(path.resolve('public/wp/site.css'), 'utf8')
const ours = fs.readFileSync(path.resolve('public/a11y.css'), 'utf8')

const domOnly = (h) => {
  const i = h.indexOf('self.__next_f')
  return i > -1 ? h.slice(0, i) : h
}

console.log('=== 1. CSS that moves elements away from their place in the document ===\n')

/**
 * The properties that separate visual order from document order.
 *
 * `order` and the reverse flex directions renumber children outright. `float:
 * right` pulls one element past its siblings. Each is only a problem when it
 * moves something focusable, so the selectors are reported for judgement rather
 * than counted as failures.
 */
const REORDERING = [
  [/\border\s*:\s*(-?[1-9]\d*)\s*[;}]/g, 'flex/grid order'],
  [/flex-direction\s*:\s*(row-reverse|column-reverse)/g, 'reversed flex direction'],
  [/\bfloat\s*:\s*right/g, 'float: right'],
]

for (const [sheet, name] of [
  [css, 'site.css (origin)'],
  [ours, 'a11y.css (ours)'],
]) {
  for (const [re, what] of REORDERING) {
    const rules = []
    let m
    const ruleRe = /([^{}]+)\{([^}]*)\}/g
    let rule
    while ((rule = ruleRe.exec(sheet))) {
      re.lastIndex = 0
      if (re.test(rule[2])) rules.push(rule[1].trim().replace(/\s+/g, ' ').slice(0, 80))
    }
    if (rules.length) {
      console.log(`${name} — ${what}: ${rules.length} rule(s)`)
      for (const r of rules.slice(0, 5)) console.log(`   ${r}`)
      if (rules.length > 5) console.log(`   …and ${rules.length - 5} more`)
      console.log()
    }
  }
}

console.log('\n=== 2. Document order of the focusable elements, per page ===\n')

const shapes = new Map()

for (const route of routes) {
  const html = domOnly(await (await fetch(BASE + route)).text())

  const order = []
  const re = /<(a|button|input|select|textarea|iframe)\b([^>]*)>/g
  let m
  while ((m = re.exec(html))) {
    const tag = m[1]
    const attrs = m[2]
    if (tag === 'input' && /type="(hidden)"/.test(attrs)) continue

    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] ?? ''
    let region = 'content'
    if (/skip-link/.test(cls)) region = 'skip link'
    else if (/hfe-menu-item|hfe-sub-menu-item|hfe-nav-menu__toggle/.test(cls)) region = 'main menu'
    else if (/hfe-search/.test(cls)) region = 'header search'
    else if (/site-logo|hfe-site-logo/.test(cls)) region = 'logo'
    else if (/elementor-swiper-button|owl-prev|owl-next/.test(cls)) region = 'carousel arrow'
    else if (/wk-tagline__pause/.test(cls)) region = 'tagline pause'

    order.push(region)
  }

  // Collapse runs, so "menu menu menu" reads as one step
  const steps = order.filter((r, i) => r !== order[i - 1])
  const shape = steps.join(' → ')
  if (!shapes.has(shape)) shapes.set(shape, [])
  shapes.get(shape).push(route)
}

for (const [shape, list] of [...shapes].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${list.length} page(s): ${list.slice(0, 3).join(', ')}${list.length > 3 ? ` +${list.length - 3}` : ''}`)
  console.log(`   ${shape}`)
  console.log()
}

console.log('\n=== 3. Still needs a browser ===\n')
console.log('  • Whether focus is ever sent somewhere by script (it is, on form errors and Escape)')
console.log('  • Whether a focused element is scrolled into view')
console.log('  • Whether anything absolutely positioned sits visually before what precedes it in the document')
