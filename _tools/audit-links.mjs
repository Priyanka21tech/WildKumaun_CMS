/**
 * Static audit of the built page records: every internal link resolves to a
 * route (or a configured redirect), and every asset the markup references
 * exists on disk under wildkumaun/public.
 *
 * Runs against the files only — no server needed.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIR = path.join(ROOT, 'wildkumaun/content/mirror')
const PUBLIC = path.join(ROOT, 'wildkumaun/public')

// Handled by the redirects in wildkumaun/next.config.ts rather than by a route.
const REDIRECTED = [/^\/category\//, /^\/author\//]

const pages = JSON.parse(fs.readFileSync(path.join(DIR, '_pages.json'), 'utf8'))
const routes = new Set(pages.map((p) => p.route))

const add = (map, key, route) => {
  if (!map.has(key)) map.set(key, new Set())
  map.get(key).add(route)
}

const links = new Map()
const assets = new Map()
const external = new Set()
const scripts = new Map()

for (const p of pages) {
  const rec = JSON.parse(fs.readFileSync(path.join(DIR, `${p.slug}.json`), 'utf8'))
  const html = rec.html

  for (const s of rec.scripts ?? []) add(scripts, s, p.route)

  const consider = (url) => {
    if (!url) return
    if (/^(https?:)/.test(url)) return external.add(url)
    if (/^(tel:|mailto:|#|data:|javascript:)/.test(url)) return
    const clean = url.split(/[?#]/)[0]
    if (/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff2?|ttf|eot|pdf|mp4)$/i.test(clean)) {
      add(assets, clean, p.route)
    } else {
      add(links, clean, p.route)
    }
  }

  for (const m of html.matchAll(/(?:href|src|data-src|data-large_image)="([^"]+)"/g)) consider(m[1])
  for (const m of html.matchAll(/srcset="([^"]+)"/g))
    for (const part of m[1].split(',')) consider(part.trim().split(/\s+/)[0])
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) consider(m[1])
}

let failures = 0

const deadLinks = [...links.keys()].filter(
  (u) => !routes.has(u) && !REDIRECTED.some((re) => re.test(u)),
)
console.log(`routes ${routes.size}   internal links ${links.size}   assets ${assets.size}   external ${external.size}\n`)

console.log(`dead internal links: ${deadLinks.length}`)
for (const u of deadLinks) {
  failures++
  console.log(`   ${u}   <- ${[...links.get(u)].join(', ')}`)
}

const missing = [...assets.keys()].filter((u) => {
  if (!u.startsWith('/')) return true
  return !fs.existsSync(path.join(PUBLIC, u.replace(/^\//, '')))
})
console.log(`\nmissing assets: ${missing.length}`)
for (const u of missing) {
  failures++
  console.log(`   ${u}   <- ${[...assets.get(u)].slice(0, 4).join(', ')}`)
}

// Informational only. The site no longer loads WordPress's front-end scripts —
// the carousels and scroll-in sections are driven by wildkumaun/src/lib/carousel.js and
// components/Enhancements.jsx instead — so a script the origin declared but we
// never fetched is not a fault. The list is kept because the Essential Addons
// widgets (testimonials, accordion, content sliders) still need an answer.
const absentScripts = [...scripts.keys()].filter(
  (s) => !fs.existsSync(path.join(PUBLIC, s.replace(/^\//, ''))),
)
console.log(
  `\nWordPress scripts declared by the origin but not used here: ${absentScripts.length} of ${scripts.size} (informational)`,
)

console.log(`\n${failures === 0 ? 'OK — every link and asset resolves' : `${failures} problem(s)`}`)
process.exit(failures === 0 ? 0 : 1)
