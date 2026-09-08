/**
 * Build a filename -> alt text map for every image the site uses.
 *
 * The alt text is already written on the live site's <img> tags, so it is better
 * metadata than anything derived from a filename. Where a page also opens the
 * image in a lightbox, Elementor carries a title on the link, which we fall back
 * to when the alt attribute is empty.
 *
 * Output: content/image-alts.json — consumed by the Payload media import.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
// The app moved from site/ to wildkumaun/; this is where the mirror lives now.
const DIR = path.join(ROOT, 'wildkumaun/content/mirror')
const OUT = path.join(ROOT, 'content/image-alts.json')

const pages = JSON.parse(fs.readFileSync(path.join(DIR, '_pages.json'), 'utf8'))

/** filename -> Map(alt -> times seen), so the most common wins. */
const candidates = new Map()

const record = (file, text) => {
  if (!file || !text) return
  const alt = text.trim()
  if (!alt) return
  if (!candidates.has(file)) candidates.set(file, new Map())
  const counts = candidates.get(file)
  counts.set(alt, (counts.get(alt) ?? 0) + 1)
}

const basename = (url) => decodeURIComponent(url.split('/').pop().split(/[?#]/)[0])

for (const p of pages) {
  const { html } = JSON.parse(fs.readFileSync(path.join(DIR, `${p.slug}.json`), 'utf8'))

  // <img alt="..." src="/media/x.jpg"> — attribute order varies, so match the tag
  // and read both attributes out of it.
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0]
    const src = tag.match(/\ssrc="([^"]*)"/)?.[1]
    const alt = tag.match(/\salt="([^"]*)"/)?.[1]
    if (src?.startsWith('/media/')) record(basename(src), alt)
  }

  // Lightbox links carry a title for the full-size image behind a thumbnail.
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const tag = m[0]
    const href = tag.match(/\shref="([^"]*)"/)?.[1]
    const title = tag.match(/data-elementor-lightbox-title="([^"]*)"/)?.[1]
    if (href?.startsWith('/media/')) record(basename(href), title)
  }
}

const alts = {}
for (const [file, counts] of [...candidates].sort()) {
  alts[file] = [...counts].sort((a, b) => b[1] - a[1])[0][0]
}

fs.writeFileSync(OUT, JSON.stringify(alts, null, 2))

const images = fs.readdirSync(path.join(ROOT, 'assets/images'))
const withAlt = images.filter((f) => alts[f]).length
console.log(`wrote ${Object.keys(alts).length} alt entries to content/image-alts.json`)
console.log(`${withAlt} of ${images.length} files in assets/images have alt text`)
