import type { Block } from 'payload'
import { PACKAGE_TARGETS, asOptions } from '../lib/sections'

/**
 * A run of package cards placed on a page.
 *
 * Same reasoning as the testimonials block: the page says which packages it
 * shows and in what order, and a package carries no opinion about where it
 * appears. A `featured` flag on the package would answer "does the home page
 * show this", which is the home page's question filed in the wrong place and
 * unanswerable for a second page wanting a different set.
 *
 * There is no `limit` beside `items` on purpose. Two ways to say how many
 * cards appear is one way too many, and whichever won would surprise whoever
 * used the other.
 */
export const PackagesBlock: Block = {
  slug: 'packages',

  labels: {
    singular: 'Packages',
    plural: 'Packages',
  },

  fields: [
    {
      name: 'target',
      type: 'select',
      required: true,
      options: asOptions(PACKAGE_TARGETS),
      admin: { description: 'Which run of cards on the page this replaces.' },
    },
    {
      name: 'heading',
      type: 'text',
      admin: { description: 'Sits above the cards. Leave empty for none.' },
    },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'packages',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: { description: 'The packages to show here, in the order they should appear.' },
    },
  ],
}
