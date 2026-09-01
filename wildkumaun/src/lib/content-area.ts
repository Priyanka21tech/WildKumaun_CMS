import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from 'lexical'

/**
 * Swap a page's copy for what the CMS holds.
 *
 * WordPress puts a page's body inside `<div class="entry-content">`, and Astra's
 * stylesheet hangs the type scale off that class — `.entry-content h2`, and so on
 * down. So the div stays and only what is inside it changes; render the prose
 * anywhere else and it loses its headings' sizes and its paragraph spacing.
 *
 * This replaces the lot rather than a section of it, which is what makes it
 * different from the testimonials block. A page with a content block has stopped
 * being a mirrored page: its words come from the CMS, and the markup around them
 * — header, banner, footer — is all that is left of the mirror.
 */

const OPEN = /<div class="entry-content[^"]*"[^>]*>/i

/** Where the div opening at `start` closes. */
function endOfDiv(html: string, start: number): number {
  const tag = /<\/?div\b[^>]*>/gi
  tag.lastIndex = start
  let depth = 0
  let match: RegExpExecArray | null

  while ((match = tag.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1
    if (depth === 0) return match.index
  }

  return -1
}

export function replaceContentArea(html: string, content: SerializedEditorState): string {
  const open = OPEN.exec(html)
  if (!open || open.index === undefined) return html

  const innerStart = open.index + open[0].length
  const innerEnd = endOfDiv(html, open.index)
  if (innerEnd === -1 || innerEnd < innerStart) return html

  const rendered = convertLexicalToHTML({ data: content, disableContainer: true })

  return html.slice(0, innerStart) + rendered + html.slice(innerEnd)
}
