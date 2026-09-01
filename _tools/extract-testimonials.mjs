import { readFile, writeFile } from 'node:fs/promises'

const ent = (s) => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
  .replace(/[\u200b\u200c\u200d\ufeff\u00a0]/g, ' ')
  .replace(/\s+/g, ' ').trim()

const html = await readFile('_reference/wildkumaon.com/guest-book.html', 'utf8')
const items = [...html.matchAll(/<div class="eael-testimonial-item[^"]*"[^>]*>([\s\S]*?)<span class="eael-testimonial-quote">/g)]

const out = []
for (const [, block] of items) {
  const text = ent(block.match(/<div class="eael-testimonial-text">([\s\S]*?)<\/div>/)?.[1] || '')
  const user = block.match(/class="eael-testimonial-user"[^>]*>([\s\S]*?)<\/p>/)?.[1] || ''
  const name = ent(user.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/)?.[1] || user)
  if (text) out.push({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name, quote: text, rating: 5, source: 'Google Reviews' })
}
await writeFile('content/testimonials.json', JSON.stringify({ count: out.length, source: 'guest-book.html', testimonials: out }, null, 2) + '\n')
console.log(`testimonials.json — ${out.length}`)
out.forEach((t, i) => console.log(`  ${i + 1}. ${t.name} (${t.quote.length} chars)`))
