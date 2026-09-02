import type { Payload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { findMedia } from './page-content'

/**
 * Put the four packages the home page advertises into the collection.
 *
 * content/packages.json is the source here rather than the markup, unlike the
 * amenities: the extraction already holds the blurb, the image and the durations
 * accurately, and the card's prose is wrapped in enough nested Elementor markup
 * that reading it back out would be guesswork for no gain.
 *
 * The link is seeded as the origin has it, which is worth being explicit about:
 * all four cards point at the enquiry anchor, `#quiry`, and none of them link to
 * a detail page. Two of them — Work from Hills and the birding tour — do have a
 * page behind them, and linking the cards to those pages would be an
 * improvement. It would also be a change to what the site does, made silently
 * during a migration, which is exactly the kind of change that makes a migration
 * impossible to verify. The field is now editable, so it is a decision someone
 * can make deliberately.
 *
 * Creates only. A package already in the collection is left as it is.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(dirname, '../../..')

type ExtractedPackage = {
  id: string
  title: string
  blurb: string
  image: string
  cta?: { label?: string; href?: string }
  durations?: string[]
}

export async function seedPackages(
  payload: Payload,
): Promise<{ created: number; skipped: number }> {
  const doc = JSON.parse(fs.readFileSync(path.join(REPO, 'content/packages.json'), 'utf8'))
  const packages = (doc.packages ?? []) as ExtractedPackage[]

  let created = 0
  let skipped = 0

  for (const [index, item] of packages.entries()) {
    const found = await payload.find({
      collection: 'packages',
      where: { slug: { equals: item.id } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    if (found.docs.length) {
      skipped++
      continue
    }

    const image = await findMedia(payload, path.basename(item.image.split('?')[0]))
    if (!image) {
      // The image is required on the collection, so a package whose picture was
      // never imported cannot be created. Skipping is better than inventing a
      // placeholder that would then need finding again.
      skipped++
      continue
    }

    const href = item.cta?.href ?? ''
    const anchor = href.startsWith('#') ? href.slice(1) : undefined

    await payload.create({
      collection: 'packages',
      data: {
        title: item.title,
        blurb: item.blurb,
        image,
        link: {
          // Every card is an in-page jump to the enquiry form, which is `none`
          // plus an anchor — there is no page being linked to.
          type: anchor ? 'none' : 'custom',
          label: item.cta?.label ?? 'Enquiry',
          anchor,
          url: anchor ? undefined : href || undefined,
        },
        durations: (item.durations ?? []).map((label) => ({ label })),
        slug: item.id,
        order: (index + 1) * 10,
      },
    })

    created++
  }

  return { created, skipped }
}
