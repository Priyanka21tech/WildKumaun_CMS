import type { Payload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Put the extracted guest reviews into the Testimonials collection.
 *
 * The ten come from the guest book. Three of them also appear in the home page's
 * slider, and those become the home page's testimonials block — which reviews are
 * shown there is the page's decision, so it is recorded on the page rather than on
 * the reviews. Which three is read out of the mirrored markup rather than listed
 * here, so it stays in step if the extraction is rerun.
 *
 * The slider holds a fourth slide with a quote and no name against it. It is not
 * carried over: a review with nobody attached is not a review, and reproducing it
 * would mean an entry in the collection that an editor cannot make sense of.
 *
 * Creates only. A review already in the collection is left as it is, and a page
 * that already has a layout keeps it.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(dirname, '../../..')

type Extracted = {
  id: string
  name: string
  quote: string
  rating?: number
  source?: string
}

/** The names the home page's slider shows, read out of the mirrored markup. */
function featuredNames(): Set<string> {
  const file = path.join(REPO, 'wildkumaun/content/mirror/index.json')
  if (!fs.existsSync(file)) return new Set()

  const html = JSON.parse(fs.readFileSync(file, 'utf8')).html as string
  const names = [...html.matchAll(/class="eael-testimonial-user"><b>\s*([^<]*)</g)].map((m) =>
    m[1].trim(),
  )
  return new Set(names.filter(Boolean))
}

export async function seedTestimonials(
  payload: Payload,
): Promise<{ created: number; skipped: number }> {
  const doc = JSON.parse(fs.readFileSync(path.join(REPO, 'content/testimonials.json'), 'utf8'))
  const items = (doc.testimonials ?? []) as Extracted[]

  const featured = featuredNames()

  let created = 0
  let skipped = 0

  for (const [index, item] of items.entries()) {
    const found = await payload.find({
      collection: 'testimonials',
      where: { slug: { equals: item.id } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    if (found.docs.length) {
      skipped++
      continue
    }

    await payload.create({
      collection: 'testimonials',
      data: {
        name: item.name,
        quote: item.quote,
        rating: item.rating,
        source: item.source,
        slug: item.id,
        // Tens, so a review can be slotted between two others without
        // renumbering everything after it.
        order: (index + 1) * 10,
      },
    })
    created++
  }

  await seedHomeTestimonialsBlock(payload, featured)

  return { created, skipped }
}

/**
 * Give the home page the block that shows its three reviews.
 *
 * Only when the page has no layout yet. A page whose layout has been touched in
 * the admin panel is left alone — the whole point of moving this off the review
 * and onto the page is that the page now decides.
 */
async function seedHomeTestimonialsBlock(payload: Payload, names: Set<string>): Promise<void> {
  const home = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    pagination: false,
    depth: 0,
  })

  const page = home.docs[0]
  if (!page || (page.layout?.length ?? 0) > 0) return

  const chosen = await payload.find({
    collection: 'testimonials',
    where: { name: { in: [...names] } },
    limit: 0,
    pagination: false,
    sort: 'order',
    depth: 0,
  })

  if (!chosen.docs.length) return

  await payload.update({
    collection: 'pages',
    id: page.id,
    data: {
      layout: [
        {
          blockType: 'testimonials',
          heading: 'TESTIMONIALS',
          items: chosen.docs.map((doc) => doc.id),
        },
      ],
    },
  })

  payload.logger.info(`Gave the home page a testimonials block with ${chosen.docs.length} reviews`)
}
