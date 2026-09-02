import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { resolveHref, resolveLabel, type LinkValue } from '../fields/link'
import { PACKAGE_TARGETS, targetFor } from './sections'
import type { MediaMap } from './media-map'
import { asMedia, column, imageWidget, renderHeadingSection, responsive, widget } from './widgets'

/**
 * Put a packages block's cards on the page.
 *
 * The origin lays the four cards out as two half-width columns with two cards
 * stacked in each, not as four columns in a row — so the cards are split down
 * the middle rather than spread across. An odd number leaves the extra card in
 * the first column, which is what stacking two per column means.
 *
 * Each card is an Elementor inner section. That nesting is not decoration: the
 * card's background colour is set on the inner section, so a card rendered as a
 * plain div would come out unstyled.
 *
 * The button's href comes from the shared link field, so a card that today jumps
 * to the enquiry anchor can be pointed at a page without this file changing.
 */

type PackageDoc = {
  title?: string | null
  blurb?: string | null
  image?: unknown
  link?: LinkValue | null
}

export type PackagesBlockValue = {
  target?: string | null
  heading?: string | null
  items?: (number | PackageDoc)[] | null
}

/** The inner section one card sits in, carrying the card's background. */
const CARD_SECTION = 'e501809'
const CARD_COLUMN = '5bbb555'

const populated = (items: PackagesBlockValue['items']): PackageDoc[] =>
  (items ?? []).filter((item): item is PackageDoc => typeof item === 'object' && item !== null)

export function replacePackages(html: string, block: PackagesBlockValue, map: MediaMap): string {
  const target = targetFor(PACKAGE_TARGETS, block.target)
  if (!target?.item) return html

  const items = populated(block.items)
  if (!items.length) return html

  const withHeading = renderHeadingSection(html, target, block.heading)

  // Half in each column, rounding up, so two cards sit in the left column before
  // any appear in the right.
  const half = Math.ceil(items.length / 2)
  const columns = [items.slice(0, half), items.slice(half)]
    .map((group, index) =>
      group.length
        ? outerColumn(
            group.map((item) => card(item, target.item!)).join(''),
            target.columns?.[index],
          )
        : '',
    )
    .join('')

  return replaceContainer(withHeading, target.section, responsive(columns, map))
}

/**
 * One of the two half-width columns the cards stack inside.
 *
 * The two are not interchangeable — the origin sets a margin on the left one and
 * a different width breakpoint on the right — so each renders under its own id.
 */
const outerColumn = (inner: string, id?: string): string =>
  column(50, inner, id)

function card(item: PackageDoc, hashes: { label?: string; image?: string; text?: string; button?: string }): string {
  const image = asMedia(item.image)

  const inner = [
    hashes.label && item.title
      ? widget(
          hashes.label,
          'heading',
          `<h4 class="elementor-heading-title elementor-size-default">${esc(item.title)}</h4>`,
        )
      : '',
    image && hashes.image ? imageWidget(hashes.image, image) : '',
    hashes.text && item.blurb
      ? widget(hashes.text, 'text-editor', `<p style="text-align: justify;">${esc(item.blurb)}</p>`)
      : '',
    hashes.button ? button(hashes.button, item.link) : '',
  ].join('')

  return `<section class="elementor-section elementor-inner-section elementor-element elementor-element-${CARD_SECTION} elementor-section-content-middle elementor-section-boxed elementor-section-height-default elementor-section-height-default" data-element_type="section" data-id="${CARD_SECTION}" data-settings='{"background_background":"classic"}'>
<div class="elementor-container elementor-column-gap-default">
<div class="elementor-column elementor-col-100 elementor-inner-column elementor-element elementor-element-${CARD_COLUMN}" data-element_type="column" data-id="${CARD_COLUMN}">
<div class="elementor-widget-wrap elementor-element-populated">${inner}</div>
</div>
</div>
</section>`
}

/**
 * The card's call to action.
 *
 * The alignment classes are on the widget rather than in the stylesheet because
 * that is where the origin put them, and the arrow icon is part of the button's
 * content rather than a background image.
 */
function button(hash: string, link?: LinkValue | null): string {
  const label = resolveLabel(link) || 'Enquiry'
  const href = resolveHref(link)
  const newTab = link?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''

  const inner = `<div class="elementor-button-wrapper"><a class="elementor-button elementor-button-link elementor-size-sm elementor-animation-shrink" href="${esc(href)}"${newTab}><span class="elementor-button-content-wrapper"><span class="elementor-button-icon elementor-align-icon-right"><i aria-hidden="true" class="fas fa-long-arrow-alt-right"></i></span><span class="elementor-button-text"> ${esc(label)}</span></span></a></div>`

  return widget(
    hash,
    'button',
    inner,
    'elementor-mobile-align-center elementor-tablet-align-center elementor-align-center',
  )
}
