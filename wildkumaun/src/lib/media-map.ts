import type { Payload } from 'payload'

/**
 * What each image in the Media collection can be served as.
 *
 * The mirrored markup asks for the WordPress originals — 1920px photographs shown
 * in a 400px slot, 5MB of them on the home page alone. Payload already generated
 * a 300, a 900 and a 1400 of every one when the images were imported, and they
 * are sitting in public/media unused. This is the index that lets the markup be
 * pointed at them.
 *
 * `og` is left out of the srcset: it is cropped to 1200x630 for social previews,
 * so offering it as a width would let the browser pick a differently framed image.
 *
 * Cached for a minute rather than for the life of the process, so replacing an
 * image in the admin panel shows up without a restart, and the 273-row query
 * still runs about once however many requests arrive.
 */

export type SizeSet = {
  /** What `src` should point at — the largest generated size. */
  src: string
  /** Widths the browser can choose between, or '' when only one size exists. */
  srcset: string
}

export type MediaMap = {
  /** Keyed by the original filename, e.g. `bird-hide.jpg`. */
  sizes: Map<string, SizeSet>
  /** Changes whenever the map is rebuilt, so derived caches can key off it. */
  version: number
}

const TTL_MS = 60_000

let cached: { at: number; map: MediaMap } | null = null
let version = 0

type SizeRow = { filename?: string | null; width?: number | null }

export async function getMediaMap(payload: Payload): Promise<MediaMap> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.map

  const { docs } = await payload.find({
    collection: 'media',
    limit: 0,
    pagination: false,
    depth: 0,
    select: { filename: true, sizes: true },
  })

  const sizes = new Map<string, SizeSet>()

  for (const doc of docs as Array<{ filename?: string | null; sizes?: Record<string, SizeRow> }>) {
    if (!doc.filename) continue

    // Smallest first, so the srcset reads in ascending width order.
    const candidates = (['thumbnail', 'medium', 'large'] as const)
      .map((name) => doc.sizes?.[name])
      .filter((size): size is SizeRow => Boolean(size?.filename && size?.width))

    // Payload skips a size wider than the original, so an image with nothing above
    // the 300 thumbnail is already small. Retargeting that one would replace it
    // with something smaller than it is now, which is the opposite of the point.
    const largest = candidates[candidates.length - 1]
    if (!largest || (largest.width ?? 0) < 900) continue

    sizes.set(doc.filename, {
      src: `/media/${largest.filename}`,
      srcset:
        candidates.length > 1
          ? candidates.map((size) => `/media/${size.filename} ${size.width}w`).join(', ')
          : '',
    })
  }

  version++
  const map: MediaMap = { sizes, version }
  cached = { at: Date.now(), map }
  return map
}
