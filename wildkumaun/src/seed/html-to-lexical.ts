import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import { randomUUID } from 'node:crypto'

/**
 * Turn a WordPress page's own markup into rich text, keeping its shape.
 *
 * The alternative was to rebuild the page from the extraction's list of headings
 * and paragraphs, which loses the order things came in and where the pictures sat.
 * Reading the markup itself keeps the page as it was written: the same headings in
 * the same places, the same line breaks inside a paragraph, the same link on the
 * same words, and the pictures between the paragraphs they were between.
 *
 * A deliberately small subset — `h2`, `h3`, `p`, `br`, `a`, `img` — which is all
 * the plain WordPress pages use. Anything else is dropped rather than guessed at,
 * and Elementor pages are not put through this at all: their layout lives in
 * nested markup and classes that rich text has no way to hold.
 *
 * Images become upload nodes, so the picture is a Media document and not a path
 * baked into the text. Lexical puts an upload in a block of its own, so a picture
 * the origin had sitting inside a paragraph ends up just above that paragraph
 * instead of inside it.
 */

/** `resolveImage` returns the Media id for a src, or undefined if there is none. */
export type ResolveImage = (src: string) => Promise<number | undefined>

const text = (value: string): SerializedLexicalNode =>
  ({
    type: 'text',
    text: value,
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    version: 1,
  }) as unknown as SerializedLexicalNode

const linebreak = (): SerializedLexicalNode =>
  ({ type: 'linebreak', version: 1 }) as unknown as SerializedLexicalNode

const link = (url: string, children: SerializedLexicalNode[]): SerializedLexicalNode =>
  ({
    type: 'link',
    version: 3,
    fields: { linkType: 'custom', url, newTab: false },
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
  }) as unknown as SerializedLexicalNode

const upload = (mediaId: number): SerializedLexicalNode =>
  ({
    type: 'upload',
    version: 3,
    format: '',
    // The node's own id, which is not the id of the image it points at.
    id: randomUUID(),
    relationTo: 'media',
    value: mediaId,
    fields: {},
  }) as unknown as SerializedLexicalNode

/**
 * A bulleted or numbered list.
 *
 * Lexical stores a list as a `list` node of `listitem` children, each carrying
 * its own position — the `<ul><li>` nesting the origin writes, in the shape the
 * editor understands. Without these the converter's block scan simply did not
 * see a list, and its words went missing from the page.
 */
const listNode = (
  tag: 'ul' | 'ol',
  items: SerializedLexicalNode[],
): SerializedLexicalNode =>
  ({
    type: 'list',
    tag,
    listType: tag === 'ol' ? 'number' : 'bullet',
    start: 1,
    version: 1,
    children: items,
    direction: 'ltr',
    format: '',
    indent: 0,
  }) as unknown as SerializedLexicalNode

const listItem = (value: number, children: SerializedLexicalNode[]): SerializedLexicalNode =>
  ({
    type: 'listitem',
    value,
    version: 1,
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
  }) as unknown as SerializedLexicalNode

const block = (
  type: 'paragraph' | 'heading',
  children: SerializedLexicalNode[],
  tag?: string,
): SerializedLexicalNode =>
  ({
    type,
    ...(tag ? { tag } : {}),
    version: 1,
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
  }) as unknown as SerializedLexicalNode

/** WordPress escapes these; rich text stores the characters themselves. */
function decode(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&apos;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8230;/g, '…')
}

/**
 * The inline contents of one block: its words, its line breaks and its links.
 *
 * Images are pulled out rather than returned, because an upload cannot sit inside
 * a paragraph — the caller places them as blocks of their own, in the order they
 * were found.
 */
async function inlineNodes(
  html: string,
  resolveImage: ResolveImage,
  images: SerializedLexicalNode[],
): Promise<SerializedLexicalNode[]> {
  const nodes: SerializedLexicalNode[] = []
  const token = /<br\s*\/?>|<img\b[^>]*>|<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>/gi

  let cursor = 0
  let match: RegExpExecArray | null

  const pushText = (raw: string) => {
    const value = decode(raw).replace(/\s+/g, ' ')
    if (value.trim()) nodes.push(text(value))
  }

  while ((match = token.exec(html))) {
    pushText(html.slice(cursor, match.index))
    cursor = match.index + match[0].length

    const tag = match[0]

    if (/^<br/i.test(tag)) {
      nodes.push(linebreak())
      continue
    }

    if (/^<img/i.test(tag)) {
      const src = /\ssrc="([^"]+)"/i.exec(tag)?.[1]
      const id = src ? await resolveImage(src) : undefined
      if (typeof id === 'number') images.push(upload(id))
      continue
    }

    if (/^<a/i.test(tag)) {
      const href = /\shref="([^"]+)"/i.exec(tag)?.[1]
      const inner = tag.replace(/^<a\b[^>]*>/i, '').replace(/<\/a>$/i, '')
      const children = await inlineNodes(inner, resolveImage, images)

      // A link wrapping only a picture has nothing left to be a link on once the
      // picture has been lifted out, so it is dropped rather than left empty.
      if (href && children.length) nodes.push(link(href, children))
      continue
    }

    // Any other tag: keep whatever it wrapped, drop the tag.
  }

  pushText(html.slice(cursor))

  return nodes
}

/** Trailing line breaks the origin left inside headings and links. */
function trimBreaks(nodes: SerializedLexicalNode[]): SerializedLexicalNode[] {
  const out = [...nodes]
  while (out.length && (out[0] as { type?: string }).type === 'linebreak') out.shift()
  while (out.length && (out[out.length - 1] as { type?: string }).type === 'linebreak') out.pop()
  return out
}

export async function htmlToLexical(
  html: string,
  resolveImage: ResolveImage,
): Promise<SerializedEditorState> {
  const children: SerializedLexicalNode[] = []
  const blocks = /<(h2|h3|h4|p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi

  let match: RegExpExecArray | null

  while ((match = blocks.exec(html))) {
    const [, rawTag, inner] = match
    const tag = rawTag.toLowerCase()

    if (tag === 'ul' || tag === 'ol') {
      const items: SerializedLexicalNode[] = []
      const listImages: SerializedLexicalNode[] = []

      for (const item of inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
        const itemNodes = trimBreaks(await inlineNodes(item[1], resolveImage, listImages))
        if (itemNodes.length) items.push(listItem(items.length + 1, itemNodes))
      }

      children.push(...listImages)
      if (items.length) children.push(listNode(tag, items))
      continue
    }

    const images: SerializedLexicalNode[] = []
    const nodes = trimBreaks(await inlineNodes(inner, resolveImage, images))

    // Pictures first: the origin puts them at the start of the paragraph they
    // belong to, and an upload has to be its own block.
    children.push(...images)

    if (!nodes.length) continue

    children.push(tag === 'p' ? block('paragraph', nodes) : block('heading', nodes, tag))
  }

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  } as unknown as SerializedEditorState
}
