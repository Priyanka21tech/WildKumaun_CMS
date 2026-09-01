/**
 * Turn the byte-faithful mirror in _reference/wildkumaon.com into page records
 * the Next app renders verbatim.
 *
 * The live site is server-rendered WordPress/Astra/Elementor markup. Its styling
 * is all in wp/site.css plus <style> blocks inside <body>; its behaviour comes
 * from a list of WordPress scripts (jQuery, Astra, Elementor, Essential Addons,
 * WPForms) that the thin Next shell in front of it loads on the client. The
 * shell passes that list to a component as props, so it appears in the RSC
 * flight payload rather than as <script> tags — which is why it has to be parsed
 * out here rather than scraped from the markup.
 *
 * This script extracts, cleans and re-points; it changes nothing about how the
 * site looks or behaves.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const MIRROR = path.join(ROOT, '_reference/wildkumaon.com')
const OUT = path.join(ROOT, 'wildkumaun/content/mirror')

/** Elementor's lazy asset loader builds URLs off this; point it at our copy. */
const ORIGIN_ELEMENTOR_ASSETS = 'https://wildkumaon.com/wp-content/plugins/elementor/assets/'
const LOCAL_ELEMENTOR_ASSETS = '/wp/wildkumaon.com/wp-content/plugins/elementor/assets/'

/** <slug>.html -> route. index is the home page. */
const routeFor = (file) => (file === 'index.html' ? '/' : '/' + file.replace(/\.html$/, ''))

/** Pull one attribute out of the first tag matching `re`. */
const attr = (head, re, group = 1) => (head.match(re)?.[group] ?? null)

function extractHead(head) {
  const meta = (name) =>
    attr(head, new RegExp(`<meta name="${name}" content="([^"]*)"`)) ??
    attr(head, new RegExp(`<meta property="${name}" content="([^"]*)"`))
  return {
    title: attr(head, /<title>([^<]*)<\/title>/),
    description: meta('description'),
    robots: meta('robots'),
    og: {
      title: meta('og:title'),
      description: meta('og:description'),
      url: meta('og:url'),
      image: meta('og:image'),
    },
    twitter: {
      card: meta('twitter:card'),
      title: meta('twitter:title'),
      description: meta('twitter:description'),
      image: meta('twitter:image'),
    },
  }
}

/**
 * Rebuild the RSC flight payload from the self.__next_f.push() calls, then read
 * back its text chunks (`<id>:T<hexlen>,<text>`). The inline WordPress configs —
 * elementorFrontendConfig, wpforms_settings, the eael and astra settings — are
 * stored as those chunks and referenced from props as "$<id>".
 */
function readFlightPayload(html) {
  let payload = ''
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) {
    payload += JSON.parse(m[1])
  }
  const chunks = new Map()
  const re = /(^|\n)([0-9a-f]+):T([0-9a-f]+),/g
  let m
  while ((m = re.exec(payload))) {
    const start = m.index + m[0].length
    chunks.set(m[2], payload.slice(start, start + parseInt(m[3], 16)))
  }
  return { payload, chunks }
}

/**
 * The shell renders a client component with {scripts, inlineScripts}. Pull both
 * out, resolving the "$<id>" references to their chunk text.
 */
function extractScripts(html) {
  const { payload, chunks } = readFlightPayload(html)
  const hit = payload.match(/\n[0-9a-f]+:(\["\$","\$L[0-9a-f]+",null,\{"scripts":)/)
  if (!hit) return { scripts: [], inlineScripts: [] }

  const start = payload.indexOf(hit[1], hit.index)
  const end = payload.indexOf('\n', start)
  const props = JSON.parse(payload.slice(start, end === -1 ? undefined : end))[3]

  const resolve = (v) => {
    const ref = typeof v === 'string' && v.match(/^\$([0-9a-f]+)$/)
    return ref && chunks.has(ref[1]) ? chunks.get(ref[1]) : v
  }

  return {
    scripts: props.scripts ?? [],
    inlineScripts: (props.inlineScripts ?? [])
      .map(resolve)
      .filter((s) => typeof s === 'string' && s.trim())
      // Elementor resolves lib/swiper, lib/dialog and lib/share-link against
      // this at runtime. Left absolute it would pull them from the live origin.
      .map((s) => s.split(ORIGIN_ELEMENTOR_ASSETS).join(LOCAL_ELEMENTOR_ASSETS)),
  }
}

/**
 * Re-point every relative URL the mirror uses at the routes and public paths
 * this app serves. The mirror is flat, so the forms are few and unambiguous:
 *   media/x.jpg   -> /media/x.jpg      (public/media)
 *   about-us.html -> /about-us         (app route)
 *   index.html    -> /
 * wp/site.css is left alone — the layout links it, and its own url() paths
 * (fonts/, ../media/, wildkumaon.com/wp-content/) already resolve once the wp
 * directory is served at /wp.
 */
function rewriteUrls(html) {
  return html.replace(/(href|src|content|data-src|data-large_image)="([^"]*)"/g, (m, a, url) => {
    if (/^(https?:|tel:|mailto:|#|data:|\/)/.test(url)) return m
    let out = url
    if (out.startsWith('media/')) out = '/' + out
    else if (out === 'favicon.ico') out = '/favicon.ico'
    else if (out === 'index.html') out = '/'
    else if (/^[a-z0-9-]+\.html(?=$|[?#])/i.test(out)) out = '/' + out.replace('.html', '')
    else if (out.startsWith('wp/')) out = '/' + out
    // WordPress taxonomy archives. They are linked from every blog post but were
    // never mirrored — the origin answers them with a Vercel checkpoint, not a
    // page — so keep the origin's URL and let next.config redirect it to /blog.
    else if (/^(category|author)\//.test(out)) out = '/' + out.replace(/\/?$/, '')
    else return m
    return `${a}="${out}"`
  })
}

/**
 * Elementor sets section and column backgrounds through url() inside the inline
 * <style> blocks it emits (and the odd style attribute), not through src. Those
 * are relative to the site root on the origin, so they need the same /media
 * prefix the attributes get — without this the hero below the header and every
 * other background image resolves against the current route and 404s.
 */
function rewriteCssUrls(html) {
  return html.replace(/url\(([^)]*)\)/g, (m, inner) => {
    const raw = inner.trim()
    const q = raw[0] === '"' || raw[0] === "'" ? raw[0] : ''
    const url = q ? raw.slice(1, -1) : raw
    if (!url.startsWith('media/') && !url.startsWith('wp/')) return m
    return 'url(' + q + '/' + url + q + ')'
  })
}

/** srcset carries several URLs per attribute, so it needs its own pass. */
function rewriteSrcset(html) {
  return html.replace(/srcset="([^"]*)"/g, (m, val) =>
    `srcset="${val.replace(/(^|,\s*)media\//g, '$1/media/')}"`,
  )
}

function stripScripts(body) {
  // React will not execute scripts injected as HTML, and the shell's own scripts
  // are its dead Next runtime. The two that carry meaning — the body className
  // and the WordPress script list — are captured separately and re-applied by
  // the app.
  return body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<div hidden="">\s*<!--\$-->\s*<!--\/\$-->\s*<\/div>/g, '')
    .replace(/<!--\$-->|<!--\/\$-->/g, '')
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const files = fs.readdirSync(MIRROR).filter((f) => f.endsWith('.html')).sort()
const index = []
const allScripts = new Set()

for (const file of files) {
  const raw = fs.readFileSync(path.join(MIRROR, file), 'utf8')
  const bodyStart = raw.search(/<body[^>]*>/)
  const head = raw.slice(0, bodyStart)
  const bodyTag = raw.slice(bodyStart).match(/^<body[^>]*>/)[0]
  let body = raw.slice(bodyStart + bodyTag.length).replace(/<\/body>\s*<\/html>\s*$/i, '')

  // The className the origin swaps in on load — Astra keys layout off it
  // (ast-page-builder-template vs ast-plain-container vs ast-separate-container),
  // so it has to be on <body> for the page to lay out the way the original does.
  const bodyClass =
    attr(raw, /document\.body\.className="([^"]*)"/) ??
    attr(bodyTag, /class="([^"]*)"/)

  const ldJson = [...raw.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])

  const { scripts, inlineScripts } = extractScripts(raw)
  scripts.forEach((s) => allScripts.add(s))

  body = rewriteCssUrls(rewriteSrcset(rewriteUrls(stripScripts(body)))).trim()

  const route = routeFor(file)
  const slug = route === '/' ? 'index' : route.slice(1)
  const record = {
    route,
    slug,
    source: file,
    bodyClass,
    ldJson,
    scripts,
    inlineScripts,
    ...extractHead(head),
    html: body,
  }

  fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(record))
  index.push({ route, slug, title: record.title, bytes: body.length, scripts: scripts.length })
}

fs.writeFileSync(path.join(OUT, '_pages.json'), JSON.stringify(index, null, 2))

// Consumed by _tools/fetch-scripts.mjs.
fs.writeFileSync(
  path.join(OUT, '_scripts.json'),
  JSON.stringify([...allScripts].sort(), null, 2),
)

console.log(`wrote ${index.length} page records to wildkumaun/content/mirror`)
console.log(`${allScripts.size} distinct WordPress scripts referenced across the site`)
for (const p of index) {
  console.log(`  ${p.route.padEnd(38)} ${String(p.bytes).padStart(7)}  ${String(p.scripts).padStart(2)} scripts  ${p.title}`)
}
