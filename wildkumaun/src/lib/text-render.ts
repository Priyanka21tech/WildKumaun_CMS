import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from 'lexical'
import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { resolveHref, resolveLabel, type LinkValue } from '../fields/link'
import { TEXT_TARGETS, targetFor } from './sections'
import type { MediaMap } from './media-map'
import { asMedia, column, img, responsive, widget, widgetCss } from './widgets'
import type { MediaDoc } from './widgets'

/**
 * Put a text block's copy on the page.
 *
 * Two shapes, decided by the target rather than by a field: full width, or the
 * right-hand half of a split row. Which one a section is was settled by the
 * origin's layout and is not the editor's to change — moving the "Be a free bird"
 * copy to full width would not be an edit, it would be a redesign, and the
 * stylesheet behind that section does not describe one.
 *
 * The left half of a split row takes the block's images as a carousel where
 * there are any, and is left empty where there are none — which is what the
 * origin does on the call to action.
 */

export type TextBlockValue = {
  target?: string | null
  heading?: string | null
  body?: SerializedEditorState | null
  images?: (number | MediaDoc)[] | null
  showButton?: boolean | null
  button?: LinkValue | null
}

export function replaceText(html: string, block: TextBlockValue, map: MediaMap): string {
  const target = targetFor(TEXT_TARGETS, block.target)
  if (!target?.item) return html

  const hashes = target.item

  const body = block.body
    ? convertLexicalToHTML({ data: block.body, disableContainer: true })
    : ''

  const parts = [
    widgetCss(target.css),
    hashes.label && block.heading ? headingWidget(hashes.label, block.heading) : '',
    hashes.text && body ? widget(hashes.text, 'text-editor', body) : '',
    hashes.button && block.showButton ? buttonWidget(hashes.button, block.button) : '',
  ].join('')

  // Full width is one column holding everything.
  if (target.span === 100) {
    return replaceContainer(html, target.section, responsive(column(100, parts, target.columns?.[0]), map))
  }

  const images = (block.images ?? [])
    .map((image) => asMedia(image))
    .filter((image): image is MediaDoc => Boolean(image?.filename))

  const left = images.length && hashes.image ? carousel(hashes.image, images) : ''

  return replaceContainer(
    html,
    target.section,
    responsive(column(50, left, target.columns?.[0]) + column(50, parts, target.columns?.[1]), map),
  )
}

const headingWidget = (hash: string, text: string): string =>
  widget(
    hash,
    'heading',
    `<h2 class="elementor-heading-title elementor-size-default">${esc(text)}</h2>`,
  )

/**
 * The button beneath the copy.
 *
 * The same markup the package cards use, minus the arrow icon — the origin puts
 * one on a card and not here, and the difference is visible.
 */
function buttonWidget(hash: string, value?: LinkValue | null): string {
  const label = resolveLabel(value)
  if (!label) return ''

  const href = resolveHref(value)
  const newTab = value?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''

  return widget(
    hash,
    'button',
    `<div class="elementor-button-wrapper"><a class="elementor-button elementor-button-link elementor-size-sm" href="${esc(href)}"${newTab}><span class="elementor-button-content-wrapper"><span class="elementor-button-text">${esc(label)}</span></span></a></div>`,
  )
}

/**
 * The small carousel that fills the other half of a split row.
 *
 * One slide at a time rather than the gallery's four: it sits in half a row, and
 * Enhancements.jsx reads `slides_to_show` off this element to decide.
 */
function carousel(hash: string, images: MediaDoc[]): string {
  const slides = images
    .map(
      (image, index) =>
        `<div aria-label="${index + 1} of ${images.length}" aria-roledescription="slide" class="swiper-slide" role="group"><figure class="swiper-slide-inner">${img(image, 'swiper-slide-image')}</figure></div>`,
    )
    .join('')

  const settings = JSON.stringify({
    slides_to_show: '1',
    navigation: 'arrows',
    autoplay: 'yes',
    pause_on_hover: 'yes',
    autoplay_speed: 5000,
    infinite: 'yes',
    speed: 500,
  })

  return `<div class="elementor-element elementor-element-${hash} elementor-arrows-position-inside elementor-widget elementor-widget-image-carousel" data-element_type="widget" data-id="${hash}" data-settings='${esc(settings)}' data-widget_type="image-carousel.default">
<div class="elementor-widget-container">
<div class="elementor-image-carousel-wrapper swiper-container" dir="ltr">
<div aria-live="off" class="elementor-image-carousel swiper-wrapper">${slides}</div>
<div class="elementor-swiper-button elementor-swiper-button-prev" role="button" tabindex="0"><i aria-hidden="true" class="eicon-chevron-left"></i></div>
<div class="elementor-swiper-button elementor-swiper-button-next" role="button" tabindex="0"><i aria-hidden="true" class="eicon-chevron-right"></i></div>
</div>
</div>
</div>`
}
