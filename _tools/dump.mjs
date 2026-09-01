// Dump readable text blocks from a mirrored Elementor page, in DOM order.
// Usage: node _tools/dump.mjs <page.html> [--imgs]
import { readFile } from 'node:fs/promises'

const file = process.argv[2]
const wantImgs = process.argv.includes('--imgs')
let h = await readFile(`_reference/wildkumaon.com/${file}`, 'utf8')

h = h.slice(h.indexOf('<body'))
h = h.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, '')

const ent = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/g, "'").replace(/&#8217;|&rsquo;/g, '\u2019')
  .replace(/&#8216;|&lsquo;/g, '\u2018').replace(/&#8220;|&ldquo;/g, '\u201c').replace(/&#8221;|&rdquo;/g, '\u201d')
  .replace(/&#8211;|&ndash;/g, '\u2013').replace(/&#8212;|&mdash;/g, '\u2014').replace(/&hellip;|&#8230;/g, '\u2026')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))

// mark block boundaries + tag headings/links/images
h = h.replace(/<h([1-6])\b[^>]*>/gi, (m, n) => `\n\u0000H${n}\u0000`)
h = h.replace(/<\/(h[1-6]|p|li|div|section|td|tr|blockquote)>/gi, '\n')
h = h.replace(/<li\b[^>]*>/gi, '\n\u0000LI\u0000')
h = h.replace(/<br\s*\/?>/gi, '\n')
h = h.replace(/<a\b[^>]*href="([^"]*)"[^>]*>/gi, (m, href) => `\u0000A:${href}\u0000`)
if (wantImgs) h = h.replace(/<img\b[^>]*>/gi, (m) => {
  const src = m.match(/\bsrc="([^"]*)"/)?.[1] || ''
  const alt = m.match(/\balt="([^"]*)"/)?.[1] || ''
  return `\n\u0000IMG\u0000 ${src}${alt ? ` | alt="${alt}"` : ''}\n`
})
h = h.replace(/<[^>]+>/g, ' ')

const lines = ent(h).split('\n')
  .map((l) => l.replace(/[ \t\u00a0]+/g, ' ').trim())
  .filter(Boolean)

const seen = new Set()
for (const l of lines) {
  let out = l
    .replace(/\u0000H(\d)\u0000\s*/g, (m, n) => `\n${'#'.repeat(+n)} `)
    .replace(/\u0000LI\u0000\s*/g, '- ')
    .replace(/\u0000A:([^\u0000]*)\u0000\s*/g, '')
    .replace(/\u0000IMG\u0000/g, '[IMG]')
    .replace(/\s+/g, ' ').trim()
  if (!out || out === '-' || out === '#') continue
  const key = out.toLowerCase()
  if (seen.has(key) && out.length < 60) continue
  seen.add(key)
  console.log(out)
}
