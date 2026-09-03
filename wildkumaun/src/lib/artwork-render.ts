import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { ARTWORK_TARGETS, targetFor } from './sections'
import type { MediaMap } from './media-map'
import { asMedia, column, img, imageWidget, responsive, widget } from './widgets'
import type { MediaDoc } from './widgets'

/**
 * Put the paintings, or the artists, on the bird art page.
 *
 * The paintings render as WordPress's gallery — the same markup the photograph
 * galleries use, so the page keeps the layout it has. What changes is the
 * caption: the origin captions each picture with its filename, so it reads
 * "Long-tailed-Minivet-1" where it means "Long-tailed Minivet". Here the caption
 * is the artwork's title, which is the whole reason these are documents.
 *
 * `altImage` is a second photograph of the same canvas. Six of the eleven have
 * one, and the origin shows both — so both are emitted, under one title.
 */

type ArtworkDoc = {
  title?: string | null
  image?: unknown
  altImage?: unknown
}

type Person = {
  image?: unknown
  name?: string | null
}

export type ArtworkBlockValue = {
  target?: string | null
  display?: string | null
  columns?: number | null
  items?: (number | ArtworkDoc)[] | null
  people?: Person[] | null
}

export function replaceArtwork(html: string, block: ArtworkBlockValue, map: MediaMap): string {
  const target = targetFor(ARTWORK_TARGETS, block.target)
  if (!target?.item) return html

  if (block.display === 'artists') return renderArtists(html, block, target, map)

  const items = (block.items ?? []).filter(
    (item): item is ArtworkDoc => typeof item === 'object' && item !== null,
  )
  if (!items.length || !target.item.image) return html

  // A painting with a second photograph contributes both, captioned the same.
  const pictures = items.flatMap((item) => {
    const title = item.title ?? ''
    return [asMedia(item.image), asMedia(item.altImage)]
      .filter((media): media is MediaDoc => Boolean(media?.filename))
      .map((media) => ({ media, title }))
  })

  if (!pictures.length) return html

  return replaceContainer(
    html,
    target.section,
    responsive(
      column(
        target.span,
        thumbnails(target.item.image, pictures, block.columns ?? 4),
        target.columns?.[0],
      ),
      map,
    ),
  )
}

/** A portrait and a name, one to a column. */
function renderArtists(
  html: string,
  block: ArtworkBlockValue,
  target: NonNullable<ReturnType<typeof targetFor>>,
  map: MediaMap,
): string {
  const people = (block.people ?? []).filter((person) => asMedia(person.image)?.filename)
  if (!people.length) return html

  const hashes = target.item ?? {}

  const columns = people
    .map((person, index) => {
      const media = asMedia(person.image) as MediaDoc
      const parts = [
        hashes.image ? imageWidget(target.itemWidgets?.[index] ?? hashes.image, media) : '',
        hashes.label && person.name
          ? widget(
              target.labelWidgets?.[index] ?? hashes.label,
              'heading',
              `<h2 class="elementor-heading-title elementor-size-default">${esc(person.name)}</h2>`,
            )
          : '',
      ].join('')

      return column(target.span, parts, target.columns?.[index])
    })
    .join('')

  return replaceContainer(html, target.section, responsive(columns, map))
}

/**
 * WordPress's gallery markup, captioned with the artwork's own title.
 *
 * Same shape as the photograph galleries in gallery-render.ts — the difference is
 * only where the caption comes from, which is the point of the collection.
 */
function thumbnails(
  hash: string,
  pictures: { media: MediaDoc; title: string }[],
  columns: number,
): string {
  const items = pictures
    .map((picture, index) => {
      const id = `gallery-${hash}-${index + 1}`

      return `<figure class="gallery-item">
<div class="gallery-icon landscape">${img({ ...picture.media, alt: picture.title }, 'attachment-full size-full').replace('<img', `<img aria-describedby="${id}"`)}</div>
<figcaption class="wp-caption-text gallery-caption" id="${id}">${esc(picture.title)}</figcaption>
</figure>`
    })
    .join('')

  return `<div class="elementor-element elementor-element-${hash} gallery-spacing-custom elementor-widget elementor-widget-image-gallery" data-element_type="widget" data-id="${hash}" data-widget_type="image-gallery.default">
<div class="elementor-widget-container">
<div class="elementor-image-gallery">
<div class="gallery gallery-columns-${columns} gallery-size-full" id="gallery-${hash}">${items}</div>
</div>
</div>
</div>`
}
