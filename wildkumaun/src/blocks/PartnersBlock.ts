import type { Block } from 'payload'
import { PARTNER_TARGETS, asOptions } from '../lib/sections'

/**
 * The logos of the organisations the property works with.
 *
 * An array rather than a collection, unlike amenities and packages. A partner
 * appears in exactly one place on the site and there is nothing to know about one
 * beyond its logo, its name and where it links — nothing that another page could
 * reuse and nothing that could drift out of step. A collection would add a
 * document type, an admin list and a relationship to manage, and give back
 * nothing that this array does not already do.
 *
 * `name` is not shown; the origin renders the logos alone. It is stored because
 * a logo with no name is an image nobody can identify in the media library, and
 * because it is what the image's alt text should say.
 */
export const PartnersBlock: Block = {
  slug: 'partners',

  labels: {
    singular: 'Partners',
    plural: 'Partners',
  },

  fields: [
    {
      name: 'target',
      type: 'select',
      required: true,
      options: asOptions(PARTNER_TARGETS),
      admin: { description: 'Which logo strip on the page this replaces.' },
    },
    {
      name: 'heading',
      type: 'text',
      admin: { description: 'Sits above the logos. Leave empty for none.' },
    },
    {
      name: 'logos',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Partner', plural: 'Partners' },
      admin: { description: 'The logos, in the order they should appear.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true, admin: { width: '50%' } },
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
                description: 'Not shown on the page. Used as the logo’s alt text.',
              },
            },
          ],
        },
        {
          name: 'url',
          type: 'text',
          admin: { description: 'Optional. Where the logo links to, including https://.' },
        },
      ],
    },
  ],
}
