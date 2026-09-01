import { resolveHref, type LinkValue } from '../fields/link'

/**
 * The header, built from the Header and Site Settings globals.
 *
 * This returns an HTML string rather than JSX. The header has to be spliced into
 * the middle of the mirrored page — see src/lib/shell.ts for why it cannot be a
 * React sibling of it — and the App Router refuses to load `react-dom/server`
 * anywhere in a page's import graph, so there is no way to turn a component into
 * markup at request time. Nothing here is interactive, so a string costs nothing:
 * JSX would only have been rendered straight to one anyway.
 *
 * The class names are the origin's, kept exactly. Every `elementor-element-<hash>`
 * class has a rule behind it in wp/site.css — that is where the header's layout,
 * colours and spacing live, so the markup has to present the same hooks or the
 * header loses its styling entirely. The hashes are meaningless as names; treat
 * them as the selectors they are.
 *
 * What is dropped: the `id="menu-item-5022"` attributes WordPress emitted. Nothing
 * in the stylesheet selects them, and they were database ids from a site we no
 * longer run.
 *
 * What is fixed on the way through: the live header's first phone link points at
 * tel:+918279836947 while displaying +919520017658 — two different numbers. Here
 * the link is derived from the number being shown, so they cannot disagree.
 */

export type Phone = {
  number?: string | null
  label?: string | null
  showInHeader?: boolean | null
  showInFooter?: boolean | null
}

export type NavItem = {
  link?: LinkValue | null
  children?: Array<{ link?: LinkValue | null }> | null
}

export type HeaderData = {
  nav?: NavItem[] | null
  ticker?: string | null
  showSearch?: boolean | null
}

export type SettingsData = {
  name?: string | null
  tagline?: string | null
  logo?: { url?: string | null; alt?: string | null } | number | null
  phones?: Phone[] | null
}

/** Everything interpolated below is content, so all of it goes through here. */
export const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** A bare Indian number becomes a dialable one; anything already prefixed is left alone. */
export function telHref(number: string): string {
  const digits = number.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return `tel:${digits}`
  return `tel:${digits.length === 10 ? `+91${digits}` : digits}`
}

/** Display form, matching the origin: +91 in front of the ten digits. */
function displayNumber(number: string): string {
  const digits = number.replace(/[^\d]/g, '')
  return digits.length === 10 ? `+91${digits}` : number
}

const mediaUrl = (logo: SettingsData['logo']): string | null =>
  logo && typeof logo === 'object' ? (logo.url ?? null) : null

const mediaAlt = (logo: SettingsData['logo']): string =>
  (logo && typeof logo === 'object' ? logo.alt : null) || ''

function menuItem(item: NavItem, currentPath: string): string {
  const href = resolveHref(item.link)
  const label = item.link?.label ?? ''
  const children = item.children ?? []
  const hasChildren = children.length > 0

  const isHome = href === '/'
  const isCurrent = href === currentPath

  const classes = [
    'menu-item',
    'menu-item-type-post_type',
    'menu-item-object-page',
    isHome ? 'menu-item-home' : null,
    isCurrent ? 'current-menu-item' : null,
    isCurrent ? 'page_item' : null,
    isCurrent ? 'current_page_item' : null,
    hasChildren ? 'menu-item-has-children' : null,
    'parent',
    hasChildren ? 'hfe-has-submenu' : null,
    'hfe-creative-menu',
  ]
    .filter(Boolean)
    .join(' ')

  const arrow = hasChildren
    ? '<span class="hfe-menu-toggle sub-arrow hfe-menu-child-0"><i class="fa"></i></span>'
    : ''

  const anchor = `<a class="hfe-menu-item" href="${esc(href)}">${esc(label)}${arrow}</a>`

  const submenu = hasChildren
    ? `<ul class="sub-menu">${children
        .map(
          (child) =>
            `<li class="menu-item menu-item-type-post_type menu-item-object-page hfe-creative-menu">` +
            `<a class="hfe-sub-menu-item" href="${esc(resolveHref(child.link))}">` +
            `${esc(child.link?.label ?? '')}</a></li>`,
        )
        .join('\n')}</ul>`
    : ''

  return (
    `<li class="${classes}">` +
    (hasChildren ? `<div class="hfe-has-submenu-container">${anchor}</div>` : anchor) +
    submenu +
    `</li>`
  )
}

export function renderSiteHeader({
  settings,
  header,
  currentPath,
}: {
  settings: SettingsData
  header: HeaderData
  currentPath: string
}): string {
  const siteTitle = [settings.name, settings.tagline].filter(Boolean).join(' ')
  const phones = (settings.phones ?? []).filter((p) => p.showInHeader && p.number)
  const nav = header.nav ?? []
  const logoSrc = mediaUrl(settings.logo)

  const phoneItems = phones
    .map(
      (phone) =>
        `<li class="elementor-icon-list-item elementor-inline-item">` +
        `<a href="${esc(telHref(phone.number as string))}">` +
        `<span class="elementor-icon-list-icon"><i aria-hidden="true" class="fas fa-mobile-alt"></i> </span>` +
        `<span class="elementor-icon-list-text">${esc(displayNumber(phone.number as string))}</span>` +
        `</a></li>`,
    )
    .join('\n')

  const search =
    header.showSearch === false
      ? ''
      : `<div class="elementor-element elementor-element-f6be383 hfe-search-layout-icon elementor-widget elementor-widget-hfe-search-button" data-element_type="widget" data-id="f6be383" data-widget_type="hfe-search-button.default">
<div class="elementor-widget-container">
<form action="/" class="hfe-search-button-wrapper" method="get" role="search">
<div class="hfe-search-icon-toggle">
<input class="hfe-search-form__input" name="s" placeholder="" title="Search" type="search" value=""/>
<i aria-hidden="true" class="fas fa-search"></i>
</div>
</form>
</div>
</div>`

  const logo = logoSrc
    ? `<img alt="${esc(mediaAlt(settings.logo))}" class="hfe-site-logo-img elementor-animation-" loading="lazy" src="${esc(logoSrc)}"/>`
    : ''

  // <marquee> is deprecated, but it is what the origin scrolls this line with and
  // the stylesheet expects it.
  const ticker = header.ticker
    ? `<div class="elementor-element elementor-element-ab67084 elementor-widget elementor-widget-text-editor" data-element_type="widget" data-id="ab67084" data-widget_type="text-editor.default">
<div class="elementor-widget-container">
<span style="color: #000000;"><marquee>${esc(header.ticker)}</marquee></span> </div>
</div>`
    : ''

  return `<header id="masthead" itemscope="itemscope" itemtype="https://schema.org/WPHeader">
<p class="main-title bhf-hidden" itemprop="headline"><a href="/" rel="home" title="${esc(siteTitle)}">${esc(siteTitle)}</a></p>
<div class="elementor elementor-487" data-elementor-id="487" data-elementor-type="wp-post">
<section class="elementor-section elementor-top-section elementor-element elementor-element-9962d0c elementor-section-full_width elementor-section-height-default elementor-section-height-default" data-element_type="section" data-id="9962d0c">
<div class="elementor-container elementor-column-gap-default">
<div class="elementor-column elementor-col-33 elementor-top-column elementor-element elementor-element-a3a379f" data-element_type="column" data-id="a3a379f">
<div class="elementor-widget-wrap elementor-element-populated">
<div class="elementor-element elementor-element-66b04e2 elementor-icon-list--layout-inline elementor-mobile-align-center elementor-list-item-link-full_width elementor-widget elementor-widget-icon-list" data-element_type="widget" data-id="66b04e2" data-widget_type="icon-list.default">
<div class="elementor-widget-container">
<ul class="elementor-icon-list-items elementor-inline-items">
${phoneItems}
</ul>
</div>
</div>
</div>
</div>
<div class="elementor-column elementor-col-33 elementor-top-column elementor-element elementor-element-3d9f820" data-element_type="column" data-id="3d9f820">
<div class="elementor-widget-wrap">
</div>
</div>
<div class="elementor-column elementor-col-33 elementor-top-column elementor-element elementor-element-3c5382f" data-element_type="column" data-id="3c5382f">
<div class="elementor-widget-wrap elementor-element-populated">
${search}
</div>
</div>
</div>
</section>
<section class="elementor-section elementor-top-section elementor-element elementor-element-e9df09d elementor-section-full_width elementor-section-height-default elementor-section-height-default" data-element_type="section" data-id="e9df09d">
<div class="elementor-container elementor-column-gap-default">
<div class="elementor-column elementor-col-50 elementor-top-column elementor-element elementor-element-3bdc96e" data-element_type="column" data-id="3bdc96e">
<div class="elementor-widget-wrap elementor-element-populated">
<div class="elementor-element elementor-element-3991d3c elementor-widget elementor-widget-site-logo" data-element_type="widget" data-id="3991d3c" data-widget_type="site-logo.default">
<div class="elementor-widget-container">
<div class="hfe-site-logo">
<a class="elementor-clickable" href="/">
<div class="hfe-site-logo-set">
<div class="hfe-site-logo-container">
${logo}
</div>
</div>
</a>
</div>
</div>
</div>
</div>
</div>
<div class="elementor-column elementor-col-50 elementor-top-column elementor-element elementor-element-15442b8" data-element_type="column" data-id="15442b8">
<div class="elementor-widget-wrap elementor-element-populated">
<div class="elementor-element elementor-element-340cb2d hfe-nav-menu__align-right hfe-submenu-icon-arrow hfe-submenu-animation-none hfe-link-redirect-child hfe-nav-menu__breakpoint-tablet elementor-widget elementor-widget-navigation-menu" data-element_type="widget" data-id="340cb2d" data-widget_type="navigation-menu.default">
<div class="elementor-widget-container">
<div class="hfe-nav-menu hfe-layout-horizontal hfe-nav-menu-layout horizontal hfe-pointer__none" data-layout="horizontal">
<div class="hfe-nav-menu__toggle elementor-clickable" role="button">
<span class="screen-reader-text">Menu</span>
<div class="hfe-nav-menu-icon">
<i aria-hidden="true" class="fas fa-align-justify"></i> </div>
</div>
<nav class="hfe-nav-menu__layout-horizontal hfe-nav-menu__submenu-arrow" data-full-width="yes"><ul class="hfe-nav-menu" id="menu-1-340cb2d">
${nav.map((item) => menuItem(item, currentPath)).join('\n')}
</ul></nav>
</div>
</div>
</div>
${ticker}
</div>
</div>
</div>
</section>
</div>
</header>`
}
