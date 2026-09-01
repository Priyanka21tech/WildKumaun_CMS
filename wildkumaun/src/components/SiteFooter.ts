import { resolveHref, resolveLabel, type LinkValue } from '../fields/link'
import { esc, type Phone } from './SiteHeader'

/**
 * The footer, built from the Footer and Site Settings globals.
 *
 * An HTML string for the same reason as the header — see SiteHeader.ts.
 *
 * Three columns on the live site: phone numbers, an email address, and the
 * address linking out to the map. Each is a heading widget, which is why the
 * markup is `<h2>`/`<h4>` rather than a list — the stylesheet targets those
 * headings through the `elementor-element-<hash>` classes, so they stay.
 *
 * The numbers, the address and the email are not configured in the Footer global.
 * They come from Site Settings, so editing a phone number in one place changes it
 * in the header, in the footer and anywhere else it appears. Footer only decides
 * whether each block is shown.
 *
 * The origin's heading levels are inconsistent — h2, h4, h2 across the three
 * columns — and that is reproduced rather than corrected, because the styling
 * follows the tag.
 */

export type FooterData = {
  showPhones?: boolean | null
  showEmail?: boolean | null
  showAddress?: boolean | null
  columns?: Array<{
    heading?: string | null
    links?: Array<{ link?: LinkValue | null }> | null
  }> | null
  legal?: string | null
}

export type FooterSettings = {
  email?: string | null
  phones?: Phone[] | null
  address?: {
    short?: string | null
    mapUrl?: string | null
  } | null
}

/** One of the three contact columns, each a heading widget in its own column. */
const column = (columnId: string, widgetId: string, inner: string): string =>
  `<div class="elementor-column elementor-col-33 elementor-top-column elementor-element elementor-element-${columnId}" data-element_type="column" data-id="${columnId}">
<div class="elementor-widget-wrap elementor-element-populated">
<div class="elementor-element elementor-element-${widgetId} elementor-widget elementor-widget-heading" data-element_type="widget" data-id="${widgetId}" data-widget_type="heading.default">
<div class="elementor-widget-container">
${inner} </div>
</div>
</div>
</div>`

export function renderSiteFooter({
  settings,
  footer,
}: {
  settings: FooterSettings
  footer: FooterData
}): string {
  const phones = (settings.phones ?? []).filter((p) => p.showInFooter && p.number)
  const address = settings.address
  const columns = footer.columns ?? []

  const showPhones = footer.showPhones !== false && phones.length > 0
  const showEmail = footer.showEmail !== false && Boolean(settings.email)
  const showAddress = footer.showAddress !== false && Boolean(address?.short)

  const phoneBlock = showPhones
    ? column(
        '48ff1bb',
        '9cf3193',
        `<h2 class="elementor-heading-title elementor-size-default">Mob. - ${esc(
          phones.map((p) => p.number).join(', '),
        )}</h2>`,
      )
    : ''

  const emailBlock = showEmail
    ? column(
        '2927fe2',
        'be930eb',
        `<h4 class="elementor-heading-title elementor-size-default">Email. ${esc(settings.email)}</h4>`,
      )
    : ''

  const addressText = `Address: ${esc(address?.short)}`
  const addressBlock = showAddress
    ? column(
        '4184824',
        '90c5ac9',
        `<h2 class="elementor-heading-title elementor-size-default">${
          address?.mapUrl
            ? `<a href="${esc(address.mapUrl)}" target="_blank" rel="noreferrer">${addressText}</a>`
            : addressText
        }</h2>`,
      )
    : ''

  const linkColumns = columns.length
    ? `<section class="elementor-section elementor-top-section elementor-element elementor-section-boxed elementor-section-height-default" data-element_type="section">
<div class="elementor-container elementor-column-gap-default">
${columns
  .map(
    (col) =>
      `<div class="elementor-column elementor-top-column elementor-element" data-element_type="column">
<div class="elementor-widget-wrap elementor-element-populated">
${col.heading ? `<h4 class="elementor-heading-title elementor-size-default">${esc(col.heading)}</h4>` : ''}
<ul class="elementor-icon-list-items">
${(col.links ?? [])
  .map((entry) => {
    const target = entry.link?.newTab ? ' target="_blank" rel="noreferrer"' : ''
    return `<li class="elementor-icon-list-item"><a href="${esc(resolveHref(entry.link))}"${target}>${esc(
      resolveLabel(entry.link),
    )}</a></li>`
  })
  .join('\n')}
</ul>
</div>
</div>`,
  )
  .join('\n')}
</div>
</section>`
    : ''

  const legal = footer.legal
    ? `<section class="elementor-section elementor-top-section elementor-element elementor-section-boxed elementor-section-height-default" data-element_type="section">
<div class="elementor-container elementor-column-gap-default">
<div class="elementor-column elementor-col-100 elementor-top-column elementor-element" data-element_type="column">
<div class="elementor-widget-wrap elementor-element-populated">
<p class="elementor-heading-title elementor-size-default">&copy; ${new Date().getFullYear()} ${esc(
        footer.legal,
      )}</p>
</div>
</div>
</div>
</section>`
    : ''

  return `<footer id="colophon" itemscope="itemscope" itemtype="https://schema.org/WPFooter" role="contentinfo">
<div class="footer-width-fixer"> <div class="elementor elementor-1640" data-elementor-id="1640" data-elementor-type="wp-post">
<section class="elementor-section elementor-top-section elementor-element elementor-element-748d285 elementor-section-boxed elementor-section-height-default elementor-section-height-default" data-element_type="section" data-id="748d285">
<div class="elementor-container elementor-column-gap-default">
${phoneBlock}
${emailBlock}
${addressBlock}
</div>
</section>
${linkColumns}
${legal}
</div>
</div>
</footer>`
}
