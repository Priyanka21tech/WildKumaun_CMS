import { esc } from '../components/SiteHeader'

/**
 * Render the guest reviews on the two pages that show them.
 *
 * The same reviews, two shapes:
 *
 *   /guest-book  a two-column grid — one Elementor section per pair
 *   /            slides inside the Sina slider that already rotates them
 *
 * Both reuse a single Elementor widget hash rather than the ten and four the
 * origin generated. Those hashes exist so Elementor can style each widget
 * separately, and here every rule behind them is identical — `text-align:center`
 * on the guest book, a colour and spacing set on the home page. One class means
 * one rule covers however many reviews there are, instead of a review beyond the
 * tenth arriving unstyled because the origin never made a hash for it.
 *
 * The DOM ids stay unique — those come from the review's slug — because an id
 * repeated down a page is a different kind of wrong.
 */

export type TestimonialDoc = {
  name?: string | null
  quote?: string | null
  slug?: string | null
}

/** The widget hash whose rules the guest book's stylesheet already carries. */
const GRID_WIDGET = '6494d3f'

/** The same, for the home page slider. Its rules are inline in the slide markup. */
const SLIDER_WIDGET = '48ccce6'

/** The section the guest book's grid is built from, and the slider's own slides. */
const GRID_SECTION_MARKER = 'elementor-element-cc37eed'
const SLIDE_MARKER = '<div class="sina-cs-item'

/**
 * One review, in the markup Essential Addons produces.
 *
 * `align` differs between the two pages — the guest book justifies its text, the
 * home page centres it — and it is inline on the origin's paragraphs rather than
 * in the stylesheet, so it is passed in rather than guessed.
 */
function testimonial(item: TestimonialDoc, widget: string, align: string): string {
  const id = esc(item.slug ?? '')
  return `<div class="elementor-element elementor-element-${widget} elementor-widget elementor-widget-eael-testimonial" data-element_type="widget" data-id="${widget}" data-widget_type="eael-testimonial.default">
<div class="elementor-widget-container">
<div class="eael-testimonial-item clearfix default-style" id="eael-testimonial-${id}">
<div class="eael-testimonial-content">
<div class="eael-testimonial-text"><p style="text-align: ${align};"><span style="color: #333333; font-family: georgia, palatino, serif;">${esc(
    item.quote,
  )}</span></p> </div><p class="eael-testimonial-user"><b>${esc(item.name)}</b></p> </div>
<span class="eael-testimonial-quote"></span> </div>
</div>
</div>`
}

/** Where the div or section opening at `start` closes. */
function endOfElement(html: string, start: number, tag: 'div' | 'section'): number {
  const pattern = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi')
  pattern.lastIndex = start
  let depth = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1
    if (depth === 0) return match.index + match[0].length
  }

  return -1
}

// ------------------------------------------------------------------ guest book

/** Two reviews to a row, matching the origin's `elementor-col-50` columns. */
function gridSection(pair: TestimonialDoc[]): string {
  const columns = pair
    .map(
      (item) =>
        `<div class="elementor-column elementor-col-50 elementor-top-column elementor-element" data-element_type="column">
<div class="elementor-widget-wrap elementor-element-populated">
${testimonial(item, GRID_WIDGET, 'justify')}
</div>
</div>`,
    )
    .join('\n')

  return `<section class="elementor-section elementor-top-section elementor-element elementor-element-cc37eed elementor-section-boxed elementor-section-height-default elementor-section-height-default" data-element_type="section">
<div class="elementor-container elementor-column-gap-default">
${columns}
</div>
</section>`
}

/**
 * Replace the grid of reviews on the guest book.
 *
 * The origin lays them out as five sections of two. An odd number leaves the last
 * row with one column, which is what the origin would have done too.
 */
export function replaceTestimonialGrid(html: string, items: TestimonialDoc[]): string {
  if (!items.length) return html

  const first = html.indexOf(`<section`, html.indexOf(GRID_SECTION_MARKER) - 4000)
  if (first === -1 || html.indexOf(GRID_SECTION_MARKER) === -1) return html

  // The grid runs from the first review's section to the end of the last one's.
  const lastWidget = html.lastIndexOf('elementor-widget-eael-testimonial')
  if (lastWidget === -1) return html
  const lastSection = html.lastIndexOf('<section', lastWidget)
  const end = endOfElement(html, lastSection, 'section')
  if (end === -1 || end <= first) return html

  const rows: string[] = []
  for (let i = 0; i < items.length; i += 2) rows.push(gridSection(items.slice(i, i + 2)))

  return html.slice(0, first) + rows.join('\n') + html.slice(end)
}

// ------------------------------------------------------------------- home page

/**
 * The style block the origin repeats inside every slide, emitted once.
 *
 * It is inline rather than in site.css because Elementor writes per-page styles
 * into the page, and this slider's slides each carried their own copy.
 */
function sliderStyle(): string {
  const sel = `.elementor-2463 .elementor-element.elementor-element-${SLIDER_WIDGET}`
  return `<style>${sel} .eael-testimonial-content{text-align:center;}${sel} .eael-testimonial-content .eael-testimonial-user{color:#272727;}${sel} .eael-testimonial-content .eael-testimonial-text{color:#7a7a7a;line-height:2em;}${sel} .eael-testimonial-quote{color:#FFF9F926;font-family:"Open Sans", Sans-serif;font-size:15px;line-height:0.8em;}${sel} span.eael-testimonial-quote{top:5%;right:5%;}${sel} > .elementor-widget-container{margin:0px 15px 0px 15px;padding:0px 0px 0px 0px;}</style>`
}

function slide(item: TestimonialDoc): string {
  return `<div class="sina-cs-item">
<div class="elementor elementor-2463" data-elementor-id="2463" data-elementor-type="page">
<section class="elementor-section elementor-top-section elementor-element elementor-element-0d5675a elementor-section-boxed elementor-section-height-default elementor-section-height-default" data-element_type="section" data-id="0d5675a">
<div class="elementor-container elementor-column-gap-default">
<div class="elementor-column elementor-col-100 elementor-top-column elementor-element elementor-element-72ddc5a" data-element_type="column" data-id="72ddc5a">
<div class="elementor-widget-wrap elementor-element-populated">
${testimonial(item, SLIDER_WIDGET, 'left')}
</div>
</div>
</div>
</section>
</div>
</div>`
}

/** The heading widget the origin puts above the slider. */
const HEADING_WIDGET = 'elementor-element-bc97c06'

/**
 * Replace the heading above the slider.
 *
 * It is its own Elementor widget, so it is a separate swap from the slides. An
 * empty heading removes the widget, matching how an empty banner clears a section
 * rather than leaving the mirror's.
 */
export function replaceTestimonialHeading(html: string, heading?: string | null): string {
  const widget = html.indexOf(HEADING_WIDGET)
  if (widget === -1) return html

  const open = html.lastIndexOf('<div', widget)
  const end = endOfElement(html, open, 'div')
  if (end === -1) return html

  if (!heading) return html.slice(0, open) + html.slice(end)

  const replacement = `<div class="elementor-element elementor-element-bc97c06 elementor-widget elementor-widget-heading" data-element_type="widget" data-id="bc97c06" data-widget_type="heading.default">
<div class="elementor-widget-container">
<h2 class="elementor-heading-title elementor-size-default">${esc(heading)}</h2> </div>
</div>`

  return html.slice(0, open) + replacement + html.slice(end)
}

/**
 * Replace the slides in the home page's testimonial slider.
 *
 * There are two Sina sliders on that page; only the one holding reviews is
 * touched, found by looking for a slide that contains a testimonial widget. The
 * slider element itself is left alone — Enhancements.jsx reads its `data-*`
 * attributes to drive the rotation.
 */
export function replaceTestimonialSlides(html: string, items: TestimonialDoc[]): string {
  if (!items.length) return html

  const anchor = html.indexOf('elementor-widget-eael-testimonial')
  if (anchor === -1) return html

  const first = html.lastIndexOf(SLIDE_MARKER, anchor)
  if (first === -1) return html

  // Walk slide by slide to the last one that still holds a review.
  let end = -1
  let cursor = first
  while (cursor !== -1) {
    const close = endOfElement(html, cursor, 'div')
    if (close === -1) break
    end = close
    const next = html.indexOf(SLIDE_MARKER, close)
    if (next === -1) break
    const following = endOfElement(html, next, 'div')
    if (following === -1) break
    if (!html.slice(next, following).includes('elementor-widget-eael-testimonial')) break
    cursor = next
  }

  if (end === -1 || end <= first) return html

  return html.slice(0, first) + sliderStyle() + items.map(slide).join('\n') + html.slice(end)
}
