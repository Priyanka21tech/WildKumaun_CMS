import type { Block } from 'payload'
import { AMENITY_TARGETS, asOptions } from '../lib/sections'

/**
 * A list of what the property offers, placed on a page.
 *
 * The site shows the same kind of list three different ways, and the difference
 * is presentation rather than content — the same "Wi-fi High Speed" is a small
 * icon in a row of seven on one section and a 400px photograph in a row of three
 * on the next. So `display` is a field here and not a second collection: which
 * items is the page's business, and so is how big they are.
 *
 * `image` belongs only to the list display, where the origin sets a single
 * photograph beside a bulleted list instead of one picture per item. Made
 * conditional rather than always-on, because a field that does nothing in two of
 * three cases is a field that gets filled in and then quietly ignored.
 *
 * `heading` and `subtitle` are here rather than left to the mirror because the
 * origin puts them in their own section directly above — see src/lib/sections.ts.
 * The block owns both, so emptying the heading removes it.
 */
export const AmenitiesBlock: Block = {
  slug: 'amenities',

  labels: {
    singular: 'Amenities',
    plural: 'Amenities',
  },

  fields: [
    {
      name: 'target',
      type: 'select',
      required: true,
      options: asOptions(AMENITY_TARGETS),
      admin: {
        description: 'Which list on the page this replaces.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'heading',
          type: 'text',
          admin: { width: '50%', description: 'Sits above the list. Leave empty for none.' },
        },
        {
          name: 'subtitle',
          type: 'text',
          admin: {
            width: '50%',
            description: 'The line under the heading — "Providing Hospitality the correct way".',
          },
        },
      ],
    },
    {
      name: 'display',
      type: 'select',
      required: true,
      defaultValue: 'icon-grid',
      options: [
        { label: 'Icon grid — seven to a row', value: 'icon-grid' },
        { label: 'Photo grid — three to a row', value: 'photo-grid' },
        { label: 'Bulle e a photograph', value: 'list' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_data, siblingData) => siblingData?.display === 'list',
        description: 'The photograph shown beside the list.',
      },
    },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'amenities',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: {
        description: 'What to list here, in the order it should appear.',
      },
    },
  ],
}
