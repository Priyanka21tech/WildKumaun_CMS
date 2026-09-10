/**
 * Accessibility repairs to the assembled markup.
 *
 * Three faults the origin ships that CSS cannot reach, because they are what the
 * elements *are* rather than how they look. Each is fixed at render time rather
 * than in content/mirror/*.json, so `npm run mirror:pages` can be re-run without
 * losing them — the same reason the rest of src/lib rewrites strings instead of
 * editing the mirror.
 *
 * Applied last in the pipeline, after the CMS blocks and the header and footer
 * are spliced in, so anything those contribute is covered too.
 */

/**
 * `<marquee>` — WCAG 2.2.2 Pause, Stop, Hide.
 *
 * One marquee, the same welcome line, on all 26 pages.
 *
 * This first stopped the motion outright, which met the criterion and cost the
 * page something the client had chosen. The criterion does not ask for stillness;
 * it asks that anything moving for more than five seconds can be stopped by the
 * person watching it. So the movement is back, and there is now a control.
 *
 * `<marquee>` itself does not come back. It is deprecated, its motion is built
 * into the element where no stylesheet can reach it, and it ignores
 * prefers-reduced-motion. A span with a CSS animation looks the same and can be
 * paused three ways: the button, the OS setting, and a hover.
 *
 * The text is duplicated inside the track so the line can scroll continuously
 * without a gap, and the copy is aria-hidden — a screen reader should hear the
 * welcome once, not twice.
 */
const MARQUEE = /<marquee\b[^>]*>([\s\S]*?)<\/marquee>/gi

function unwrapMarquee(html: string): string {
  return html.replace(
    MARQUEE,
    (_whole, inner: string) =>
      /**
       * Spans throughout, given their layout by CSS.
       *
       * The marquee's parent is not the same element on every mirrored page — on
       * some it is a `<span>`, and a `<div>` inside one is invalid markup that
       * browsers repair by splitting the parent in half. A span is valid
       * everywhere the marquee sat, which is why the first version of this used
       * one and why the structure keeps to them now that it needs four elements
       * instead of one.
       */
      `<span class="wk-tagline" data-paused="false">` +
      `<span class="wk-tagline__viewport">` +
      `<span class="wk-tagline__track">` +
      `<span class="wk-tagline__text">${inner}</span>` +
      `<span class="wk-tagline__text" aria-hidden="true">${inner}</span>` +
      `</span></span>` +
      `<button class="wk-tagline__pause" type="button" aria-pressed="false">` +
      `<span class="wk-tagline__icon" aria-hidden="true">❚❚</span>` +
      `<span class="wk-visually-hidden">Pause the scrolling welcome message</span>` +
      `</button>` +
      `</span>`,
  )
}

/**
 * Elementor's carousel arrows — WCAG 4.1.2 Name, Role, Value.
 *
 * They carry role="button" and tabindex="0", so a screen reader announces them
 * as buttons, but their only content is an <i> that is correctly aria-hidden.
 * The result is "button" with no name: reachable, focusable, and impossible to
 * tell apart from each other.
 *
 * "image" rather than "slide" in the label because these sit on image carousels,
 * and that is the word a listener can act on.
 */
const SWIPER_BUTTON =
  /<div\b([^>]*\bclass="[^"]*elementor-swiper-button-(prev|next)[^"]*"[^>]*)>([\s\S]*?)<\/div>/gi

/**
 * A name was not enough.
 *
 * These carried `role="button"` and `tabindex="0"`, so a keyboard could reach
 * them and a screen reader called them buttons — but neither Enter nor Space
 * activates a div, and lib/carousel.js listens for `click`. The result was an
 * arrow that took focus, announced itself, and then did nothing when pressed.
 *
 * Making it a real <button> is what supplies the missing half: the browser turns
 * Enter and Space into a click, which the existing carousel handler already
 * understands. `role` and `tabindex` come off with it — a button is both by
 * definition, and leaving them is how markup starts to drift from what it is.
 *
 * The inner content is a single aria-hidden <i>, so there is no nested div for
 * the lazy match to end on early.
 */
function realCarouselButtons(html: string): string {
  return html.replace(SWIPER_BUTTON, (_whole, attrs: string, direction: string, inner: string) => {
    const label = direction.toLowerCase() === 'prev' ? 'Previous image' : 'Next image'
    const kept = attrs
      .replace(/\srole\s*=\s*"[^"]*"/gi, '')
      .replace(/\stabindex\s*=\s*"[^"]*"/gi, '')
      .replace(/\saria-label\s*=\s*"[^"]*"/gi, '')
    return `<button${kept} type="button" aria-label="${label}">${inner}</button>`
  })
}

/**
 * Links with nothing in them — WCAG 2.4.4 Link Purpose, 4.1.2 Name, Role, Value.
 *
 * /about-us ships `<a href="/media/…Hitendra-Bisht.png"><br></a>`: an anchor
 * wrapped around a line break, left behind by an edit in the WordPress editor.
 * A screen reader announces "link" with no name, and it is a tab stop that goes
 * to a raw PNG.
 *
 * The anchor is unwrapped rather than labelled. A name would make it a link to a
 * bare image file that no sighted reader can see or use, which is a worse
 * outcome than not having the link — and the <br> it contains is doing real
 * layout work, so that is kept.
 *
 * Deliberately narrow: only anchors whose entire content is whitespace and <br>
 * tags, and which carry no aria-label or title of their own. An anchor holding
 * an image is a different problem and is left for the alt-text work.
 */
/**
 * Links whose words only make sense beside the picture above them — WCAG 2.4.4.
 *
 * A screen reader can list every link on a page and read the list on its own.
 * Four of these say nothing on their own: "Know More" twice, "View More", and
 * "Order Know". Out of that list they are four identical-sounding buttons to
 * nowhere.
 *
 * Keyed on the destination as well as the words, because "Know More" appears on
 * two pages pointing at two different places, and a label that fits one is wrong
 * on the other.
 *
 * The visible text is not touched — including "Order Know", which is the
 * origin's own typo and is preserved everywhere else in this project. The label
 * is what gets read aloud, so it says the word properly without editing the
 * client's page.
 */
const LINK_LABELS: Record<string, string> = {
  'order know|/contact-us': 'Order a bird artwork',
  'know more|/enquiry': 'Know more about the birds found at Wild Kumaon',
  'know more|/work-from-hills': 'Know more about working from the hills',
  'view more|/guest-book': 'View more guest reviews',
}

const ANY_LINK = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi

function labelVagueLinks(html: string): string {
  return html.replace(ANY_LINK, (whole, attrs: string, inner: string) => {
    if (/\b(aria-label|aria-labelledby)\s*=/i.test(attrs)) return whole

    const href = attrs.match(/\bhref\s*=\s*"([^"]*)"/i)?.[1]
    if (!href) return whole

    const text = inner
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

    const label = LINK_LABELS[`${text}|${href}`]
    if (!label) return whole

    return `<a${attrs} aria-label="${label}">${inner}</a>`
  })
}

const EMPTY_LINK = /<a\b([^>]*)>((?:\s|<br\s*\/?>)*)<\/a>/gi

function unwrapEmptyLinks(html: string): string {
  return html.replace(EMPTY_LINK, (whole, attrs: string, inner: string) => {
    if (/\b(aria-label|aria-labelledby|title)\s*=/i.test(attrs)) return whole
    return inner
  })
}

export function withAccessibleMarkup(html: string): string {
  return labelVagueLinks(unwrapEmptyLinks(realCarouselButtons(unwrapMarquee(html))))
}

/**
 * Give every page exactly one h1 — WCAG 1.3.1 Info and Relationships, and
 * 2.4.6 Headings and Labels.
 *
 * Twenty of the twenty-six mirrored pages have no h1 at all: Elementor's heading
 * widget defaults to h2 and nobody changed it, so the page's own title is an h2
 * like every other heading on it. A reader navigating by heading gets a flat list
 * with nothing marking where the page's subject is stated.
 *
 * Two ways to fix it, and which one applies depends on whether the page has a
 * heading worth promoting:
 *
 *   most pages   the first h2 *is* the title — "ABOUT US", "GALLERY", "SATTAL" —
 *                so it becomes the h1 and keeps its classes, which is what the
 *                Elementor stylesheet targets. Nothing moves on screen.
 *
 *   /faqs        no heading of their own at all. Their only headings came from
 *   /restaurant  the footer's contact block, which is why a reader navigating
 *                /faqs by heading used to land on a phone number. They get a
 *                visually-hidden h1 built from the page title instead.
 *
 *   /blog        its h2s are post titles inside <article>. Promoting one would
 *                announce the listing page as whichever post happens to be first,
 *                so post titles are excluded and it takes the hidden h1 too.
 *
 * Run against the page body before the header and footer are spliced in, so a
 * footer column heading can never be mistaken for the page's subject.
 */

/**
 * Close the gaps in the heading outline — WCAG 1.3.1.
 *
 * Elementor's heading widget lets an editor pick any level, and on four pages
 * someone picked h4 for what is plainly the next level down from an h2: the
 * package cards under "PACKAGES", the trail names under "Bird Watching Places of
 * Sattal", the address blocks on /contact-us, and "Trip report" directly under
 * the h1 on /spring-trip-report. A jump from h2 to h4 tells a screen-reader user
 * there is a level of structure between them that they have somehow missed.
 *
 * Rather than name those four cases, this walks the outline and pulls any
 * heading that drops more than one level back to exactly one below its
 * predecessor. A heading that is already correct is left untouched, so pages
 * with a sound outline pass through unchanged.
 *
 * Only the level changes. Attributes stay, which is what keeps the appearance
 * identical — Elementor styles headings through their element classes, not
 * through the tag name.
 */
const HEADING_TAG = /<(\/?)h([1-6])\b([^>]*)>/gi

function normaliseHeadingOrder(html: string): string {
  let previous = 0
  /** The level an open heading was rewritten to, so its closing tag matches. */
  let openAs: number | null = null

  return html.replace(HEADING_TAG, (whole, slash: string, digit: string, attrs: string) => {
    const level = Number(digit)

    if (slash) {
      const closeAs = openAs ?? level
      openAs = null
      return `</h${closeAs}>`
    }

    const corrected = previous > 0 && level > previous + 1 ? previous + 1 : level
    previous = corrected
    openAs = corrected
    return corrected === level ? whole : `<h${corrected}${attrs}>`
  })
}

/** Contact details the origin marked up as headings. Never a page title. */
const CONTACT_HEADING = /^\s*(mob\b|mobile\b|phone\b|tel\b|email\b|e-mail\b|address\s*:)/i

/**
 * Headings that belong to an item in a list rather than to the page showing it.
 *
 * `entry-title` is a post's title on the blog archive; `wk-faq-question` is one
 * question in the accordion. Both are h2s, both come first in the document, and
 * neither is what the page is about — promoting one would announce /blog as
 * whichever post happens to be at the top, and /faqs as its first question.
 */
const ITEM_HEADING = /\b(entry-title|wk-faq-question)\b/

const H2_TAG = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/i

const MAIN_OPEN = /<main\b[^>]*>/i

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/** "FAQs | Wild Kumaon Sattal" -> "FAQs". The suffix is on every page's title. */
export function pageTitleOnly(title: string): string {
  return title.split('|')[0].trim() || title.trim()
}

export function withPageHeading(html: string, title: string): string {
  if (/<h1\b/i.test(html)) return html

  const match = H2_TAG.exec(html)
  const attrs = match?.[1] ?? ''
  const inner = match?.[2] ?? ''

  const usable = match && !ITEM_HEADING.test(attrs) && !CONTACT_HEADING.test(stripTags(inner))

  if (usable) {
    return html.replace(H2_TAG, `<h1${attrs}>${inner}</h1>`)
  }

  const heading = `<h1 class="wk-page-title">${pageTitleOnly(title)}</h1>`
  return MAIN_OPEN.test(html)
    ? html.replace(MAIN_OPEN, (open) => open + heading)
    : heading + html
}

/**
 * The page's own heading structure: one h1, and no level skipped below it.
 *
 * Order matters — the h1 has to exist before the outline is walked, or the first
 * real heading would still be an h2 and every level below it would be measured
 * against the wrong parent.
 */
export function withHeadingStructure(html: string, title: string): string {
  return normaliseHeadingOrder(withPageHeading(html, title))
}
