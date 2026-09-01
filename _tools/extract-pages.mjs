// Build content/pages.json: per-page section layout (headings, copy, images, buttons)
// derived from the mirrored Elementor markup, in DOM order.
import { readFile, writeFile, readdir } from 'node:fs/promises'

const DIR = '_reference/wildkumaon.com'

const SLUG_TITLES = {
  index: 'HOME', 'about-us': 'ABOUT US', team: 'BIRDING GUIDES', restaurant: 'RESTAURANT',
  'work-from-hills': 'WORK FROM HILLS', experiences: 'EXPERIENCES',
  'sattal-5n-6d-birding-tour': 'BIRDING TOURS', conservation: 'CONSERVATION',
  gallery: 'GALLERY', 'bird-art': 'BIRD ART', 'contact-us': 'CONTACT US',
  'guest-book': 'TESTMONIALS', blog: 'BLOG', faqs: 'FAQs',
}

const ent = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
const strip = (s) => ent(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const img = (u) => u.replace(/^media\//, 'assets/images/')

/** Chrome shared by every page — captured once in site-settings, skipped per page. */
const CHROME = [
  'Skip to content', 'Menu',
  'Forested Premises, Great location and Experienced team of Naturalist welcomes you to Sattal. Enjoy the hospitality of Wild Kumaon with well researched and excellently designed Birding and Nature tours.',
  'Mob. - 9520017658 , 8433240272, 8937870470',
  'Email. wildkumaon@gmail.com',
  'Address: WildKumaon, Sattal',
]

const files = (await readdir(DIR)).filter((f) => f.endsWith('.html')).sort()
const pages = []

for (const file of files) {
  const slug = file.replace(/\.html$/, '')
  let html = await readFile(`${DIR}/${file}`, 'utf8')

  const title = strip(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '')
  const description = ent(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '')

  html = html.slice(html.indexOf('<body'))
  html = html.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, '')

  // Walk top-level Elementor sections in order.
  const sections = []
  const secRe = /<section class="(elementor-section [^"]*elementor-top-section elementor-element elementor-element-([0-9a-f]+)[^"]*)"/g
  const marks = [...html.matchAll(secRe)]
  for (let i = 0; i < marks.length; i++) {
    const seg = html.slice(marks[i].index, i + 1 < marks.length ? marks[i + 1].index : html.length)
    const classes = marks[i][1]
    // Skip the header/nav and the shared footer strip — both live in site-settings.json.
    if (/hfe-nav-menu|hfe-site-logo/.test(seg)) continue

    const headings = []
    for (const m of seg.matchAll(/<(h[1-6])[^>]*class="elementor-heading-title[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi)) {
      const text = strip(m[2])
      if (text && !CHROME.includes(text)) headings.push({ level: +m[1][1], text })
    }
    const paragraphs = []
    for (const m of seg.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
      const text = strip(m[1])
      if (text.length > 20 && !CHROME.includes(text) && !paragraphs.includes(text)) paragraphs.push(text)
    }
    const listItems = []
    for (const m of seg.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
      const text = strip(m[1])
      if (text && text.length < 400 && !listItems.includes(text)) listItems.push(text)
    }
    const images = [...new Set([...seg.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]))]
      .filter((u) => /\.(jpe?g|png|webp|gif)$/i.test(u) && !/^https?:/.test(u)).map(img)
    const buttons = [...seg.matchAll(/<a[^>]*class="[^"]*elementor-button[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map((m) => ({ label: strip(m[2]), href: m[1] })).filter((b) => b.label)
    const bgImage = seg.match(/background-image\s*:\s*url\(\s*["']?([^"')]+)/i)?.[1]

    if (!headings.length && !paragraphs.length && !images.length && !listItems.length && !buttons.length) continue

    const kind = /elementor-section-full_width/.test(classes) ? 'full-width'
      : /elementor-section-boxed/.test(classes) ? 'boxed' : 'section'

    sections.push({
      id: marks[i][2],
      layout: kind,
      ...(bgImage && !/^https?:/.test(bgImage) ? { backgroundImage: img(bgImage) } : {}),
      ...(headings.length ? { headings } : {}),
      ...(paragraphs.length ? { paragraphs } : {}),
      ...(listItems.length ? { listItems } : {}),
      ...(images.length ? { images } : {}),
      ...(buttons.length ? { buttons } : {}),
    })
  }

  pages.push({
    slug: slug === 'index' ? '/' : `/${slug}`,
    file,
    navLabel: SLUG_TITLES[slug] || null,
    title,
    description,
    sectionCount: sections.length,
    sections,
  })
  console.log(`${file.padEnd(38)} ${String(sections.length).padStart(2)} sections`)
}

await writeFile('content/pages.json', JSON.stringify({
  count: pages.length,
  source: 'mirrored Elementor markup in _reference/wildkumaon.com/',
  note: 'Header nav and the shared footer strip are omitted here — they live in site-settings.json. Image paths are rewritten to assets/images/.',
  pages,
}, null, 2) + '\n')
console.log(`\npages.json — ${pages.length} pages`)
