import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { resolveHref, resolveLabel, type LinkValue } from '../fields/link'
import { GALLERY_TARGETS, targetFor, type SectionTarget } from './sections'
import type { MediaMap } from './media-map'
import { asMedia, column, img, imageWidget, renderHeadingSection, responsive, widget } from './widgets'
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
  columns?: number | null
  slidesToShow?: number | null
  showButton?: boolean | null
  button?: LinkValue | null
  images?: (number | MediaDoc)[] | null
}

/**
 * The heading the origin put inside the section itself.
 *
 * Empty on the pages that give a heading its own section — there
 * renderHeadingSection draws it, and doing both would show it twice. The gallery
 * index is the exception: it stacks a heading, a run of thumbnails and a button
 * into one section, and a section can only belong to one block.
 */
const inlineHeading = (target: SectionTarget, block: GalleryBlockValue): string =>
  target.item?.label && block.heading
    ? widget(
        target.item.label,
        'heading',
        `<h2 class="elementor-heading-title elementor-size-default">${esc(block.heading)}</h2>`,
      )
    : ''

/** The "Explore More" button under a preview, where the target has room for one. */
function inlineButton(target: SectionTarget, block: GalleryBlockValue): string {
  const hash = target.item?.button
  const label = block.showButton ? resolveLabel(block.button) : ''
  if (!hash || !label) return ''

  return widget(
    hash,
    'button',
    `<div class="elementor-button-wrapper"><a class="elementor-button elementor-button-link elementor-size-sm elementor-animation-shrink" href="${esc(resolveHref(block.button))}"><span class="elementor-button-content-wrapper"><span class="elementor-button-icon elementor-align-icon-right"><i aria-hidden="true" class="fas fa-long-arrow-alt-right"></i></span><span class="elementor-button-text">${esc(label)}</span></span></a></div>`,
    'elementor-align-center elementor-tablet-align-center elementor-mobile-align-center',
  )
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

  const before = inlineHeading(target, block)
  const after = inlineButton(target, block)

  if (block.display === 'gallery') {
    return replaceContainer(
      withHeading,
      target.section,
      responsive(
        column(
          target.span,
          before + thumbnails(target.item.image, images, block.columns ?? 4) + after,
          target.columns?.[0],
        ),
        map,
      ),
    )
  }

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
      : column(
          target.span,
          before + carousel(target.item.image, images, block.slidesToShow ?? 4) + after,
          target.columns?.[0],
        )

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

/**
 * WordPress's own gallery: square thumbnails, each captioned with its own name.
 *
 * `aria-describedby` ties a picture to the caption beneath it, which is what
 * makes the caption readable to a screen reader as a description rather than as
 * a stray line of text. The ids only have to be unique on the page, so they are
 * numbered from the widget rather than carrying the origin's WordPress post ids,
 * which mean nothing here.
 *
 * The lightbox anchors are dropped for the same reason as in the carousel: they
 * carry a base64 blob pointing at wildkumaon.com, and Elementor's lightbox script
 * is not loaded, so they would take a reader off the site for nothing.
 */
function thumbnails(hash: string, images: MediaDoc[], columns: number): string {
  const items = images
    .map((image, index) => {
      const id = `gallery-${hash}-${index + 1}`
      const alt = image.alt ?? ''
      const caption = alt || image.filename?.replace(/\.[a-z0-9]+$/i, '') || ''

      /**
       * The image keeps its own alt — WCAG 1.1.1.
       *
       * This used to pass `alt: ''` and put the words in the caption instead,
       * pointing at them with aria-describedby. The intent was to say the name
       * once rather than twice, but an empty alt does not mean "described
       * elsewhere" — it means "decorative, ignore this", and a decorative element
       * is exactly the one browsers drop aria-describedby from. So the
       * description reached nobody, and axe reported it 104 times across the four
       * gallery pages as presentation-role-conflict.
       *
       * The describedby stays only where the caption adds something the alt does
       * not. When they are the same words — which is the usual case, since the
       * caption falls back to the alt — repeating them is the duplication this
       * was trying to avoid in the first place.
       */
      const describedBy = caption && caption !== alt ? ` aria-describedby="${id}"` : ''

      /**
       * The caption is hidden from assistive technology when it repeats the alt.
       *
       * Removing aria-describedby stopped the image pointing at the caption, but
       * the caption is still text on the page, so a screen reader reading through
       * announced the species twice — once as the image, once as the words under
       * it. Heard aloud that is not a tidy repetition; it is the same four
       * syllables back to back, on every photograph of a forty-six photograph
       * page.
       *
       * Hidden rather than emptied, and the alt kept rather than blanked, because
       * of how the two are reached. Pressing G in a screen reader walks the
       * images, and an image with an empty alt is not in that list — on a gallery
       * that is the one thing a reader is most likely to do. So the image keeps
       * the name and the duplicate is the one that goes quiet.
       *
       * Only when they are identical. A caption that says something the alt does
       * not is still read, and still pointed at by aria-describedby above.
       */
      const captionHidden = caption === alt ? ' aria-hidden="true"' : ''

      return `<figure class="gallery-item">
<div class="gallery-icon landscape">${img(image, 'attachment-full size-full').replace('<img', `<img${describedBy}`)}</div>
<figcaption class="wp-caption-text gallery-caption" id="${id}"${captionHidden}>${esc(caption)}</figcaption>
</figure>`
    })
    .join('')

  return `<div class="elementor-element elementor-element-${hash} gallery-spacing-custom elementor-widget elementor-widget-image-gallery" data-element_type="widget" data-id="${hash}" data-widget_type="image-gallery.default">
<div class="elementor-widget-container">
<div class="elementor-image-gallery">
<div class="gallery gallery-columns-${columns} gallery-size-full" id="gallery-${hash}">${items}</div>
</div>
</div>
</div>`
}

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
