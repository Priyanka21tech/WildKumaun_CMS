import type { Payload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { originalFilename } from '../lib/responsive-html'
import { htmlToLexical } from './html-to-lexical'

/**
 * Give the plain content pages a content block holding what they already say.
 *
 * Only the pages the origin built as ordinary WordPress copy. Of the 26, exactly
 * one is worth moving today: /about-us, which is a heading, some paragraphs and
 * two pictures with no Elementor anywhere in it. The others are Elementor pages
 * of 12 to 153 sections, and flattening those into prose would throw their layout
 * away rather than migrate it.
 *
 * The page's own markup is what gets converted, not the extraction's list of
 * headings and paragraphs. The list has the words but not the order they came in
 * or the places the pictures sat, so a page rebuilt from it reads like the
 * original without looking like it. See html-to-lexical.ts.
 *
 * Pictures become Media documents. The origin wrote them in as
 * `<img src="/media/...">`, which nobody could change without editing markup; as
 * uploads they are relationships, and swapping one is picking another.
 *
 * Creates only. A page that already has a layout keeps it.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(dirname, '../../..')

/** The pages whose copy is plain enough to carry over. */
const PLAIN_PAGES = ['about-us']

/**
 * The Media document for a filename the page asks for.
 *
 * A page may point at one of WordPress's responsive copies —
 * `Owner-and-Founder-...-1024x576.png` — and those were never imported, because
 * the original sits beside them and Payload makes its own sizes. So a name that
 * finds nothing is tried again without its dimensions, which is the image the copy
 * was cut from.
 */
async function findMedia(payload: Payload, filename: string): Promise<number | undefined> {
  for (const name of [filename, originalFilename(filename)]) {
    const found = await payload.find({
      collection: 'media',
      where: { filename: { equals: name } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    const id = found.docs[0]?.id
    if (typeof id === 'number') return id
  }

  return undefined
}

/** What the mirrored page holds inside its WordPress content area. */
function contentAreaHtml(slug: string): string | undefined {
  const file = path.join(REPO, 'wildkumaun/content/mirror', `${slug}.json`)
  if (!fs.existsSync(file)) return undefined

  const html = JSON.parse(fs.readFileSync(file, 'utf8')).html as string
  const open = /<div class="entry-content[^"]*"[^>]*>/i.exec(html)
  if (!open || open.index === undefined) return undefined

  const start = open.index + open[0].length
  const end = html.indexOf('</article>', start)
  if (end === -1) return undefined

  return html.slice(start, end)
}

export async function seedPageContent(payload: Payload): Promise<{ filled: string[] }> {
  const filled: string[] = []

  for (const slug of PLAIN_PAGES) {
    const found = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    const page = found.docs[0]
    if (!page || (page.layout?.length ?? 0) > 0) continue

    const html = contentAreaHtml(slug)
    if (!html) continue

    const content = await htmlToLexical(html, (src) =>
      findMedia(payload, path.basename(src.split('?')[0])),
    )

    if (!content.root.children.length) continue

    await payload.update({
      collection: 'pages',
      id: page.id,
      // The field's generated type is an open-ended record; Lexical's own
      // SerializedEditorState is the same shape without the index signature.
      data: { layout: [{ blockType: 'content', content: content as never }] },
    })

    filled.push(slug)
  }

  return { filled }
}
