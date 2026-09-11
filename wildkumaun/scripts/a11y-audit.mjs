/**
 * Everything on the site that is present but does not work, or works but cannot
 * be seen.
 *
 * Reads the rendered pages rather than the mirror, because what a reader meets is
 * the finished page — the mirror, the CMS blocks and the header all contribute to
 * it, and a fault can come from any of the three.
 *
 * Static analysis, so it finds what is in the markup. It cannot measure layout:
 * an element pushed off-screen by a stylesheet will not show up here, and neither
 * will a colour contrast failure. Those need a browser.
 *
 * Needs the dev server running.
 *   npm run dev
 *   node scripts/a11y-audit.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:3000'
const PUBLIC = path.resolve('public')

const pages = JSON.parse(fs.readFileSync(path.resolve('content/mirror/_pages.json'), 'utf8'))
const routes = pages.map((p) => p.route ?? `/${p.slug}`)

/** findings[] = { route, kind, detail, sample } */
const findings = []
const add = (route, kind, detail, sample) => findings.push({ route, kind, detail, sample })

/**
 * The document, without Next's serialised payload.
 *
 * The RSC flight data repeats the whole page as escaped text at the end. Left in,
 * every finding is reported twice and the second copy points at nothing.
 */
const domOnly = (html) => {
  const i = html.indexOf('self.__next_f')
  return i > -1 ? html.slice(0, i) : html
}

/** What a screen reader would call this element, as far as the markup says. */
const accessibleName = (attrs, inner) => {
  const label = (attrs.match(/aria-label="([^"]*)"/) || [])[1]
  if (label?.trim()) return label.trim()
  const text = inner
    .replace(/<[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/[^>]+>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text) return text
  const alt = (inner.match(/<img[^>]*alt="([^"]*)"/) || [])[1]
  if (alt?.trim()) return alt.trim()
  const title = (attrs.match(/title="([^"]*)"/) || [])[1]
  return title?.trim() ?? ''
}

const localFileExists = (src) => {
  if (!src.startsWith('/')) return true // external, not ours to check
  if (src.startsWith('/api/')) return true // served by Payload, not from disk
  const file = path.join(PUBLIC, decodeURIComponent(src.split('?')[0]))
  return fs.existsSync(file)
}

for (const route of routes) {
  let html
  try {
    const res = await fetch(BASE + route)
    if (!res.ok) {
      add(route, 'Page does not load', `HTTP ${res.status}`, route)
      continue
    }
    html = domOnly(await res.text())
  } catch (error) {
    add(route, 'Page does not load', error.message, route)
    continue
  }

  // --- links -------------------------------------------------------------
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = m[1]
    const inner = m[2]
    const href = (attrs.match(/href="([^"]*)"/) || [])[1]
    const name = accessibleName(attrs, inner)

    if (href === undefined) {
      add(route, 'Link with no destination', 'An <a> with no href — reads as a link, goes nowhere', name || '(unnamed)')
      continue
    }
    if (href === '#' || href === '' || href === '/#') {
      add(route, 'Link goes nowhere', `href="${href}" — activating it jumps to the top of the same page`, name || '(unnamed)')
    }
    if (!name) {
      add(route, 'Link with no name', 'Focusable, announced as "link", with nothing to say what it is', href)
    }
    if (/^https?:\/\//i.test(name)) {
      add(route, 'Link text is a raw URL', 'A screen reader reads the address letter by letter', name.slice(0, 60))
    }
    if (href.startsWith('/') && !href.startsWith('//')) {
      const known = routes.includes(href.split(/[?#]/)[0])
      const isMedia = href.startsWith('/media/') || href.startsWith('/api/')
      const isRedirected = /^\/(category|author|vision|location|enquiry|birders-paradise)\b/.test(href)
      if (!known && !isMedia && !isRedirected && href !== '/') {
        add(route, 'Link to a page that does not exist', `${href} is not one of the site's routes`, name)
      }
    }
  }

  // --- images ------------------------------------------------------------
  for (const m of html.matchAll(/<img\b([^>]*)>/g)) {
    const attrs = m[1]
    const src = (attrs.match(/src="([^"]*)"/) || [])[1] ?? ''
    const alt = (attrs.match(/alt="([^"]*)"/) || [])[1]

    if (alt === undefined) {
      add(route, 'Image with no alt attribute', 'A screen reader reads the filename instead', src.split('/').pop())
    }
    if (src && !localFileExists(src)) {
      add(route, 'Image file missing', 'The file is referenced but is not on disk — renders as an empty box', src)
    }
  }

  // --- frames, inputs, buttons -------------------------------------------
  for (const m of html.matchAll(/<iframe\b([^>]*)>/g)) {
    if (!/title="[^"]+"/.test(m[1])) {
      add(route, 'Frame with no title', 'Announced as "frame" and nothing else', (m[1].match(/src="([^"]*)"/) || [])[1] ?? '')
    }
  }

  for (const m of html.matchAll(/<input\b([^>]*)>/g)) {
    const attrs = m[1]
    const type = (attrs.match(/type="([^"]*)"/) || [])[1] ?? 'text'
    if (['hidden', 'submit', 'button', 'image'].includes(type)) continue

    const id = (attrs.match(/id="([^"]*)"/) || [])[1]
    const hasLabel = id && new RegExp(`<label[^>]*for="${id}"`).test(html)
    const hasAria = /aria-label="[^"]+"|aria-labelledby="[^"]+"/.test(attrs)
    if (!hasLabel && !hasAria) {
      add(route, 'Form field with no label', 'Announced as an edit box with no indication of what to type', id || type)
    }
  }

  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    if (!accessibleName(m[1], m[2])) {
      add(route, 'Button with no name', 'Announced as "button" with nothing to say what it does', (m[1].match(/class="([^"]*)"/) || [])[1] ?? '')
    }
  }

  // --- things that take focus but show nothing ---------------------------
  for (const m of html.matchAll(/<[a-z]+\b[^>]*style="[^"]*"[^>]*>/gi)) {
    const style = (m[0].match(/style="([^"]*)"/) || [])[1] ?? ''
    const focusable = /<(a|button|input|select|textarea|iframe)\b/i.test(m[0]) || /tabindex="0"/.test(m[0])
    if (!focusable) continue
    if (/width:\s*0|height:\s*0|opacity:\s*0(?!\.)|left:\s*-\d{4}/.test(style)) {
      add(route, 'Focusable but invisible', `Inline style hides it: ${style.slice(0, 50)}`, m[0].slice(0, 60))
    }
  }

  // --- what a screen reader navigates by ---------------------------------

  /**
   * Headings, which are how a screen reader user skims a page.
   *
   * Pressing H walks this list. One h1 says which page you are on; a level that
   * jumps from h2 to h4 says a section is missing that never existed.
   */
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({
    level: Number(m[1]),
    text: m[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
  }))

  const h1s = headings.filter((h) => h.level === 1)
  if (h1s.length === 0) {
    add(route, 'No h1', 'Nothing tells a screen reader which page this is', '')
  } else if (h1s.length > 1) {
    add(route, 'More than one h1', `${h1s.length} of them — the page claims to be several pages`, h1s.map((h) => h.text.slice(0, 25)).join(' / '))
  }

  for (let i = 1; i < headings.length; i++) {
    const jump = headings[i].level - headings[i - 1].level
    if (jump > 1) {
      add(route, 'Heading level skipped', `h${headings[i - 1].level} straight to h${headings[i].level} — a level that never existed`, headings[i].text.slice(0, 40))
    }
  }

  for (const h of headings) {
    if (!h.text) add(route, 'Empty heading', 'A heading with no words in it — H navigation stops here for nothing', '')
  }

  /**
   * Alt text that is really a filename.
   *
   * axe cannot catch this: the attribute is present and non-empty, so every
   * automated rule passes. Read aloud it is a run of syllables.
   */
  for (const m of html.matchAll(/<img\b([^>]*)>/g)) {
    const alt = (m[1].match(/alt="([^"]*)"/) || [])[1]
    if (!alt || !alt.trim()) continue
    const t = alt.trim()
    const derived =
      /\b\d{2,4}\s*[x×]\s*\d{2,4}\b/i.test(t) ||
      /\.(jpe?g|png|gif|webp|svg)$/i.test(t) ||
      (/[-_]/.test(t) && !t.includes(' ')) ||
      /^(img|dsc|image|photo|pic|banner)\s*[-_]?\d*$/i.test(t)
    if (derived) add(route, 'Alt text is a filename', 'Read out letter by letter; describes nothing', t.slice(0, 40))
  }

  /** Landmarks a screen reader offers as jump points. */
  if (!/<main\b/.test(html)) add(route, 'No main landmark', 'No way to jump past the header to the content', '')
  const navs = [...html.matchAll(/<nav\b([^>]*)>/g)]
  const unnamedNavs = navs.filter((m) => !/aria-label(?:ledby)?="[^"]+"/.test(m[1]))
  if (navs.length > 1 && unnamedNavs.length) {
    add(route, 'Unnamed navigation landmark', `${unnamedNavs.length} of ${navs.length} <nav> have no name — the landmark list reads "navigation, navigation"`, '')
  }

  if (!/<html[^>]*\blang="[^"]+"/.test(html)) {
    add(route, 'No page language', 'A screen reader guesses the pronunciation', '')
  }

  if (!/class="[^"]*skip-link/.test(html)) {
    add(route, 'No skip link', 'Every visit starts by tabbing through the whole menu', '')
  }

  // --- duplicate ids, which break label and aria references ---------------
  /**
   * A space before `id`, not a word boundary.
   *
   * `\bid=` also matches `data-id=` and `data-elementor-id=`, which Elementor
   * puts on every section and widget — so the first run of this reported sixteen
   * duplicate ids that were not ids at all. Elementor's own attributes are
   * allowed to repeat; the HTML `id` is the one that must not.
   */
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
  for (const id of dupes.slice(0, 5)) {
    add(route, 'Duplicate id', `id="${id}" appears more than once — labels and aria references point at the wrong one`, id)
  }

  // --- positive tabindex, which reorders the page for keyboard users ------
  for (const m of html.matchAll(/tabindex="([1-9]\d*)"/g)) {
    add(route, 'Positive tabindex', `tabindex="${m[1]}" pulls this ahead of everything else in the tab order`, m[0])
  }
}

// ---------------------------------------------------------------------------

const byKind = new Map()
for (const f of findings) {
  if (!byKind.has(f.kind)) byKind.set(f.kind, [])
  byKind.get(f.kind).push(f)
}

console.log(`Scanned ${routes.length} pages. ${findings.length} finding(s).\n`)

const sorted = [...byKind].sort((a, b) => b[1].length - a[1].length)
for (const [kind, list] of sorted) {
  const where = [...new Set(list.map((f) => f.route))]
  console.log(`${kind}  —  ${list.length} on ${where.length} page(s)`)
  console.log(`   what : ${list[0].detail}`)
  console.log(`   where: ${where.slice(0, 6).join(', ')}${where.length > 6 ? ` +${where.length - 6} more` : ''}`)
  const samples = [...new Set(list.map((f) => f.sample).filter(Boolean))].slice(0, 4)
  if (samples.length) console.log(`   e.g. : ${samples.join('  |  ')}`)
  console.log()
}
