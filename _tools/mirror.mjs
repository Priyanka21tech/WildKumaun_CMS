// Mirror wildkumaon.com for offline reference.
// No deps: Node 18+ fetch + regex rewriting. Pages are flat at the site root,
// so every page becomes <slug>.html next to a preserved wp-content/ tree.

import { mkdir, writeFile, readFile, access } from 'node:fs/promises'
import { dirname, posix } from 'node:path'

const ORIGIN = 'https://www.wildkumaon.com'
const OUT = 'D:/Wildkumaun/_reference/wildkumaon.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
const HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.wildkumaon.com/',
  'Upgrade-Insecure-Requests': '1',
}

const PAGES = [
  '/', '/about-us', '/bird-art', '/bird-watching-in-sattal', '/birders-paradise',
  '/birds-found-at-wild-kumaon', '/birds-of-sattal-and-around', '/blog', '/conservation',
  '/contact-us', '/eco-friendly-enterprises-in-sattal', '/enquiry', '/experiences',
  '/facilities', '/faqs', '/gallery', '/guest-book', '/location', '/property-photographs',
  '/restaurant', '/sattal-5n-6d-birding-tour', '/sattal', '/spring-trip-report',
  '/team', '/vision', '/work-from-hills',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const assets = new Set()   // absolute wildkumaon.com asset URLs to fetch
const done = new Set()
const failed = []

/** Local file path (relative to OUT) for a page URL. */
function pageFile(pathname) {
  const slug = pathname.replace(/^\/|\/$/g, '')
  return slug === '' ? 'index.html' : `${slug}.html`
}

/** Local file path (relative to OUT) for an asset URL. */
function assetFile(u) {
  return decodeURIComponent(u.pathname.replace(/^\//, '')) || 'index'
}

function isPage(u) {
  const p = u.pathname.replace(/\/$/, '')
  return PAGES.includes(p === '' ? '/' : p)
}

/** Resolve a possibly-relative URL against a base; null if not on wildkumaon.com. */
function local(raw, base) {
  if (!raw) return null
  const s = raw.trim()
  if (!s || s.startsWith('data:') || s.startsWith('#') || s.startsWith('mailto:') || s.startsWith('tel:') || s.startsWith('javascript:')) return null
  let u
  try { u = new URL(s, base) } catch { return null }
  if (u.hostname !== 'wildkumaon.com' && u.hostname !== 'www.wildkumaon.com') return null
  u.hash = ''
  return u
}

async function save(rel, data) {
  const full = posix.join(OUT, rel)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, data)
}

async function exists(rel) {
  try { await access(posix.join(OUT, rel)); return true } catch { return false }
}

async function get(url, binary = false) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return binary ? Buffer.from(await res.arrayBuffer()) : await res.text()
    } catch (e) {
      if (attempt === 5) throw e
      await sleep(800 * attempt * attempt)
    }
  }
}

/**
 * Rewrite every wildkumaon.com URL inside an HTML page to its local path,
 * queueing assets for download along the way. External URLs (Google Fonts,
 * maps, social) are left absolute so they still resolve online.
 */
function rewriteHtml(html, pageUrl) {
  const rewriteOne = (raw) => {
    const u = local(raw, pageUrl)
    if (!u) return null
    if (isPage(u)) return pageFile(u.pathname) + u.search
    const rel = assetFile(u)
    assets.add(u.origin + u.pathname)
    return rel
  }

  // src / href / poster / content attributes
  html = html.replace(/\b(src|href|poster|data-src|data-lazy-src)\s*=\s*(["'])(.*?)\2/gi,
    (m, attr, q, val) => {
      const out = rewriteOne(val)
      return out === null ? m : `${attr}=${q}${out}${q}`
    })

  // srcset / data-srcset: comma-separated "url descriptor" pairs
  html = html.replace(/\b(srcset|data-srcset|imagesrcset)\s*=\s*(["'])(.*?)\2/gis,
    (m, attr, q, val) => {
      const parts = val.split(',').map((part) => {
        const seg = part.trim()
        if (!seg) return null
        const sp = seg.split(/\s+/)
        const out = rewriteOne(sp[0])
        return out === null ? seg : [out, ...sp.slice(1)].join(' ')
      }).filter(Boolean)
      return `${attr}=${q}${parts.join(', ')}${q}`
    })

  // url(...) inside inline styles / <style> blocks
  html = html.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (m, q, val) => {
    const out = rewriteOne(val)
    return out === null ? m : `url(${q}${out}${q})`
  })

  return html
}

/** Rewrite url(...) and @import inside a stylesheet, relative to the CSS file's own location. */
function rewriteCss(css, cssUrl) {
  const cssDir = posix.dirname(assetFile(cssUrl))
  const fix = (raw) => {
    const u = local(raw, cssUrl)
    if (!u) return null
    assets.add(u.origin + u.pathname)
    return posix.relative(cssDir, assetFile(u)) || './'
  }
  css = css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (m, q, val) => {
    const out = fix(val)
    return out === null ? m : `url(${q}${out}${q})`
  })
  css = css.replace(/@import\s+(["'])(.*?)\1/gi, (m, q, val) => {
    const out = fix(val)
    return out === null ? m : `@import ${q}${out}${q}`
  })
  return css
}

// ---- pass 1: pages -------------------------------------------------------
console.log(`Mirroring ${PAGES.length} pages...`)
for (const p of PAGES) {
  const url = ORIGIN + p
  try {
    const html = await get(url)
    await save(pageFile(p), rewriteHtml(html, url))
    console.log(`  page  ${pageFile(p)}  (${(html.length / 1024).toFixed(0)}kb)`)
  } catch (e) {
    failed.push([url, e.message])
    console.log(`  FAIL  ${url} — ${e.message}`)
  }
  await sleep(250)
}

// ---- pass 2: assets (CSS discovers more assets, so loop until settled) ----
console.log(`\nDownloading assets...`)
let round = 0
while (round < 6) {
  const pending = [...assets].filter((a) => !done.has(a))
  if (!pending.length) break
  round++
  console.log(`  round ${round}: ${pending.length} assets`)

  const queue = [...pending]
  const worker = async () => {
    while (queue.length) {
      const a = queue.shift()
      done.add(a)
      const u = new URL(a)
      const rel = assetFile(u)
      const isCss = /\.css$/i.test(u.pathname)
      if (!isCss && await exists(rel)) continue
      try {
        if (isCss) {
          const css = await get(a)
          await save(rel, rewriteCss(css, u))
        } else {
          await save(rel, await get(a, true))
        }
      } catch (e) {
        failed.push([a, e.message])
      }
      await sleep(60)
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()])
}

const report = {
  pages: PAGES.length - failed.filter(([u]) => isPage(new URL(u))).length,
  assets: done.size,
  failed: failed.map(([u, m]) => `${u} — ${m}`),
}
await writeFile('D:/Wildkumaun/_tools/mirror-report.json', JSON.stringify(report, null, 2))
console.log(`\nDone. ${PAGES.length} pages, ${done.size} assets, ${failed.length} failures.`)
if (failed.length) console.log(failed.slice(0, 20).map(([u, m]) => `  ${u} — ${m}`).join('\n'))
