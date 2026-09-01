/**
 * Cut the mirrored page open so the header and footer can be replaced.
 *
 * Every one of the 26 mirrored pages is a full document body: opening wrappers,
 * then `<header>`, then `<main>`, then `<footer>`, then the closing wrappers.
 * Moving the header and footer onto the CMS means removing those two slices and
 * putting rendered markup in their place.
 *
 * The pieces have to be spliced back into one string rather than rendered as
 * three React children. The opening wrappers before the header are closed by tags
 * that sit after the footer, so three separate dangerouslySetInnerHTML containers
 * would each get its own auto-closed subtree and Astra's `#page > #content`
 * nesting — which its stylesheet depends on — would be gone.
 *
 * If either element is missing or out of order, `ok` is false and the caller
 * should render the page untouched. A page that still shows the old header is a
 * far smaller problem than one whose markup has been cut in the wrong place.
 */

export type Shell = {
  ok: boolean
  /** Everything before `<header`. */
  before: string
  /** Everything between `</header>` and `<footer`. */
  middle: string
  /** Everything after `</footer>`. */
  after: string
}

const HEADER_CLOSE = '</header>'
const FOOTER_CLOSE = '</footer>'

export function splitShell(html: string): Shell {
  const headerStart = html.indexOf('<header')
  const headerEnd = html.indexOf(HEADER_CLOSE)
  // The last one: a page's own content could mention a footer element before the
  // real one, but nothing comes after the document's own footer.
  const footerStart = html.lastIndexOf('<footer')
  const footerEnd = html.lastIndexOf(FOOTER_CLOSE)

  const ok =
    headerStart !== -1 &&
    headerEnd > headerStart &&
    footerStart > headerEnd &&
    footerEnd > footerStart

  if (!ok) return { ok: false, before: '', middle: html, after: '' }

  return {
    ok: true,
    before: html.slice(0, headerStart),
    middle: html.slice(headerEnd + HEADER_CLOSE.length, footerStart),
    after: html.slice(footerEnd + FOOTER_CLOSE.length),
  }
}
