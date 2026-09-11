/**
 * Elementor's Toggle widget — the birding tour itinerary.
 *
 * Six entries, one per day, and all three parts of a disclosure are wrong in a
 * different way:
 *
 *   The ARIA is on an element nobody can reach. `role="button"`, `aria-expanded`
 *   and `aria-controls` all sit on a <div> with no tabindex, so focus never
 *   lands there and a screen reader never says "button, collapsed".
 *
 *   Focus lands on an <a> with no href instead. That is not a link — an anchor
 *   without a destination has no role at all — so the reader is handed a
 *   focusable something with a name and nothing else.
 *
 *   And none of it opens. Elementor's script does the opening, and no origin
 *   JavaScript is loaded here, so the six days of the itinerary cannot be read
 *   by anyone, with any input device.
 *
 * The header becomes a real <button> inside an <h3>, which is the WAI-ARIA
 * accordion pattern and the same shape src/lib/faq-accordion.ts uses. The
 * heading level is h3 because the page's own outline is `BIRDING TOURS` (h2) and
 * `Itinerary` (h2), and these sit under the second — at h2 they would read as
 * six more sections of the page rather than six parts of the itinerary.
 *
 * Opening and closing is src/components/Enhancements.jsx; this only fixes what
 * the elements are.
 */

/**
 * One toggle header, from the opening div to the closing anchor.
 *
 * Matched as a whole rather than tag by tag because the anchor has to become a
 * span in the same pass — leaving it would put a focusable element inside a
 * button, which is invalid and gives the reader two stops for one control.
 */
const TOGGLE_HEADER =
  /<div\b([^>]*\bclass="[^"]*elementor-tab-title[^"]*"[^>]*)>([\s\S]*?)<a\b[^>]*\bclass="([^"]*elementor-toggle-title[^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<\/div>/gi

export function withToggleButtons(html: string): string {
  return html.replace(
    TOGGLE_HEADER,
    (_whole, attrs: string, icon: string, titleClass: string, title: string) => {
      /**
       * `role="button"` comes off with the div that carried it.
       *
       * A <button> is a button; saying so twice is how markup starts to drift
       * from what it is. aria-expanded and aria-controls stay — those are state
       * and relationship, not role, and they are what the pattern needs.
       */
      const kept = attrs.replace(/\srole="[^"]*"/gi, '')

      return (
        `<h3 class="wk-toggle-heading">` +
        `<button${kept} type="button">` +
        icon.trim() +
        `<span class="${titleClass}">${title}</span>` +
        `</button>` +
        `</h3>`
      )
    },
  )
}
