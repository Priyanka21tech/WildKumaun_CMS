// Extract the three blog posts (index excerpt + full body) into content/posts.json.
import { readFile, writeFile } from 'node:fs/promises'

const ent = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
const strip = (s) => ent(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

const POSTS = [
  { slug: 'eco-friendly-enterprises-in-sattal', title: 'Eco-friendly Enterprises in Sattal', postId: 3820 },
  { slug: 'spring-trip-report', title: 'Sattal-Pangot Birding Tour Report, Spring 2022', postId: 3769 },
  { slug: 'bird-watching-in-sattal', title: 'Bird watching in Sattal', postId: 2934 },
]

// Excerpts as they appear on the blog index. Each ends with "<Title> Read More »" — trim that tail.
const blog = await readFile('_reference/wildkumaon.com/blog.html', 'utf8')
const excerpts = {}
for (const m of blog.matchAll(/<h2 class="entry-title"[^>]*><a href="([^"]*)"[\s\S]*?<div class="entry-content[^"]*"[^>]*>\s*<p>([\s\S]*?)<\/p>/g)) {
  excerpts[m[1].replace(/\.html$/, '')] = strip(m[2])
}

const out = []
for (const p of POSTS) {
  const html = await readFile(`_reference/wildkumaon.com/${p.slug}.html`, 'utf8')
  const start = html.indexOf('<div class="entry-content')
  const end = html.indexOf('post-navigation', start)
  const seg = html.slice(start, end > start ? end : start + 60000)

  const body = []
  for (const m of seg.matchAll(/<(p|h[1-6]|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = strip(m[2])
    if (text.length < 3) continue
    const tag = m[1].toLowerCase()
    const type = tag === 'p' ? 'paragraph' : tag === 'li' ? 'listItem' : tag === 'blockquote' ? 'quote' : `heading${tag[1]}`
    body.push({ type, text })
  }

  const links = [...new Set([...seg.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]))]
    .filter((u) => !/wildkumaon\.com\/(wp|_next)/.test(u))
  const images = [...new Set([...seg.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]))]
    .filter((u) => /\.(jpe?g|png|webp)$/i.test(u))
    .map((u) => u.replace(/^media\//, 'assets/images/'))

  out.push({
    id: p.slug,
    postId: p.postId,
    title: p.title,
    slug: `/${p.slug}`,
    author: 'Neer',
    category: 'General',
    date: null,
    excerpt: excerpts[p.slug] || '',
    heroImage: images[0] || null,
    images,
    links,
    body,
  })
  console.log(`${p.slug}: ${body.length} blocks, ${images.length} images, ${links.length} links`)
}

const doc = {
  count: out.length,
  source: 'blog.html + individual post pages',
  note: 'The live site renders no visible publish dates, so date is null. Category and author are taken from the entry meta ("General / By Neer").',
  categories: ['General'],
  posts: out,
}
await writeFile('content/posts.json', JSON.stringify(doc, null, 2) + '\n')
