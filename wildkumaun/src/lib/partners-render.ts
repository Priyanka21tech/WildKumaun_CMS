import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { PARTNER_TARGETS, targetFor } from './sections'
import type { MediaMap } from './media-map'
import { asMedia, column, img, renderHeadingSection, responsive, widget } from './widgets'
import type { MediaDoc } from './widgets'

/**
 * Put a partners block's logos on the page.
 *
 * A plain row of image widgets — the origin makes each a column of
 * `elementor-col-12`, eight to a row. It is not a carousel, despite sitting where
 * one would; the logos are simply laid out and wrap.
 *
 * The origin wraps each logo in a lightbox anchor pointing at the full-size
 * image, which is a strange thing to do to a logo and does nothing here anyway
 * since Elementor's lightbox script is not loaded. Where a partner has a `url`
 * the logo links there instead, which is what a partner logo is usually for; with
 * no url it is just an image, as the page effectively shows today.
 *
 * `name` is not rendered as text — the origin shows logos alone — but it becomes
 * the image's alt text, which is the accessible version of the same information.
 */

type PartnerRow = {
  image?: unknown
  name?: string | null
  url?: string | null
}

export type PartnersBlockValue = {
  target?: string | null
  heading?: string | null
  logos?: PartnerRow[] | null
}

export function replacePartners(html: string, block: PartnersBlockValue, map: MediaMap): string {
  const target = targetFor(PARTNER_TARGETS, block.target)
  if (!target?.item?.image) return html

  const logos = (block.logos ?? []).filter((row) => asMedia(row.image)?.filename)
  if (!logos.length) return html

  const withHeading = renderHeadingSection(html, target, block.heading)

  const columns = logos
    .map((row) => {
      const media = asMedia(row.image) as MediaDoc
      // The partner's name is the better alt text than whatever the file was
      // uploaded with, so it wins where there is one.
      const withAlt: MediaDoc = { ...media, alt: row.name || media.alt || '' }

      const image = img(withAlt)
      const inner = row.url
        ? `<a href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">${image}</a>`
        : image

      // All eight logo columns carry an identical rule, so all render under the first.
      return column(target.span, widget(target.item!.image!, 'image', inner), target.columns?.[0])
    })
    .join('')

  return replaceContainer(withHeading, target.section, responsive(columns, map))
}
