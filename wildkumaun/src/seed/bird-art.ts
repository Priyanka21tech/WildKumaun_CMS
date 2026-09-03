import type { Payload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { findMedia } from './page-content'

/**
 * Put the paintings into the Bird Art collection.
 *
 * content/bird-art.json is the source rather than the markup, because the markup
 * does not hold what makes these documents worth having. The origin's gallery
 * captions each picture with its filename — the page reads
 * "Long-tailed-Minivet-1" where it means "Long-tailed Minivet" — so reading the
 * page back would import the filenames as titles and preserve the very thing
 * this fixes. The extraction has the real names.
 *
 * `altImage` is where the same canvas was photographed twice. Six of the eleven
 * are, and the origin shows both; they are one artwork with two pictures rather
 * than two artworks that would both need renaming.
 *
 * Creates only. A painting already in the collection keeps its title.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(dirname, '../../..')

type Artwork = {
  id: string
  title: string
  image: string
  altImage?: string
}

export async function seedBirdArt(
  payload: Payload,
): Promise<{ created: number; skipped: number }> {
  const doc = JSON.parse(fs.readFileSync(path.join(REPO, 'content/bird-art.json'), 'utf8'))
  const artworks = (doc.artworks ?? []) as Artwork[]
  const artist = (doc.artists ?? []).find((a: { id: string }) => a.id === 'abha')?.fullName

  let created = 0
  let skipped = 0

  for (const [index, item] of artworks.entries()) {
    const found = await payload.find({
      collection: 'bird-art',
      where: { slug: { equals: item.id } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    if (found.docs.length) {
      skipped++
      continue
    }

    const image = await findMedia(payload, path.basename(item.image))
    if (!image) {
      // The picture is required, so a painting whose file was never imported
      // cannot be created. Skipping beats inventing a placeholder.
      skipped++
      continue
    }

    const altImage = item.altImage
      ? await findMedia(payload, path.basename(item.altImage))
      : undefined

    await payload.create({
      collection: 'bird-art',
      data: {
        title: item.title,
        image,
        altImage,
        artist,
        slug: item.id,
        order: (index + 1) * 10,
      },
    })

    created++
  }

  return { created, skipped }
}
