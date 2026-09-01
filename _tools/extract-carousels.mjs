/**
 * Extract every image carousel on the site — its slides and its settings.
 *
 * Both are already in the mirrored markup: the slides as real <img> tags, and
 * the behaviour as a data-settings JSON blob Elementor leaves on the widget. So
 * nothing here is guesswork; it is the site's own configuration, just lifted out
 * into a form we can drive ourselves.
 *
 * Output: content/carousels.json — used two ways.
 *   now:   the slider component reads the settings to drive the existing markup
 *   later: the same file seeds the CMS carousel block, so the slider component
 *          keeps working when the data starts coming from the CMS instead
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIR = path.join(ROOT, 'site/content/mirror')
const OUT = path.join(ROOT, 'content/carousels.json')

const pages = JSON.parse(fs.readFileSync(path.join(DIR, '_pages.json'), 'utf8'))

/**
 * Read an attribute off a tag. Elementor quotes data-settings with single quotes
 * because its value is JSON containing double quotes, so both forms are handled.
 */
const attrOf = (tag, name) =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ??
  tag.match(new RegExp(`\\s${name}='([^']*)'`))?.[1] ??
  null

/** Elementor writes spacing as {"unit":"px","size":20}; we only want the number. */
const spacingOf = (raw) => {
  const size = raw?.image_spacing_custom?.size
  return typeof size === 'number' ? size : 0
}

/**
 * Elementor's own vocabulary, normalised to plain values. Names are kept close
 * to the original so the mapping back to the source stays obvious.
 */
const normalise = (raw) => ({
  slidesToShow: Number(raw.slides_to_show ?? 1),
  slidesToScroll: Number(raw.slides_to_scroll ?? 1),
  navigation: raw.navigation ?? 'none', // 'dots' | 'arrows' | 'both' | 'none'
  autoplay: raw.autoplay === 'yes',
  autoplaySpeed: Number(raw.autoplay_speed ?? 5000),
  pauseOnHover: raw.pause_on_hover === 'yes',
  pauseOnInteraction: raw.pause_on_interaction === 'yes',
  infinite: raw.infinite === 'yes',
  speed: Number(raw.speed ?? 500),
  spacing: spacingOf(raw),
})

/** Strip tags and inline <style> to get a slide's readable copy. */
const textOf = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * The Sina content slider — the page hero. Unlike the image carousel, each slide
 * is a whole Elementor section, so the parts worth carrying into a CMS block are
 * its background image, its copy and any call to action.
 */
function extractContentSliders(html, route, out) {
  const roots = [...html.matchAll(/<div class="sina-content-slider owl-carousel"[^>]*>/g)]

  for (const [i, m] of roots.entries()) {
    const tag = m[0]
    const from = m.index
    const next = roots[i + 1]?.index
    const block = html.slice(from, next)

    // Slides are siblings; slicing between their opening tags is enough because
    // a slide never contains another slide.
    const marks = [...block.matchAll(/<div class="sina-cs-item[^"]*"[^>]*>/g)]
    const slides = marks.map((mark, k) => {
      const slice = block.slice(mark.index, marks[k + 1]?.index)
      return {
        image: slice.match(/background-image:url\("?([^")]+)"?\)/)?.[1] ?? null,
        text: textOf(slice.slice(slice.indexOf('>') + 1)),
        link: slice.match(/<a[^>]*href="([^"]+)"/)?.[1] ?? null,
      }
    })

    if (!slides.length) continue

    out.push({
      id: `${route === '/' ? 'index' : route.slice(1)}-hero-${i + 1}`,
      page: route,
      type: 'content-slider',
      settings: {
        slidesToShow: Number(attrOf(tag, 'data-item-lg') || 1),
        slidesToShowTablet: Number(attrOf(tag, 'data-item-md') || 1),
        slidesToShowMobile: Number(attrOf(tag, 'data-item-sm') || 1),
        navigation: attrOf(tag, 'data-nav') === 'yes' ? 'arrows' : 'none',
        autoplay: attrOf(tag, 'data-autoplay') === 'yes',
        autoplaySpeed: Number(attrOf(tag, 'data-delay') || 5000),
        pauseOnHover: attrOf(tag, 'data-pause') === 'yes',
        infinite: attrOf(tag, 'data-loop') === 'yes',
        speed: Number(attrOf(tag, 'data-speed') || 500),
        spacing: 0,
      },
      slides,
    })
  }
}

const carousels = []

for (const p of pages) {
  const { html } = JSON.parse(fs.readFileSync(path.join(DIR, `${p.slug}.json`), 'utf8'))

  extractContentSliders(html, p.route, carousels)

  // Each carousel is one widget. Carousels never nest, so slicing from one
  // widget tag to the next is enough to scope its slides.
  const starts = [...html.matchAll(/<div\b[^>]*data-widget_type="image-carousel[^"]*"[^>]*>/g)]

  for (const [i, m] of starts.entries()) {
    const tag = m[0]
    const from = m.index
    const nextWidget = html.indexOf('data-widget_type=', from + tag.length)
    const block = html.slice(from, nextWidget === -1 ? undefined : nextWidget)

    let raw = {}
    try {
      raw = JSON.parse(attrOf(tag, 'data-settings') ?? '{}')
    } catch {
      // A carousel with no readable settings still renders; it just uses defaults.
    }

    const slides = []
    for (const s of block.matchAll(/<div\b[^>]*class="swiper-slide"[^>]*>([\s\S]*?)<\/div>/g)) {
      const inner = s[1]
      const img = inner.match(/<img\b[^>]*>/)?.[0]
      const link = inner.match(/<a\b[^>]*>/)?.[0]
      if (!img) continue
      slides.push({
        image: attrOf(img, 'src'),
        // The lightbox link points at the full-size original.
        full: link ? attrOf(link, 'href') : null,
        alt: attrOf(img, 'alt') || '',
      })
    }

    if (!slides.length) continue

    carousels.push({
      id: attrOf(tag, 'data-id') ?? `${p.slug}-${i}`,
      page: p.route,
      type: 'image-carousel',
      settings: normalise(raw),
      slides,
    })
  }
}

fs.writeFileSync(OUT, JSON.stringify(carousels, null, 2))

console.log(`wrote ${carousels.length} carousels to content/carousels.json`)
for (const c of carousels) {
  const s = c.settings
  console.log(
    `  ${c.page.padEnd(24)} ${c.type.padEnd(15)} ${String(c.slides.length).padStart(2)} slides  ` +
      `show=${s.slidesToShow} nav=${s.navigation} autoplay=${s.autoplay ? s.autoplaySpeed + 'ms' : 'no'} gap=${s.spacing}`,
  )
}
