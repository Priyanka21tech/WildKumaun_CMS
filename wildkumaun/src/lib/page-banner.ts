import fs from 'node:fs'
import path from 'node:path'

/**
 * The banner strip across the top of a page.
 *
 * The origin does not put it in an `<img>`. It is a CSS background on an
 * Elementor section, written into wp/site.css:
 *
 *   .elementor-4211 .elementor-element.elementor-element-7777479{background-image:url(../media/faq.jpg)}
 *
 * Which is why it survived every pass over the markup — there is nothing in the
 * page to find. Nine pages have one, and none of them could be changed without
 * editing a 1MB stylesheet.
 *
 * This reads those rules out of the stylesheet so each page can be matched to the
 * image it currently shows, and emits an override once that image has a Media
 * document behind it. The rules are parsed once and kept: the stylesheet is part
 * of the mirror and does not change while the server runs.
 */

const SITE_CSS = path.join(process.cwd(), 'public/wp/site.css')

/**
 * `.elementor-<page> .elementor-element.elementor-element-<element>{background-image:url(../media/<file>)}`
 *
 * The page id ties the rule to a page — the same id appears in that page's markup
 * as `class="elementor elementor-4211"` — and the element id says which section
 * inside it carries the background.
 */
const BANNER_RULE =
  /\.elementor-(\d+)\s+\.elementor-element\.elementor-element-([a-z0-9]+)[^{]*\{background-image:url\(\.\.\/media\/([^)]+)\)/gi

export type BannerRule =
  | {
      /** The stylesheet paints it as a background on a section. */
      kind: 'background'
      /** The Elementor page id, as it appears in the page's own markup. */
      pageId: string
      /** The section carrying the background. */
      elementId: string
      /** The file it points at, e.g. `faq.jpg`. */
      filename: string
    }
  | {
      /** The page has it as a real image, in an Elementor image widget. */
      kind: 'image'
      /** The `src` the widget currently carries. */
      filename: string
    }

let rules: Map<string, BannerRule> | null = null

/** Every banner rule in the stylesheet, keyed by Elementor page id. */
export function bannerRules(): Map<string, BannerRule> {
  if (rules) return rules

  rules = new Map()
  if (!fs.existsSync(SITE_CSS)) return rules

  const css = fs.readFileSync(SITE_CSS, 'utf8')
  let match: RegExpExecArray | null
  BANNER_RULE.lastIndex = 0

  while ((match = BANNER_RULE.exec(css))) {
    const [, pageId, elementId, filename] = match
    // First rule wins: a later one is a responsive override of the same image.
    if (!rules.has(pageId)) rules.set(pageId, { kind: 'background', pageId, elementId, filename })
  }

  return rules
}

/** The first Elementor image widget in the body, which is where a page puts its lead image. */
const IMAGE_WIDGET =
  /elementor-widget-image"[\s\S]{0,400}?<img[^>]*\ssrc="\/media\/([^"]+)"/i

/**
 * How this page shows its lead image.
 *
 * Two ways, because the origin uses two. Most pages have it as a section
 * background written into the stylesheet. Some — the guest book among them — have
 * it as an ordinary image widget in the markup, which is why pointing a stylesheet
 * override at those pages changed nothing.
 *
 * The background is checked first: a page that has one uses it as its banner, and
 * its image widgets are content further down the page.
 */
export function bannerFor(html: string): BannerRule | undefined {
  const all = bannerRules()
  for (const match of html.matchAll(/class="elementor elementor-(\d+)"/g)) {
    const rule = all.get(match[1])
    if (rule) return rule
  }

  // Only the body: the header's logo is an image widget too.
  const body = html.slice(html.indexOf('</header>'))
  const image = IMAGE_WIDGET.exec(body)
  return image ? { kind: 'image', filename: image[1] } : undefined
}

/**
 * A style block for the section's background.
 *
 * With a url, it points at that image. With none, it paints no image at all —
 * because a page whose banner has been cleared should look cleared. Falling back
 * to the stylesheet's own picture would show something nobody chose and leave the
 * field looking broken: you empty it, and the image is still there.
 *
 * `!important` rather than a more specific selector: the original rule includes a
 * `:not(...)` clause that adds specificity, and matching it exactly would mean
 * reproducing a selector this has no reason to know the shape of.
 */
export function bannerOverride(rule: BannerRule, url: string | null): string {
  if (rule.kind !== 'background') return ''
  const value = url ? `url(${url})` : 'none'
  return `<style data-banner="${rule.elementId}">.elementor-${rule.pageId} .elementor-element.elementor-element-${rule.elementId}{background-image:${value} !important}</style>`
}

/**
 * Point the image widget at a different file, or take the image away.
 *
 * Only the one `src` the rule named is touched, so the other images on the page —
 * and the header's logo, which is handled elsewhere — are left alone. Clearing the
 * field removes the `<img>` rather than leaving the mirror's, for the same reason
 * the background is painted `none`.
 */
export function replaceBannerImage(html: string, rule: BannerRule, url: string | null): string {
  if (rule.kind !== 'image') return html

  const src = `src="/media/${rule.filename}"`
  if (url) return html.replace(src, `src="${url}"`)

  // The whole tag, so no broken-image icon is left standing in its place.
  const at = html.indexOf(src)
  if (at === -1) return html
  const open = html.lastIndexOf('<img', at)
  const close = html.indexOf('>', at)
  if (open === -1 || close === -1) return html
  return html.slice(0, open) + html.slice(close + 1)
}
