import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { MAP_TARGETS, targetFor } from './sections'
import { column, widget } from './widgets'

/**
 * Put the map on the page.
 *
 * The embed address is built here rather than stored, so the block holds a place
 * and a zoom instead of a URL nobody should have to edit — and so nothing but
 * Google's own map can end up in the frame. `encodeURIComponent` is what makes
 * that true: the query cannot break out of its parameter.
 *
 * `loading="lazy"` matters more than usual here. The map sits below the fold on
 * a page whose point is the form above it, and an eager iframe would have the
 * browser fetching Google's map before it has finished the page the reader
 * actually came for.
 */

export type MapBlockValue = {
  target?: string | null
  query?: string | null
  zoom?: number | null
  label?: string | null
}

export function replaceMap(html: string, block: MapBlockValue): string {
  const target = targetFor(MAP_TARGETS, block.target)
  if (!target?.item?.image || !block.query) return html

  const label = block.label || block.query
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(block.query)}&t=m&z=${block.zoom ?? 10}&output=embed&iwloc=near`

  const embed = `<div class="elementor-custom-embed"><iframe aria-label="${esc(label)}" loading="lazy" src="${esc(src)}" title="${esc(label)}"></iframe></div>`

  return replaceContainer(
    html,
    target.section,
    column(target.span, widget(target.item.image, 'google_maps', embed), target.columns?.[0]),
  )
}
