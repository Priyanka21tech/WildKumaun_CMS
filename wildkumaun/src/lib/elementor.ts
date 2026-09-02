/**
 * Finding one's way around the mirrored Elementor markup.
 *
 * The mirror reaches the renderers as one long string — see src/lib/shell.ts for
 * why it has to stay a string rather than become a tree — so every block that
 * takes over a section has to locate that section by scanning text. These are the
 * things they all need: where an element ends, and where a given section begins.
 *
 * Elementor nests sections inside sections (a package card is an inner section
 * inside a column of an outer one), so an element cannot be ended by searching
 * for the next closing tag. Depth has to be counted, which is what closeOfElement
 * does and why a single regex over the whole string will not do.
 *
 * Everything here leaves the html alone when it cannot find what it was asked
 * for. A page whose markup has moved on should render as it did rather than
 * half-replaced: a missing section means the CMS and the mirror disagree, which
 * is not a reason to show the reader a broken page.
 */

/**
 * Where the element opening at `start` closes.
 *
 * Two positions, because the two things callers do with an element need
 * different ones. Replacing the element wants everything up to and including
 * `</section>`; replacing what is *inside* it wants to stop before the closing
 * tag — which is what the content block does, since it keeps the origin's
 * `entry-content` wrapper because Astra's type scale hangs off that class.
 * Returning both from one scan is what stops the second case being written as
 * the first minus a guessed tag length.
 */
export function closeOfElement(
  html: string,
  start: number,
  tag: 'div' | 'section',
): { closeStart: number; closeEnd: number } | null {
  const pattern = new RegExp(`</?${tag}\\b[^>]*>`, 'gi')
  pattern.lastIndex = start
  let depth = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1
    if (depth === 0) return { closeStart: match.index, closeEnd: match.index + match[0].length }
  }

  return null
}

/** Just past the closing tag, or -1 if the element never closes. */
export function endOfElement(html: string, start: number, tag: 'div' | 'section'): number {
  return closeOfElement(html, start, tag)?.closeEnd ?? -1
}

/** The closing tag's own position — where the element's contents end. */
export function innerEndOfElement(html: string, start: number, tag: 'div' | 'section'): number {
  return closeOfElement(html, start, tag)?.closeStart ?? -1
}

/** Where the section carrying `data-id` starts and ends, or null if it is absent. */
export function sectionByDataId(html: string, id: string): { start: number; end: number } | null {
  const open = new RegExp(`<section[^>]*\\bdata-id="${id}"[^>]*>`, 'i').exec(html)
  if (!open || open.index === undefined) return null

  const end = endOfElement(html, open.index, 'section')
  if (end === -1) return null

  return { start: open.index, end }
}

/** The markup of that section, for reading what the origin put in it. */
export function sliceSection(html: string, id: string): string | null {
  const at = sectionByDataId(html, id)
  return at ? html.slice(at.start, at.end) : null
}

/**
 * Put `markup` where that section was.
 *
 * An empty string removes the section outright, which is how a block with no
 * heading clears the origin's heading rather than leaving it behind — the same
 * contract the banner field already has.
 */
export function replaceSection(html: string, id: string, markup: string): string {
  const at = sectionByDataId(html, id)
  if (!at) return html

  return html.slice(0, at.start) + markup + html.slice(at.end)
}

/**
 * Replace what is inside a section's container, leaving the section itself alone.
 *
 * This is how the blocks take a section over, and the reason is the stylesheet.
 * Elementor scopes almost every rule it writes to the page it came from —
 * `.elementor-3761 .elementor-element.elementor-element-45a166e{...}` — and the
 * page wrapper carrying that class sits *outside* the section. It also hangs
 * background colours, spacing and the scroll-in animation off the section's own
 * classes and `data-settings`. Rebuild the section and all of that has to be
 * reproduced exactly; replace only what is inside its container and none of it
 * can be got wrong, because none of it is touched.
 *
 * So a block supplies columns, and the section it drops them into stays the
 * origin's.
 */
export function replaceContainer(html: string, sectionId: string, columns: string): string {
  const at = sectionByDataId(html, sectionId)
  if (!at) return html

  const section = html.slice(at.start, at.end)
  const open = /<div class="elementor-container[^"]*"[^>]*>/i.exec(section)
  if (!open || open.index === undefined) return html

  const innerStart = at.start + open.index + open[0].length
  const innerEnd = innerEndOfElement(html, at.start + open.index, 'div')
  if (innerEnd === -1 || innerEnd < innerStart) return html

  return html.slice(0, innerStart) + columns + html.slice(innerEnd)
}
