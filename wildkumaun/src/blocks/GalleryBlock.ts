import type { Block } from 'payload'
import { GALLERY_TARGETS, asOptions } from '../lib/sections'
import { link } from '../fields/link'

/**
 * A set of photographs, shown as a carousel, a grid or a thumbnail gallery.
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
 * `gallery` is WordPress's own gallery — square thumbnails with the file's name
 * beneath each. It is a third mode rather than a third block because the choice
 * between them is a matter of how many pictures there are and how much room the
 * section has, which is the page's decision and not a different kind of content.
 *
 * The heading is rendered inside this section when the target says the origin put
 * it there. On most pages Elementor gives a heading a section of its own; the
 * gallery index stacks a heading, a run of thumbnails and a button in one, and a
 * section can only belong to one block.
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
            { label: 'Grid — one picture per column', value: 'grid' },
            { label: 'Gallery — thumbnails with captions', value: 'gallery' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'columns',
          type: 'number',
          defaultValue: 4,
          min: 1,
          max: 6,
          admin: {
            width: '50%',
            condition: (_data, siblingData) => siblingData?.display === 'gallery',
            description: 'How many thumbnails to a row.',
          },
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
      name: 'showButton',
      type: 'checkbox',
      label: 'Show a button under the photographs',
      defaultValue: false,
      admin: {
        description:
          'The gallery index puts an "Explore More" button under each preview, pointing at the full gallery.',
      },
    },
    link({
      name: 'button',
      label: 'Button',
      admin: {
        condition: (_data, siblingData) =>
          Boolean((siblingData as { showButton?: boolean } | undefined)?.showButton),
      },
    }),
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
