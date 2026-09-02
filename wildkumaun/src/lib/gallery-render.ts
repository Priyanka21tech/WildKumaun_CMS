import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { GALLERY_TARGETS, targetFor } from './sections'
import type { MediaMap } from './media-map'
import { asMedia, column, img, imageWidget, renderHeadingSection, responsive } from './widgets'
import type { MediaDoc } from './widgets'

/**
 * Put a gallery block's photographs on the page.
 *
 * The carousel is rebuilt as Elementor's image-carousel widget rather than as
 * something of our own, because src/components/Enhancements.jsx drives the
 * rotation by reading `data-settings` off that widget and taking the track's
 * children as slides. Emitting the same widget means the block's settings reach
 * the existing carousel engine without a line of it changing — the settings move
 * into the CMS, the engine stays where it is. Rewriting the engine is a separate
 * job and a much riskier one.
 *
 * The lightbox is deliberately dropped. The origin wraps each slide in an anchor
 * carrying a base64 blob of the *original* WordPress URL, which points at
 * wildkumaon.com — so those links leave the site. Nothing in the mirror opens a
 * lightbox anyway; the script that did was Elementor's, and it is not loaded.
 * A plain image is what the page actually shows today.
 */

export type GalleryBlockValue = {
  target?: string | null
  heading?: string | null
  display?: string | null
  slidesToShow?: number | null
  images?: (number | MediaDoc)[] | null
}

const populated = (images: GalleryBlockValue['images']): MediaDoc[] =>
  (images ?? [])
    .map((image) => asMedia(image))
    .filter((image): image is MediaDoc => image !== null && Boolean(image.filename))

export function replaceGallery(html: string, block: GalleryBlockValue, map: MediaMap): string {
  const target = targetFor(GALLERY_TARGETS, block.target)
  if (!target?.item?.image) return html

  const images = populated(block.images)
  if (!images.length) return html

  const withHeading = renderHeadingSection(html, target, block.heading)

  const inner =
    block.display === 'grid'
      ? images
          .map((image, index) =>
            column(
              target.span,
              // Per-item hashes where the origin styled its pictures differently;
              // otherwise one hash for all, as with every other repeating run.
              imageWidget(target.itemWidgets?.[index] ?? target.item!.image!, image),
              target.columns?.[index] ?? target.columns?.[0],
            ),
          )
          .join('')
      : column(100, carousel(target.item.image, images, block.slidesToShow ?? 4), target.columns?.[0])

  return replaceContainer(withHeading, target.section, responsive(inner, map))
}

/**
 * The settings the carousel engine reads.
 *
 * Only the desktop count is a field. The two narrower breakpoints are derived
 * here — Enhancements.jsx already halves to a maximum of two on tablet and one on
 * mobile, which is Elementor's own default for this widget — so a gallery is one
 * number to fill in rather than three, and three chances to get one wrong.
 */
const settings = (slidesToShow: number): string =>
  JSON.stringify({
    slides_to_show: String(slidesToShow),
    navigation: 'arrows',
    autoplay: 'yes',
    pause_on_hover: 'yes',
    pause_on_interaction: 'yes',
    autoplay_speed: 5000,
    infinite: 'yes',
    speed: 500,
    image_spacing_custom: { unit: 'px', size: 20, sizes: [] },
  })

function carousel(hash: string, images: MediaDoc[], slidesToShow: number): string {
  const slides = images
    .map(
      (image, index) =>
        `<div aria-label="${index + 1} of ${images.length}" aria-roledescription="slide" class="swiper-slide" role="group"><figure class="swiper-slide-inner">${img(image, 'swiper-slide-image')}</figure></div>`,
    )
    .join('')

  // Single quotes round data-settings, because the value is JSON full of double
  // quotes — which is how the origin writes it too.
  return `<div class="elementor-element elementor-element-${hash} elementor-arrows-position-inside elementor-widget elementor-widget-image-carousel" data-element_type="widget" data-id="${hash}" data-settings='${esc(settings(slidesToShow))}' data-widget_type="image-carousel.default">
<div class="elementor-widget-container">
<div class="elementor-image-carousel-wrapper swiper-container" dir="ltr">
<div aria-live="off" class="elementor-image-carousel swiper-wrapper">${slides}</div>
<div class="elementor-swiper-button elementor-swiper-button-prev" role="button" tabindex="0"><i aria-hidden="true" class="eicon-chevron-left"></i></div>
<div class="elementor-swiper-button elementor-swiper-button-next" role="button" tabindex="0"><i aria-hidden="true" class="eicon-chevron-right"></i></div>
</div>
</div>
</div>`
}
