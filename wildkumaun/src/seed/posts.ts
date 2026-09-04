import type { Payload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Put the origin's three blog cards into the Posts collection.
 *
 * Read off the archive markup rather than typed out, for the reason every seed
 * here reads the mirror: the words on the page are the words the client approved,
 * and retyping them is how a migration acquires differences nobody meant.
 *
 * Each card names the page it links to — `/spring-trip-report` — and those pages
 * are already in the Pages collection, so the link is resolved to a document id
 * here. A card whose page is missing is skipped rather than created without one:
 * `page` is required, and a post that points nowhere would be a card an editor has
 * to repair before it renders.
 *
 * Creates only. A post already in the collection has been through an editor's
 * hands and is left exactly as it is.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(dirname, '../../..')

type Card = {
  title: string
  slug: string
  excerpt: string
  category: string
  author: string
}

/** The mirrored blog page, or nothing if it was never captured. */
function archiveHtml(): string | undefined {
  const file = path.join(REPO, 'wildkumaun/content/mirror', 'blog.json')
  if (!fs.existsSync(file)) return undefined
  return (JSON.parse(fs.readFileSync(file, 'utf8')) as { html: string }).html
}

/** Tags out, entities back to characters, runs of space collapsed. */
const text = (value: string): string =>
  value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Every card the archive lists.
 *
 * One pass over the `<article>` elements, pulling the four things a card says. The
 * excerpt is the first paragraph of the card's own `entry-content`, which is
 * WordPress's trimmed version rather than the page's opening — the page has its
 * own copy and this is deliberately not it.
 */
function cardsIn(html: string): Card[] {
  const cards: Card[] = []

  for (const match of html.matchAll(/<article\b[^>]*class="[^"]*ast-article-post[^"]*"[\s\S]*?<\/article>/g)) {
    const markup = match[0]

    const title = /<h2 class="entry-title"[^>]*>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(markup)
    if (!title) continue

    const excerpt = /<div class="entry-content clear"[^>]*>\s*<p>([\s\S]*?)<\/p>/.exec(markup)
    const category = /<span class="cat-links">(?:<a[^>]*>)?([\s\S]*?)(?:<\/a>)?<\/span>/.exec(markup)
    const author = /<span class="author-name"[^>]*>([\s\S]*?)<\/span>/.exec(markup)

    cards.push({
      title: text(title[2]),
      slug: title[1].replace(/^\//, '').replace(/\/$/, ''),
      excerpt: text(excerpt?.[1] ?? ''),
      category: text(category?.[1] ?? '') || 'General',
      author: text(author?.[1] ?? '') || 'Neer',
    })
  }

  return cards
}

export async function seedPosts(
  payload: Payload,
): Promise<{ created: number; skipped: number; unresolved: string[] }> {
  const html = archiveHtml()
  if (!html) return { created: 0, skipped: 0, unresolved: [] }

  let created = 0
  let skipped = 0
  const unresolved: string[] = []

  // The archive lists newest first, and `order` is what the page sorts by, so the
  // position in the markup is the order. Tens, so one can be slotted between two.
  let order = 10

  for (const card of cardsIn(html)) {
    const existing = await payload.find({
      collection: 'posts',
      where: { title: { equals: card.title } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    if (existing.docs.length) {
      skipped++
      order += 10
      continue
    }

    const page = await payload.find({
      collection: 'pages',
      where: { slug: { equals: card.slug } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    const pageId = page.docs[0]?.id
    if (typeof pageId !== 'number') {
      unresolved.push(`${card.title} — no page at /${card.slug}`)
      continue
    }

    await payload.create({
      collection: 'posts',
      data: {
        title: card.title,
        page: pageId,
        excerpt: card.excerpt,
        category: card.category,
        author: card.author,
        order,
      },
    })

    created++
    order += 10
  }

  return { created, skipped, unresolved }
}
