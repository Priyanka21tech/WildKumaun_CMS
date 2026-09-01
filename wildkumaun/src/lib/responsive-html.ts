import type { MediaMap } from './media-map'

/**
 * Point the mirrored markup at the sizes Payload generated.
 *
 * The origin's `<img>` tags carry no srcset at all — 34 of the home page's 43
 * images request the full-size original, and five more are pulled in as CSS
 * background images from the inline `<style>` blocks. Together that is most of
 * the page's weight, for images the browser then scales down anyway.
 *
 * Two rewrites happen here:
 *
 *   <img src="/media/bird-hide.jpg">   src becomes the 1400, plus a srcset of
 *                                      300/900/1400 so the browser picks by width
 *   url(/media/bird-hide.jpg)          becomes the 1400; CSS cannot choose, so
 *                                      there is one size to give it
 *
 * A src may already point at a WordPress copy — `open-area-img-1024x683.jpg`.
 * Those were never imported, so the `-1024x683` is stripped to find the original
 * the sizes belong to.
 *
 * An `<img>` that already has a srcset is left alone: it came that way from the
 * origin and whoever put it there knew which widths they meant.
 */

/** `open-area-img-1024x683.jpg` -> `open-area-img.jpg`. Leaves other names alone. */
export function originalFilename(filename: string): string {
  return filename.replace(/-\d{2,4}x\d{2,4}(\.[a-z0-9]+)$/i, '$1')
}

const lookup = (map: MediaMap, url: string) => {
  const filename = url.split('/').pop()
  if (!filename) return undefined
  return map.sizes.get(filename) ?? map.sizes.get(originalFilename(filename))
}

/**
 * How wide the image will actually be drawn. The layout is a boxed container, so
 * below its width an image fills the viewport and above it never exceeds 1200px.
 * Without this the browser assumes 100vw and picks the largest size every time,
 * which would undo the point of the exercise.
 */
const SIZES_ATTR = '(max-width: 1200px) 100vw, 1200px'

const IMG_TAG = /<img\b[^>]*>/gi
const SRC_ATTR = /(\ssrc=)(["'])(\/media\/[^"']+)\2/i
const CSS_URL = /url\(\s*(["']?)(\/media\/[^)"']+)\1\s*\)/gi

export function withResponsiveImages(html: string, map: MediaMap): string {
  const withImages = html.replace(IMG_TAG, (tag) => {
    if (/\bsrcset=/i.test(tag)) return tag

    const src = SRC_ATTR.exec(tag)
    if (!src) return tag

    const set = lookup(map, src[3])
    if (!set) return tag

    const retargeted = tag.replace(SRC_ATTR, `$1$2${set.src}$2`)
    if (!set.srcset) return retargeted

    // Before the closing bracket, so a self-closing tag stays self-closing.
    return retargeted.replace(
      /\s*\/?>$/,
      (close) => ` srcset="${set.srcset}" sizes="${SIZES_ATTR}"${close}`,
    )
  })

  return withImages.replace(CSS_URL, (whole, quote: string, url: string) => {
    const set = lookup(map, url)
    return set ? `url(${quote}${set.src}${quote})` : whole
  })
}

/**
 * The same rewrite, done once per page.
 *
 * Rewriting is a handful of passes over 170KB of markup, and with the route
 * rendering dynamically that would otherwise happen on every request for a result
 * that only changes when the media does. Keyed on the map's version, so a rebuilt
 * media map invalidates every page at once rather than leaving stale markup behind.
 */
const rendered = new Map<string, string>()

export function responsiveHtml(route: string, html: string, map: MediaMap): string {
  const key = `${map.version}:${route}`
  const hit = rendered.get(key)
  if (hit !== undefined) return hit

  const result = withResponsiveImages(html, map)

  // Only the current version is worth keeping; the map rebuilds every minute.
  for (const existing of rendered.keys()) {
    if (!existing.startsWith(`${map.version}:`)) rendered.delete(existing)
  }
  rendered.set(key, result)

  return result
}
