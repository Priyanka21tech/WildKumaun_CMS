import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { AMENITY_TARGETS, targetFor } from './sections'
import type { MediaMap } from './media-map'
import {
  asMedia,
  column,
  headingWidget,
  imageWidget,
  renderHeadingSection,
  responsive,
  textWidget,
} from './widgets'

/**
 * Put an amenities block's items on the page.
 *
 * Three shapes, because the origin shows the same kind of list three ways:
 *
 *   icon-grid   seven small transparent icons to a row, label beneath
 *   photo-grid  three 400px photographs to a row, label pulled up over the image
 *   list        one photograph beside a bulleted list, no icons at all
 *
 * The difference is entirely presentation — the labels and pictures are the same
 * documents — which is why `display` is a field on the block rather than three
 * blocks or three collections.
 *
 * The list shape ignores each amenity's icon on purpose. /facilities has never
 * shown one, and quietly introducing icons there because the documents happen to
 * carry them would change a page nobody asked to change.
 */

type AmenityDoc = {
  label?: string | null
  icon?: unknown
}

export type AmenitiesBlockValue = {
  target?: string | null
  heading?: string | null
  subtitle?: string | null
  display?: string | null
  image?: unknown
  items?: (number | AmenityDoc)[] | null
}

/** The items that arrived populated. An id on its own has no label to render. */
const populated = (items: AmenitiesBlockValue['items']): AmenityDoc[] =>
  (items ?? []).filter((item): item is AmenityDoc => typeof item === 'object' && item !== null)

export function replaceAmenities(
  html: string,
  block: AmenitiesBlockValue,
  map: MediaMap,
): string {
  const target = targetFor(AMENITY_TARGETS, block.target)
  if (!target?.item) return html

  const items = populated(block.items)
  if (!items.length) return html

  const withHeading = renderHeadingSection(html, target, block.heading, block.subtitle)

  const columns =
    block.display === 'list'
      ? listColumns(block, items, target.item, target.columns)
      : gridColumns(items, target.span, target.item, target.columns)

  return replaceContainer(withHeading, target.section, responsive(columns, map))
}

/** One column per amenity: its picture, then its name. */
function gridColumns(
  items: AmenityDoc[],
  span: number,
  hashes: { image?: string; label?: string },
  columns?: string[],
): string {
  return items
    .map((item) => {
      const icon = asMedia(item.icon)
      const parts = [
        icon && hashes.image ? imageWidget(hashes.image, icon) : '',
        hashes.label && item.label ? headingWidget(hashes.label, item.label) : '',
      ].join('')

      // One id for the whole row: every column in it carries the same rule.
      return column(span, parts, columns?.[0])
    })
    .join('')
}

/** A photograph in one half, the names as a bulleted list in the other. */
function listColumns(
  block: AmenitiesBlockValue,
  items: AmenityDoc[],
  hashes: { image?: string; text?: string },
  columns?: string[],
): string {
  const photo = asMedia(block.image)

  const list = `<ul>${items
    .map((item) => `<li>${esc(item.label ?? '')}</li>`)
    .join('')}</ul>`

  return (
    column(50, photo && hashes.image ? imageWidget(hashes.image, photo) : '', columns?.[0]) +
    column(50, hashes.text ? textWidget(hashes.text, list) : list, columns?.[1])
  )
}
