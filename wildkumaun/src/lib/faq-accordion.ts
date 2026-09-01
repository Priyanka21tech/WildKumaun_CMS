import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from 'lexical'
import { esc } from '../components/SiteHeader'

/**
 * Render the FAQs page's accordion from the collection instead of the mirror.
 *
 * The markup is the origin's, class for class: `.eael-accordion-list` wrapping a
 * `.eael-accordion-header` and a `.eael-accordion-content`, with the plus/minus
 * icons and the caret the stylesheet expects. Those class names carry the whole
 * appearance, so they are the contract.
 *
 * Two things change on the way through:
 *
 *   The header id is the FAQ's slug — `distance-to-lakes` — where the origin used
 *   the entire question slugified into a 90-character id. Both work as an anchor;
 *   the short one survives the question being reworded.
 *
 *   The answer comes from rich text, so it is whatever an editor wrote, rather
 *   than the origin's spans carrying inline font sizes and colours. The
 *   stylesheet already styles `.eael-accordion-content`, so it lands the same.
 */

export type FaqDoc = {
  question?: string | null
  slug?: string | null
  answer?: SerializedEditorState | null
}

/** The container div that holds one question and its answer. */
const ITEM_MARKER = '<div class="eael-accordion-list">'

/**
 * Where the div opening at `start` closes.
 *
 * Counts openings and closings rather than looking for the next `</div>`, because
 * an answer contains nested divs of its own. Returns -1 if the tags never balance,
 * which the caller treats as a reason to leave the page alone.
 */
function endOfDiv(html: string, start: number): number {
  const tag = /<\/?div\b[^>]*>/gi
  tag.lastIndex = start
  let depth = 0
  let match: RegExpExecArray | null

  while ((match = tag.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1
    if (depth === 0) return match.index + match[0].length
  }

  return -1
}

export function renderAccordion(faqs: FaqDoc[]): string {
  return faqs
    .map((faq, index) => {
      const tab = index + 1
      const contentId = `elementor-tab-content-${tab}`
      const headerId = esc(faq.slug ?? `faq-${tab}`)

      const answer = faq.answer
        ? convertLexicalToHTML({ data: faq.answer, disableContainer: true })
        : ''

      return `<div class="eael-accordion-list">
<div aria-controls="${contentId}" class="elementor-tab-title eael-accordion-header" data-tab="${tab}" id="${headerId}" tabindex="0"><span class="eael-advanced-accordion-icon-closed"><i aria-hidden="true" class="fa-accordion-icon fas fa-plus"></i></span><span class="eael-advanced-accordion-icon-opened"><i aria-hidden="true" class="fa-accordion-icon fas fa-minus"></i></span><span class="eael-accordion-tab-title">${esc(
        faq.question,
      )}</span><i aria-hidden="true" class="fa-toggle fas fa-angle-right"></i></div><div aria-labelledby="${headerId}" class="eael-accordion-content clearfix" data-tab="${tab}" id="${contentId}">${answer}</div>
</div>`
    })
    .join('\n')
}

/**
 * Swap the mirrored accordion items for the rendered ones.
 *
 * Only the items are replaced. The widget around them carries the Elementor
 * classes and the `data-accordion-id` the stylesheet and the toggling script both
 * key off, so it stays exactly as the origin wrote it.
 *
 * Returns the page untouched if the accordion is not found or its tags do not
 * balance — a page still showing the mirrored questions is a far smaller problem
 * than one cut in the wrong place.
 */
export function replaceAccordion(html: string, faqs: FaqDoc[]): string {
  if (!faqs.length) return html

  const first = html.indexOf(ITEM_MARKER)
  if (first === -1) return html

  const end = endOfDiv(html, html.lastIndexOf(ITEM_MARKER))
  if (end === -1) return html

  return html.slice(0, first) + renderAccordion(faqs) + html.slice(end)
}
