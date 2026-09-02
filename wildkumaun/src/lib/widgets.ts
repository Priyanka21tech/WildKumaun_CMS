import { esc } from '../components/SiteHeader'
import { withResponsiveImages } from './responsive-html'
import type { MediaMap } from './media-map'
import { replaceContainer, replaceSection } from './elementor'
import type { SectionTarget } from './sections'

/**
 * The Elementor markup a block emits.
 *
 * Every block builds the same handful of shapes — a column, an image widget, a
 * heading widget — so they are written once here rather than four times in four
 * renderers with four chances to leave a class off. Elementor's stylesheet keys
 * on these class names, so a widget that is nearly right is a widget that is
 * unstyled.
 *
 * Each builder takes the widget hash to use rather than owning one. The hash is
 * how Elementor scopes a rule to one widget, and the right hash differs by where
 * the block sits — the label under an amenity icon is 16px dark on the home
 * page's icon row and 21px white overlaid on the photograph in the row beneath
 * it. src/lib/sections.ts holds which hash belongs to which target.
 *
 * One hash is reused for every item in a run, rather than the row of distinct
 * hashes the origin generated. Those exist so Elementor can style each item
 * separately and here every rule behind them is identical — so one class means
 * one rule covers however many items there are, instead of a seventh item
 * arriving unstyled because the origin only ever made six.
 */

/** A populated upload field. Enough of a Media doc to render it. */
export type MediaDoc = {
  filename?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

/** The doc, or null when the field holds only an id — depth was too shallow. */
export const asMedia = (value: unknown): MediaDoc | null =>
  value && typeof value === 'object' ? (value as MediaDoc) : null

/**
 * An `<img>` pointing at the file as the mirror would.
 *
 * `/media/<filename>` rather than the doc's own `url`, which is Payload's
 * `/api/media/file/...` route. Both serve the same bytes, but only the static
 * path is what src/lib/media-map.ts keys on, so only that one can be given a
 * srcset afterwards.
 */
export function img(media: MediaDoc, className = ''): string {
  if (!media.filename) return ''

  const classAttr = className ? ` class="${className}"` : ''
  const size =
    media.width && media.height ? ` width="${media.width}" height="${media.height}"` : ''

  return `<img${classAttr} src="/media/${esc(media.filename)}" alt="${esc(media.alt ?? '')}" decoding="async" loading="lazy"${size}/>`
}

/** The wrapper Elementor puts round every widget. */
export const widget = (hash: string, type: string, inner: string, extraClass = ''): string =>
  `<div class="elementor-element elementor-element-${hash}${extraClass ? ` ${extraClass}` : ''} elementor-widget elementor-widget-${type}" data-element_type="widget" data-id="${hash}" data-widget_type="${type}.default">
<div class="elementor-widget-container">${inner}</div>
</div>`

export const imageWidget = (hash: string, media: MediaDoc, imgClass = ''): string =>
  widget(hash, 'image', img(media, imgClass))

export const headingWidget = (hash: string, text: string, level: 'h2' | 'h4' = 'h2'): string =>
  widget(
    hash,
    'heading',
    `<${level} class="elementor-heading-title elementor-size-default">${esc(text)}</${level}>`,
  )

export const textWidget = (hash: string, html: string): string =>
  widget(hash, 'text-editor', html)

/**
 * One of the columns inside a section's container.
 *
 * `id` matters as much as it does on a widget. Elementor writes column rules the
 * same way it writes widget rules — a background, a border, a padding, a vertical
 * alignment, all scoped to `elementor-element-<id>` — so a column rendered
 * without one is a column with none of its styling. See `columns` in
 * src/lib/sections.ts.
 */
export const column = (span: number, inner: string, id?: string): string => {
  const identity = id ? ` elementor-element-${id}" data-id="${id}` : ''

  return `<div class="elementor-column elementor-col-${span} elementor-top-column elementor-element${identity}" data-element_type="column">
<div class="elementor-widget-wrap elementor-element-populated">${inner}</div>
</div>`
}

/**
 * Point a block's own images at the sizes Payload generated.
 *
 * The page-wide pass in src/lib/responsive-html.ts runs before the blocks are
 * applied, so it never sees this markup. Rather than have every renderer build a
 * srcset by hand, each one runs the same rewrite over what it just produced —
 * which also inherits that pass's judgement about when *not* to retarget an
 * image, the one that leaves a 50px amenity icon alone instead of swapping it
 * for something smaller.
 */
export const responsive = (markup: string, map: MediaMap): string =>
  withResponsiveImages(markup, map)

/**
 * The origin's inline typography, as a rule per widget.
 *
 * Emitted next to the markup it styles rather than added to public/wp/site.css,
 * which is the mirror's and is not ours to edit — the same reasoning the
 * testimonials slider's styles are written under.
 *
 * Both the widget and the paragraphs inside it are targeted: `text-align` has to
 * land on the paragraph, and the font has to reach the `<span>` the origin
 * wrapped its words in, which no longer exists.
 */
export function widgetCss(css?: Record<string, string>): string {
  if (!css) return ''

  const rules = Object.entries(css)
    .map(([key, declarations]) => {
      const [hash, descendant] = key.split(' ')
      const el = `.elementor-element.elementor-element-${hash}`
      // A key naming a descendant styles only that; otherwise the widget and the
      // text inside it, since the origin's `<span>` wrapper is gone.
      const selector = descendant ? `${el} ${descendant}` : `${el}, ${el} p, ${el} span`
      return `${selector}{${declarations}}`
    })
    .join('')

  return rules ? `<style>${rules}</style>` : ''
}

/**
 * Render the heading the origin put in its own section above the block.
 *
 * A target with no `heading` has no such section — the two photo rows on the home
 * page sit under the icon row's heading — and then this does nothing, including
 * when the block carries heading text. Somewhere to put it is what makes a
 * heading renderable, not somebody having typed one.
 *
 * An empty heading removes the section rather than leaving the origin's words,
 * which is the same contract the banner field has: a field you can empty and see
 * no change is not a field you control.
 */
export function renderHeadingSection(
  html: string,
  target: SectionTarget,
  heading?: string | null,
  subtitle?: string | null,
): string {
  if (!target.heading || !target.headingWidget) return html

  if (!heading && !subtitle) return replaceSection(html, target.heading, '')

  const parts = [
    heading ? headingWidget(target.headingWidget, heading) : '',
    subtitle && target.subtitleWidget
      ? widgetCss(target.css) + textWidget(target.subtitleWidget, `<p>${esc(subtitle)}</p>`)
      : '',
  ].join('')

  return replaceContainer(html, target.heading, column(100, parts, target.headingColumn))
}
