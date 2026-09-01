// Second pass over content/pages.json: pages whose content lives in the Astra
// WordPress content area (<main> … .entry-content) rather than in Elementor
// top-level sections get a "content" block list added.
import { readFile, writeFile } from 'node:fs/promises'

const DIR = '_reference/wildkumaon.com'

const ent = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
const strip = (s) => ent(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const img = (u) => u.replace(/^media\//, 'assets/images/')

const doc = JSON.parse(await readFile('content/pages.json', 'utf8'))

for (const page of doc.pages) {
  let html = await readFile(`${DIR}/${page.file}`, 'utf8')
  html = html.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, '')

  const start = html.indexOf('<main')
  if (start < 0) continue
  const foot = html.indexOf('<footer', start)
  const seg = html.slice(start, foot > start ? foot : html.length)

  const blocks = []
  const seen = new Set()
  for (const m of seg.matchAll(/<(h[1-6]|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = strip(m[2])
    if (text.length < 3 || seen.has(text)) continue
    seen.add(text)
    const tag = m[1].toLowerCase()
    blocks.push({
      type: tag === 'p' ? 'paragraph' : tag === 'li' ? 'listItem' : tag === 'blockquote' ? 'quote' : `heading${tag[1]}`,
      text,
    })
  }
  const images = [...new Set([...seg.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]))]
    .filter((u) => /\.(jpe?g|png|webp|gif)$/i.test(u) && !/^https?:/.test(u)).map(img)
  const lightbox = [...new Set([...seg.matchAll(/data-elementor-lightbox-title="([^"]+)"/g)].map((m) => ent(m[1])))]

  if (blocks.length || images.length) {
    page.content = {
      note: 'Extracted from the WordPress <main> content area — this is where Astra-templated pages hold their copy.',
      blockCount: blocks.length,
      blocks,
      ...(images.length ? { images } : {}),
      ...(lightbox.length ? { imageTitles: lightbox } : {}),
    }
  }
  console.log(`${page.file.padEnd(38)} sections=${String(page.sectionCount).padStart(2)}  contentBlocks=${blocks.length}  images=${images.length}`)
}

await writeFile('content/pages.json', JSON.stringify(doc, null, 2) + '\n')
console.log('\npages.json updated with content fallback')
