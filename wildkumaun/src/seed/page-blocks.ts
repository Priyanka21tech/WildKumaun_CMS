import type { Payload } from 'payload'
import path from 'node:path'
import { endOfElement, innerEndOfElement, sliceSection } from '../lib/elementor'
import {
  AMENITY_TARGETS,
  ARTWORK_TARGETS,
  COLUMN_TARGETS,
  FORM_TARGETS,
  MAP_TARGETS,
  TEXT_TARGETS,
  GALLERY_TARGETS,
  PACKAGE_TARGETS,
  PARTNER_TARGETS,
  type SectionTarget,
} from '../lib/sections'
import { mirror, pairsIn, slugify } from './amenities'
import { findMedia } from './page-content'
import { htmlToLexical } from './html-to-lexical'
import { seedForms, seedGuestBookForm } from './forms'
import { seedBirdArt } from './bird-art'

/**
 * Give each page the blocks that render what it already shows.
 *
 * Until a page carries a block, the block does nothing — the mirror's own markup
 * is what the reader sees. So the collections seeded earlier were invisible: the
 * amenities existed as documents and every page went on rendering the origin's
 * hard-coded copies of them. This is the step that connects the two.
 *
 * What each block is given is read out of the mirror, not decided here. The
 * headings are the origin's headings, the amenity groupings are the origin's own
 * rows, the gallery is the origin's photographs in the origin's order. That is
 * the whole point: switching a section from the mirror to the CMS should change
 * nothing on the page. Anything that looks different afterwards is a bug, and
 * that is only a usable test if the content on both sides is the same.
 *
 * Every amenity target gets a block, which is what makes the collection worth
 * having: the six rows across three pages share sixteen documents between them,
 * so Kettle's icon is now one upload rather than two, and the five items on
 * /facilities are the same documents the home page lists under a different
 * heading in a different shape.
 *
 * Creates only, and per block rather than per page — a page may already carry
 * blocks from an earlier seed or from an editor, and appending must not
 * duplicate or drop them. A block whose target is already on the page is left
 * exactly as it is.
 */

/**
 * The mirrored file behind a page.
 *
 * The home page is `home` in Payload, because a slug cannot be "/", and
 * `index.json` in the mirror, because that is what the origin called it. Every
 * other page is named the same in both.
 */
const mirrorFor = (slug: string): string => mirror(slug === 'home' ? 'index' : slug)

/** The hero's slider — the one of the two on the page that holds no reviews. */
function heroSliderIn(html: string): { start: number; end: number } | null {
  let from = 0

  while (true) {
    const at = html.indexOf('<div class="sina-content-slider', from)
    if (at === -1) return null

    const end = endOfElement(html, at, 'div')
    if (end === -1) return null

    if (!html.slice(at, end).includes('eael-testimonial')) return { start: at, end }
    from = end
  }
}

/** Each `.sina-cs-item` inside a slider. */
function slidesIn(slider: string): string[] {
  const found: string[] = []
  let at = slider.indexOf('sina-cs-item')

  while (at !== -1) {
    const open = slider.lastIndexOf('<div', at)
    const end = endOfElement(slider, open, 'div')
    if (end === -1) break

    found.push(slider.slice(open, end))
    at = slider.indexOf('sina-cs-item', end)
  }

  return found
}

/**
 * What each partner is called.
 *
 * The origin renders the logos with an empty alt attribute, so there is nothing
 * to read: these are the names as they appear in the logos themselves. They
 * become alt text, which is the one place the name is of any use.
 */
const PARTNER_NAMES: Record<string, string> = {
  'explore-wild-india-logo.png': 'Explore Wild India',
  'wild-india-journey-logo.png': 'Wild India Journey',
  'untold-india-logo.png': 'Untold India',
  'Junglehike-final-logo.png': 'Junglehike',
  'twf-logo.png': 'The Wildlife Foundation',
  'wild-walk-tour.png': 'Wild Walk Tour',
  'wild-voyager.png': 'Wild Voyager',
  'wandervogel-adventures.png': 'Wandervogel Adventures',
}

/** The words in a heading section, so a block's heading matches the origin's. */
function headingIn(html: string, sectionId?: string): string | undefined {
  if (!sectionId) return undefined

  const markup = sliceSection(html, sectionId)
  const found = markup?.match(
    /<h[1-6][^>]*class="elementor-heading-title[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/i,
  )

  return found?.[1]
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/** The subtitle the origin puts under a heading, where it has one. */
function subtitleIn(html: string, sectionId?: string): string | undefined {
  if (!sectionId) return undefined

  const markup = sliceSection(html, sectionId)
  const found = markup?.match(/<p[^>]*>([\s\S]*?)<\/p>/i)

  return found?.[1].replace(/<[^>]*>/g, '').trim() || undefined
}

/** The `/media/...` sources inside a section, in document order. */
function imagesIn(html: string, sectionId: string): string[] {
  const markup = sliceSection(html, sectionId)
  if (!markup) return []

  return [...markup.matchAll(/<img[^>]*src="\/media\/([^"]+)"[^>]*>/g)].map((match) => match[1])
}

const mediaIdFor = (payload: Payload, filename: string) =>
  findMedia(payload, path.basename(filename.split('?')[0]))

/** The Media ids for a section's images, skipping any that were never imported. */
async function mediaIdsIn(payload: Payload, html: string, sectionId: string): Promise<number[]> {
  const ids: number[] = []

  for (const filename of imagesIn(html, sectionId)) {
    const id = await mediaIdFor(payload, filename)
    if (typeof id === 'number') ids.push(id)
  }

  return ids
}

/**
 * The amenity documents behind one of the origin's rows, in the origin's order.
 *
 * The list-shaped row has no picture-and-label pairs to read — /facilities writes
 * its items as a bulleted list — so the labels come out of the list items there.
 */
async function amenityIdsIn(
  payload: Payload,
  html: string,
  target: SectionTarget,
): Promise<number[]> {
  const markup = sliceSection(html, target.section)
  if (!markup) return []

  const labels =
    target.display === 'list'
      ? [...markup.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((match) =>
          match[1]
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim(),
        )
      : pairsIn(markup).map((pair) => pair.label)

  const ids: number[] = []

  for (const label of labels.filter(Boolean)) {
    const found = await payload.find({
      collection: 'amenities',
      where: { slug: { equals: slugify(label) } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    const id = found.docs[0]?.id
    if (typeof id === 'number') ids.push(id)
  }

  return ids
}

type Block = { blockType: string; target?: string } & Record<string, unknown>

/**
 * The hero's slides, read out of the origin's slider.
 *
 * Only the home page has one, and its photographs are CSS backgrounds rather
 * than `<img>` tags — so they are read out of the `<style>` block each slide
 * carries, not out of its markup. See src/lib/hero-render.ts.
 */
async function heroSlides(
  payload: Payload,
  html: string,
): Promise<{ image: number; caption?: string }[]> {
  const at = heroSliderIn(html)
  if (!at) return []

  const slides: { image: number; caption?: string }[] = []

  for (const markup of slidesIn(html.slice(at.start, at.end))) {
    const url = markup.match(/background-image:url\("([^"]+)"\)/)?.[1]
    if (!url) continue

    const id = await mediaIdFor(payload, url)
    if (typeof id !== 'number') continue

    const caption = markup
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .match(/<div class="elementor-widget-container">\s*<p>([\s\S]*?)<\/p>/)?.[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()

    slides.push({ image: id, caption: caption || undefined })
  }

  return slides
}

/**
 * One text section's copy, as the origin wrote it.
 *
 * The paragraph is converted from the section's own markup rather than rebuilt
 * from the extraction's list of sentences: the markup has the line breaks and
 * emphasis the extraction dropped, and htmlToLexical already knows how to keep
 * them. See src/seed/html-to-lexical.ts.
 */
async function textBlockFor(
  payload: Payload,
  html: string,
  target: SectionTarget,
): Promise<Block | null> {
  const markup = sliceSection(html, target.section)
  if (!markup || !target.item) return null

  const heading = markup
    .match(/<h[1-6][^>]*class="elementor-heading-title[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1]
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

  const copy = target.wholeSection
    ? allWidgetsIn(markup)
    : target.item.text
      ? widgetInner(markup, target.item.text)
      : undefined

  const body = copy ? await htmlToLexical(copy, (src) => mediaIdFor(payload, src)) : undefined

  const cta = target.item.button ? buttonIn(markup, target.item.button) : undefined

  const images = target.item.image ? await mediaIdsIn(payload, html, target.section) : []

  // The origin sometimes makes the picture itself the link — the petition poster
  // on /conservation opens change.org. Read off the anchor round the image widget.
  const imageHref = target.item.image
    ? widgetInner(markup, target.item.image)?.match(/<a[^>]*href="([^"]+)"/i)?.[1]
    : undefined

  if (!heading && !body && !cta) return null

  return {
    blockType: 'text',
    target: target.value,
    heading,
    body: body as never,
    images,
    showImageLink: Boolean(imageHref),
    imageLink: imageHref ? { type: 'custom' as const, url: imageHref, newTab: true } : undefined,
    showButton: Boolean(cta),
    // `custom` rather than a page reference: the origin types these hrefs, and
    // guessing which page "contact-us.html" meant is the kind of silent decision
    // that makes a migration unverifiable.
    button: cta ? { type: 'custom', label: cta.label, url: cta.href } : undefined,
  }
}

/**
 * Everything the section's heading and text widgets hold, in document order.
 *
 * For a section the origin split into several widgets that read as one piece of
 * prose. The headings come through as `<h2>`, which rich text keeps.
 */
function allWidgetsIn(markup: string): string | undefined {
  const parts: string[] = []
  const pattern = /data-id="([0-9a-f]{7})"[^>]*data-widget_type="(heading|text-editor)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(markup))) {
    const inner = widgetInner(markup, match[1])
    if (inner) parts.push(inner)
  }

  return parts.length ? parts.join('') : undefined
}

/**
 * One row of columns, read as the origin wrote them.
 *
 * Each column is taken whole rather than by widget hash, because the three are
 * not interchangeable here: "By Air" and "By Rail" are separate widgets with
 * separate ids, and reading only the hash the target names would seed the first
 * column's words three times.
 */
async function columnsBlockFor(
  payload: Payload,
  html: string,
  target: SectionTarget,
): Promise<Block | null> {
  const markup = sliceSection(html, target.section)
  if (!markup || !target.item) return null

  const items: { heading?: string; body?: unknown }[] = []

  for (const col of columnsIn(markup)) {
    const heading = col
      .match(/<h[1-6][^>]*class="elementor-heading-title[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()

    const copy = firstTextIn(col)
    const body = copy ? await htmlToLexical(copy, (src) => mediaIdFor(payload, src)) : undefined

    if (!heading && !body) continue
    items.push({ heading, body })
  }

  if (!items.length) return null

  // From the whole page, not from the section: the heading over these columns is
  // a widget in the column outside them. See `headingWidget` in src/lib/sections.ts.
  const heading = target.headingWidget
    ? widgetInner(html, target.headingWidget)
        ?.replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
    : undefined

  return { blockType: 'columns', target: target.value, heading, items: items as never }
}

/** Each column of a section, as markup, in the order the origin lists them. */
function columnsIn(markup: string): string[] {
  const found: string[] = []
  const pattern = /<div class="elementor-column[^"]*"[^>]*data-element_type="column"[^>]*>/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(markup))) {
    const end = endOfElement(markup, match.index, 'div')
    if (end === -1) continue

    found.push(markup.slice(match.index, end))
    // Past the column just taken, so a column nested in this one is not read as
    // a second column of the row.
    pattern.lastIndex = end
  }

  return found
}

/** What the column's text widget holds, whatever hash the origin gave it. */
function firstTextIn(col: string): string | undefined {
  const hash = col.match(/data-id="([0-9a-f]{7})"[^>]*data-widget_type="text-editor/)?.[1]
  return hash ? widgetInner(col, hash) : undefined
}

/** What a widget holds, without its Elementor wrappers. */
function widgetInner(markup: string, hash: string): string | undefined {
  const at = markup.indexOf(`data-id="${hash}"`)
  if (at === -1) return undefined

  const open = markup.indexOf('<div class="elementor-widget-container">', at)
  if (open === -1) return undefined

  const start = open + '<div class="elementor-widget-container">'.length
  const end = innerEndOfElement(markup, open, 'div')
  if (end === -1 || end < start) return undefined

  return markup.slice(start, end).trim()
}

/** The label and href on a button widget. */
function buttonIn(markup: string, hash: string): { label: string; href: string } | undefined {
  const at = markup.indexOf(`data-id="${hash}"`)
  if (at === -1) return undefined

  const scope = markup.slice(at, at + 2000)
  const href = scope.match(/<a[^>]*href="([^"]*)"/i)?.[1]
  const label = scope
    .match(/<span class="elementor-button-text">([\s\S]*?)<\/span>/i)?.[1]
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

  return label ? { label, href: href || '#' } : undefined
}

/** Every block that belongs on one page, built from what the origin shows there. */
async function blocksFor(payload: Payload, slug: string): Promise<Block[]> {
  const html = mirrorFor(slug)
  const blocks: Block[] = []

  if (slug === 'home') {
    const slides = await heroSlides(payload, html)
    // No `target`: there is one hero on the site, so HeroBlock has no target field
    // and Payload would drop the value on save — leaving the block unmatchable and
    // a fresh copy appended on every run.
    if (slides.length) blocks.push({ blockType: 'hero', slides })
  }

  for (const target of AMENITY_TARGETS.filter((entry) => entry.page === slug)) {
    const items = await amenityIdsIn(payload, html, target)
    if (!items.length) continue

    const image =
      target.display === 'list'
        ? await mediaIdFor(payload, imagesIn(html, target.section)[0] ?? '')
        : undefined

    blocks.push({
      blockType: 'amenities',
      target: target.value,
      heading: headingIn(html, target.heading),
      subtitle: subtitleIn(html, target.heading),
      display: target.display,
      image,
      items,
    })
  }

  for (const target of TEXT_TARGETS.filter((entry) => entry.page === slug)) {
    const block = await textBlockFor(payload, html, target)
    if (block) blocks.push(block)
  }

  for (const target of COLUMN_TARGETS.filter((entry) => entry.page === slug)) {
    const block = await columnsBlockFor(payload, html, target)
    if (block) blocks.push(block)
  }

  for (const target of FORM_TARGETS.filter((entry) => entry.page === slug)) {
    const markup = sliceSection(html, target.section)
    if (!markup || !target.item) continue

    // The guest book asks its own questions, so it gets its own form.
    const form =
      target.value === 'guestbook-form'
        ? await seedGuestBookForm(payload)
        : await seedForms(payload)
    if (!form.id) continue

    // The origin's two headings for this section: an h2 above the form and an h3
    // above the copy beside it. Both say "Ask Your Queries", and both are kept —
    // they are two widgets and an editor may want them to differ.
    const asideBodyHtml = target.item.text ? widgetInner(markup, target.item.text) : undefined
    const cta = target.item.button ? buttonIn(markup, target.item.button) : undefined

    blocks.push({
      blockType: 'form',
      target: target.value,
      // From the widget the target names rather than the section's first heading:
      // the guest book's form sits under the second of two, not the first.
      heading: target.item.label
        ? widgetInner(markup, target.item.label)
            ?.replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim()
        : headingIn(html, target.section),
      form: form.id,
      // Read off the widget the target names, not by tag: the home page's is an
      // h3 and the contact page's an h2, and both are "the heading beside the form".
      asideHeading: target.item.aside
        ? widgetInner(markup, target.item.aside)
            ?.replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim()
        : undefined,
      asideImage: target.item.asideImage
        ? await mediaIdFor(
            payload,
            widgetInner(markup, target.item.asideImage)?.match(/src="\/media\/([^"]+)"/)?.[1] ?? '',
          )
        : undefined,
      asideBody: asideBodyHtml
        ? ((await htmlToLexical(asideBodyHtml, (src) => mediaIdFor(payload, src))) as never)
        : undefined,
      // Only the contact page shows the address beside the form; the home page
      // and the guest book put their own words there.
      showContactDetails: target.value === 'contact-form',
      showAsideButton: Boolean(cta),
      button: undefined,
      asideButton: cta ? { type: 'custom', label: cta.label, url: cta.href } : undefined,
    })
  }

  for (const target of ARTWORK_TARGETS.filter((entry) => entry.page === slug)) {
    const markup = sliceSection(html, target.section)
    if (!markup) continue

    if (target.value.endsWith('-artists')) {
      // A portrait and a name to a column, read as pairs the way the amenity
      // rows are.
      const people: { image: number; name: string }[] = []

      for (const pair of pairsIn(markup)) {
        const id = pair.icon ? await mediaIdFor(payload, pair.icon) : undefined
        if (typeof id === 'number') people.push({ image: id, name: pair.label })
      }

      if (people.length) {
        blocks.push({ blockType: 'artwork', target: target.value, display: 'artists', people })
      }
      continue
    }

    /**
     * Only the paintings this run actually shows.
     *
     * The collection holds eleven; the origin's gallery shows ten. The Tawny
     * Fish Owl is the odd one out — it is a painting, and the page uses it as the
     * picture beside the artist's statement rather than putting it in the run
     * below. Seeding all eleven would quietly add a twelfth picture to the
     * gallery, so the run is matched against the filenames the origin lists.
     */
    const shown = new Set(imagesIn(html, target.section).map((f) => f.toLowerCase()))

    const art = await payload.find({
      collection: 'bird-art',
      limit: 0,
      pagination: false,
      sort: 'order',
      depth: 1,
    })

    art.docs = art.docs.filter((doc) => {
      const files = [doc.image, doc.altImage]
        .map((m) => (m && typeof m === 'object' ? m.filename : null))
        .filter((f): f is string => Boolean(f))

      return files.some((f) => shown.has(f.toLowerCase()))
    })

    if (art.docs.length) {
      blocks.push({
        blockType: 'artwork',
        target: target.value,
        display: 'paintings',
        columns: 4,
        items: art.docs.map((d) => d.id),
      })
    }
  }

  for (const target of MAP_TARGETS.filter((entry) => entry.page === slug)) {
    const markup = sliceSection(html, target.section)
    const src = markup?.match(/<iframe[^>]*src="([^"]+)"/i)?.[1]
    if (!src) continue

    // The origin stores the whole embed address; the block stores what it was
    // built from, so moving the pin does not mean editing a URL by hand.
    const params = new URLSearchParams(src.replace(/&amp;/g, '&').split('?')[1] ?? '')

    blocks.push({
      blockType: 'map',
      target: target.value,
      query: params.get('q') ?? undefined,
      zoom: Number(params.get('z')) || 10,
      label: markup?.match(/<iframe[^>]*aria-label="([^"]*)"/i)?.[1] ?? undefined,
    })
  }

  for (const target of PACKAGE_TARGETS.filter((entry) => entry.page === slug)) {
    const packages = await payload.find({
      collection: 'packages',
      limit: 0,
      pagination: false,
      sort: 'order',
      depth: 0,
    })

    if (!packages.docs.length) continue

    blocks.push({
      blockType: 'packages',
      target: target.value,
      heading: headingIn(html, target.heading),
      items: packages.docs.map((doc) => doc.id),
    })
  }

  for (const target of GALLERY_TARGETS.filter((entry) => entry.page === slug)) {
    const images = await mediaIdsIn(payload, html, target.section)
    if (!images.length) continue

    // Whether the origin rotates these, lays them in a row, or shows WordPress's
    // captioned thumbnails is read off its markup rather than assumed.
    const markup = sliceSection(html, target.section) ?? ''
    const rotates = markup.includes('image-carousel')
    const thumbnails = markup.includes('image-gallery')

    // A preview on the gallery index carries its own heading and button inside
    // the section; elsewhere the heading has a section to itself.
    const inlineHeading = target.item?.label
      ? widgetInner(markup, target.item.label)
          ?.replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim()
      : undefined
    const cta = target.item?.button ? buttonIn(markup, target.item.button) : undefined

    blocks.push({
      blockType: 'gallery',
      target: target.value,
      heading: inlineHeading ?? headingIn(html, target.heading),
      showButton: Boolean(cta),
      button: cta ? { type: 'custom' as const, url: cta.href, label: cta.label } : undefined,
      display: rotates ? 'carousel' : thumbnails ? 'gallery' : 'grid',
      // The four the origin's own carousel settings ask for.
      slidesToShow: 4,
      images,
    })
  }

  for (const target of PARTNER_TARGETS.filter((entry) => entry.page === slug)) {
    const logos: { image: number; name: string }[] = []

    for (const filename of imagesIn(html, target.section)) {
      const id = await mediaIdFor(payload, filename)
      if (typeof id === 'number') {
        logos.push({ image: id, name: PARTNER_NAMES[filename] ?? filename })
      }
    }

    if (logos.length) {
      blocks.push({
        blockType: 'partners',
        target: target.value,
        heading: headingIn(html, target.heading),
        logos,
      })
    }
  }

  return blocks
}

/** Every page some block has a target on. */
const pagesWithTargets = (): string[] => [
  ...new Set(
    [
      ...AMENITY_TARGETS,
      ...TEXT_TARGETS,
      ...COLUMN_TARGETS,
      ...FORM_TARGETS,
      ...MAP_TARGETS,
      ...ARTWORK_TARGETS,
      ...PACKAGE_TARGETS,
      ...GALLERY_TARGETS,
      ...PARTNER_TARGETS,
    ].map((target) => target.page),
  ),
]

export async function seedPageBlocks(payload: Payload): Promise<{ added: string[] }> {
  const added: string[] = []

  for (const slug of pagesWithTargets()) {
    const found = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    const page = found.docs[0]
    if (!page) continue

    const existing = (page.layout ?? []) as Block[]
    const taken = new Set(existing.map((block) => `${block.blockType}:${block.target ?? ''}`))

    const wanted = await blocksFor(payload, slug)
    const missing = wanted.filter((block) => !taken.has(`${block.blockType}:${block.target ?? ''}`))
    if (!missing.length) continue

    await payload.update({
      collection: 'pages',
      id: page.id,
      // The blocks the page already had come first, so nothing an editor arranged
      // is moved. Order in this list is only what the admin panel shows anyway —
      // each block replaces the section it names, wherever that sits on the page.
      data: { layout: [...existing, ...missing] as never },
    })

    added.push(...missing.map((block) => `${slug} — ${block.blockType}:${block.target}`))
  }

  return { added }
}
