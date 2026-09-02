import type { Payload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sliceSection } from '../lib/elementor'
import { findMedia } from './page-content'

/**
 * Put the site's amenities into the collection, with the icons they already use.
 *
 * The labels are read from the mirrored markup rather than from
 * content/amenities.json, because the extraction records what each list says but
 * not which picture sits above each entry — and the picture is half of what an
 * amenity is here. Reading the markup gets both in one pass, in the order the
 * origin shows them, and cannot drift from what the page actually renders.
 *
 * The lists overlap and that is the point: Kettle, Laundry, Wi-Fi, Heater, Hot
 * Water and Car Rentel appear on both the home page and work-from-hills, with
 * byte-identical icon files. They become one document each, which is what makes
 * this a collection rather than a list per page.
 *
 * /facilities is the exception — it writes its five items as a bulleted list
 * beside a single photograph, so those have no icon of their own. They are taken
 * from content/amenities.json, since there is no image/label pairing in that
 * markup to read.
 *
 * Spellings are the origin's, misspellings included. "Car Rentel" and "Fine
 * Dinning" are what the live site says; correcting them is now a field an editor
 * can change, which was the point, rather than a silent fix on the way in that
 * would make the CMS and the live site disagree on day one.
 *
 * Creates only. An amenity already in the collection has been through an
 * editor's hands and is left exactly as it is.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(dirname, '../..')
const REPO = path.resolve(APP, '..')

/** The sections that pair a picture with a label, in the order they should be listed. */
const ICON_SECTIONS: { page: string; section: string }[] = [
  { page: 'index', section: 'c9d39f8' },
  { page: 'index', section: '3cca38e' },
  { page: 'index', section: 'b39d718' },
  { page: 'work-from-hills', section: 'c1fbdfa' },
  { page: 'work-from-hills', section: '5ab201a' },
]

/** The group in content/amenities.json whose items the markup cannot supply. */
const LIST_ONLY_GROUP = 'premises-facilities'

export const mirror = (page: string): string =>
  JSON.parse(fs.readFileSync(path.join(APP, 'content/mirror', `${page}.json`), 'utf8')).html

/**
 * A slug from a label.
 *
 * The origin's own spelling is what gets slugged, so "Car Rentel" becomes
 * car-rentel. Correcting the label later does not change the slug, which is
 * right — the slug identifies the item, and renaming a thing does not make it a
 * different thing.
 */
export const slugify = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

type Extracted = { label: string; icon?: string }

/**
 * The picture-and-label pairs inside one section.
 *
 * Elementor puts each pair in its own column as an image widget followed by a
 * heading widget, so the two are matched by walking the section in document
 * order and closing a pair when a heading arrives. A heading with no image
 * before it is still an amenity — it just has no icon — which is why the label
 * is what completes a pair rather than the image.
 */
export function pairsIn(section: string): Extracted[] {
  const found: Extracted[] = []
  const pattern =
    /<img[^>]*src="([^"]+)"[^>]*>|<h2[^>]*class="elementor-heading-title[^"]*"[^>]*>([\s\S]*?)<\/h2>/gi

  let pending: string | undefined
  let match: RegExpExecArray | null

  while ((match = pattern.exec(section))) {
    if (match[1]) {
      pending = match[1]
      continue
    }

    const label = match[2]
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()

    if (label) found.push({ label, icon: pending })
    pending = undefined
  }

  return found
}

/** Every amenity the site shows, once each, in the order the origin lists them. */
function extract(): Extracted[] {
  const bySlug = new Map<string, Extracted>()

  for (const { page, section } of ICON_SECTIONS) {
    const markup = sliceSection(mirror(page), section)
    if (!markup) continue

    for (const item of pairsIn(markup)) {
      const slug = slugify(item.label)
      // First occurrence wins. The repeats carry the same icon, so this is only
      // about which section's ordering the item takes.
      if (!bySlug.has(slug)) bySlug.set(slug, item)
    }
  }

  const groups = JSON.parse(
    fs.readFileSync(path.join(REPO, 'content/amenities.json'), 'utf8'),
  ).groups as { id: string; items: { label: string }[] }[]

  const listOnly = groups.find((group) => group.id === LIST_ONLY_GROUP)
  for (const item of listOnly?.items ?? []) {
    const slug = slugify(item.label)
    if (!bySlug.has(slug)) bySlug.set(slug, { label: item.label })
  }

  return [...bySlug.values()]
}

export async function seedAmenities(
  payload: Payload,
): Promise<{ created: number; skipped: number }> {
  const items = extract()

  let created = 0
  let skipped = 0

  for (const [index, item] of items.entries()) {
    const slug = slugify(item.label)

    const found = await payload.find({
      collection: 'amenities',
      where: { slug: { equals: slug } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    if (found.docs.length) {
      skipped++
      continue
    }

    // The origin points at /media/<file>; findMedia also tries the name without
    // WordPress's -1024x683 suffix, which is the image the copy was cut from.
    const icon = item.icon
      ? await findMedia(payload, path.basename(item.icon.split('?')[0]))
      : undefined

    await payload.create({
      collection: 'amenities',
      data: {
        label: item.label,
        icon,
        slug,
        // Tens rather than ones, so an amenity can be slotted between two others
        // without renumbering everything after it.
        order: (index + 1) * 10,
      },
    })

    created++
  }

  return { created, skipped }
}
