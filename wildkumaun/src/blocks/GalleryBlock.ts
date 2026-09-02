import type { Block } from 'payload'
import { GALLERY_TARGETS, asOptions } from '../lib/sections'

/**
 * A set of photographs, shown as a carousel or a grid.
 *
 * No collection behind this one. The photographs are already Media documents —
 * that is what the media library is — and a Gallery collection would only be a
 * list of ids pointing at them, kept in step by hand. `images` is that list, on
 * the page that shows it, where the choice actually belongs.
 *
 * `display` and `slidesToShow` replace what the origin wrote into the markup as
 * Elementor `data-*` attributes, which src/components/Enhancements.jsx currently
 * reads back off the page to drive the carousel. The renderer emits the same
 * attributes from these fields, so src/lib/carousel.js and the adapter that feeds
 * it keep working untouched — the settings move into the CMS without the carousel
 * engine being rewritten, which is a separate job and a much riskier one.
 *
 * `slidesToShow` is the desktop count only. The two narrower breakpoints are
 * derived from it in the renderer rather than being three fields, because the
 * origin's carousels all step down the same way and three numbers to fill in for
 * every gallery is three chances to make one of them wrong.
 */
export const GalleryBlock: Block = {
  slug: 'gallery',

  labels: {
    singular: 'Gallery',
    plural: 'Galleries',
  },

  fields: [
    {
      name: 'target',
      type: 'select',
      required: true,
      options: asOptions(GALLERY_TARGETS),
      admin: { description: 'Which gallery on the page this replaces.' },
    },
    {
      name: 'heading',
      type: 'text',
      admin: { description: 'Sits above the photographs. Leave empty for none.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'display',
          type: 'select',
          required: true,
          defaultValue: 'carousel',
          options: [
            { label: 'Carousel', value: 'carousel' },
            { label: 'Grid', value: 'grid' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'slidesToShow',
          type: 'number',
          defaultValue: 4,
          min: 1,
          max: 8,
          admin: {
            width: '50%',
            condition: (_data, siblingData) => siblingData?.display === 'carousel',
            description: 'How many are visible at once on a desktop screen.',
          },
        },
      ],
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: { description: 'The photographs, in the order they should appear.' },
    },
  ],
}
