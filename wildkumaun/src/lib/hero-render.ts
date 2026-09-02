import { esc } from '../components/SiteHeader'
import { endOfElement } from './elementor'
import type { MediaMap } from './media-map'
import { asMedia, responsive } from './widgets'
import type { MediaDoc } from './widgets'

/**
 * Replace the slides in the home page's hero.
 *
 * The hero is the one section whose content is not markup. Elementor sets a
 * slide's photograph as a CSS `background-image` in a `<style>` block written
 * into the slide itself, so there is no `<img>` to point at a Media document —
 * the picture lives in a stylesheet in the middle of the page. That is why this
 * emits CSS as well as markup, and why it is the last section to be moved.
 *
 * Every slide is rendered from one template rather than from the five the origin
 * generated. The five are the same shape — a full-width section with a
 * translucent caption band over a cover-fitted photograph — and differ only in
 * which image they name and a mobile background-position detail. One template
 * means a sixth slide added in the admin panel looks like the first five, which
 * five hard-coded templates could not manage.
 *
 * The per-slide class is what makes that possible. All slides share the origin's
 * element ids so its rules still reach them, and the background image — the one
 * thing that must differ per slide — is scoped to a class of our own.
 *
 * The slider element itself is left alone: Enhancements.jsx reads its `data-*`
 * attributes to drive the rotation, exactly as with the testimonials slider
 * beneath it.
 */

export type HeroSlide = {
  image?: unknown
  caption?: string | null
}

export type HeroBlockValue = {
  slides?: HeroSlide[] | null
}

/** The origin's ids for the slide template. Its stylesheet is written against these. */
const PAGE = '1182'
const SECTION = '3ac8fda'
const OUTER_COLUMN = '691c656'
const INNER_SECTION = '530d983'
const CAPTION_COLUMN = '08cf1d3'
const CAPTION_WIDGET = 'f856c8f'
const SPACER_COLUMN = '1832b08'

/** Marks the slider holding the hero rather than the one holding the reviews. */
const SLIDER_MARKER = '<div class="sina-content-slider'
const TESTIMONIAL_MARKER = 'eael-testimonial'

/**
 * The slide's own styling, scoped so each slide keeps its own photograph.
 *
 * This is the origin's inline style with the element ids left as they are and a
 * per-slide class added, so the rules that are the same for every slide stay the
 * same and only the image differs. `!important` is not needed: the class adds
 * specificity over the origin's own rule, and the origin's rule is gone anyway
 * once this markup replaces the slide that carried it.
 */
function slideStyle(index: number, url: string): string {
  const own = `.wk-hero-${index}`
  const section = `${own} .elementor-element.elementor-element-${SECTION}`
  const caption = `${own} .elementor-element.elementor-element-${CAPTION_WIDGET}`

  return `<style>${section} > .elementor-container{min-height:600px;}${section}:not(.elementor-motion-effects-element-type-background), ${section} > .elementor-motion-effects-container > .elementor-motion-effects-layer{background-image:url("${url}");background-position:center center;background-size:cover;}${section}{transition:background 0.3s, border 0.3s, border-radius 0.3s, box-shadow 0.3s;}${caption}{color:#FFF9F9;font-family:"Sevillana", Sans-serif;font-size:30px;font-weight:400;}${caption} > .elementor-widget-container{padding:0px 0px 0px 5px;background-color:#1A080870;}@media(max-width:767px){${section}:not(.elementor-motion-effects-element-type-background), ${section} > .elementor-motion-effects-container > .elementor-motion-effects-layer{background-position:0px 0px;}${caption}{text-align:center;}${caption} > .elementor-widget-container{padding:0px 5px 0px 10px;}}</style>`
}

function slide(index: number, media: MediaDoc, caption?: string | null): string {
  const url = `/media/${media.filename}`

  // An empty caption leaves the band off entirely rather than drawing an empty
  // one, which is what the origin's fifth slide does.
  const captionWidget = caption
    ? `<div class="elementor-element elementor-element-${CAPTION_WIDGET} elementor-widget elementor-widget-text-editor" data-element_type="widget" data-id="${CAPTION_WIDGET}" data-widget_type="text-editor.default">
<div class="elementor-widget-container"><p>${esc(caption)}</p></div>
</div>`
    : ''

  return `<div class="sina-cs-item wk-hero-${index}">
${slideStyle(index, url)}
<div class="elementor elementor-${PAGE}" data-elementor-id="${PAGE}" data-elementor-type="page">
<section class="elementor-section elementor-top-section elementor-element elementor-element-${SECTION} elementor-section-full_width elementor-section-height-min-height elementor-section-height-default elementor-section-items-middle" data-element_type="section" data-id="${SECTION}" data-settings='{"background_background":"classic"}'>
<div class="elementor-container elementor-column-gap-no">
<div class="elementor-column elementor-col-100 elementor-top-column elementor-element elementor-element-${OUTER_COLUMN}" data-element_type="column" data-id="${OUTER_COLUMN}">
<div class="elementor-widget-wrap elementor-element-populated">
<section class="elementor-section elementor-inner-section elementor-element elementor-element-${INNER_SECTION} elementor-section-boxed elementor-section-height-default elementor-section-height-default" data-element_type="section" data-id="${INNER_SECTION}">
<div class="elementor-container elementor-column-gap-default">
<div class="elementor-column elementor-col-50 elementor-inner-column elementor-element elementor-element-${CAPTION_COLUMN}" data-element_type="column" data-id="${CAPTION_COLUMN}">
<div class="elementor-widget-wrap elementor-element-populated">${captionWidget}</div>
</div>
<div class="elementor-column elementor-col-50 elementor-inner-column elementor-element elementor-element-${SPACER_COLUMN}" data-element_type="column" data-id="${SPACER_COLUMN}" data-settings='{"background_background":"classic"}'>
<div class="elementor-widget-wrap"></div>
</div>
</div>
</section>
</div>
</div>
</div>
</section>
</div>
</div>`
}

/**
 * Find the hero's slider.
 *
 * The home page has two of them and they are the same markup, so position is no
 * way to tell them apart — the reviews come second today, and would not if a
 * section were ever reordered. The one holding reviews contains testimonial
 * widgets, so the hero is the one that does not.
 */
function heroSlider(html: string): { start: number; end: number } | null {
  let from = 0

  while (true) {
    const at = html.indexOf(SLIDER_MARKER, from)
    if (at === -1) return null

    const end = endOfElement(html, at, 'div')
    if (end === -1) return null

    if (!html.slice(at, end).includes(TESTIMONIAL_MARKER)) return { start: at, end }
    from = end
  }
}

export function replaceHero(html: string, block: HeroBlockValue, map: MediaMap): string {
  const slides = (block.slides ?? []).flatMap((row) => {
    const media = asMedia(row.image)
    // A slide whose upload arrived as a bare id has no filename to point at, so
    // it is left out rather than rendered as a blank panel in the rotation.
    return media?.filename ? [{ media, caption: row.caption }] : []
  })

  if (!slides.length) return html

  const at = heroSlider(html)
  if (!at) return html

  const open = html.slice(at.start, html.indexOf('>', at.start) + 1)
  const rendered = slides
    .map((row, index) => slide(index + 1, row.media, row.caption))
    .join('')

  // The photographs are CSS backgrounds, so `responsive` cannot give them a
  // srcset — it rewrites `url(...)` to the largest generated size instead, which
  // is the same thing page-banner.ts does for a banner. CSS cannot choose a
  // width, so there is one size to give it.
  return html.slice(0, at.start) + open + responsive(rendered, map) + '</div>' + html.slice(at.end)
}
