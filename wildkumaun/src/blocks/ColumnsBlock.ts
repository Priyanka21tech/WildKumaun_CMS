import type { Block } from 'payload'
import { COLUMN_TARGETS, asOptions } from '../lib/sections'

/**
 * A row of short columns, each a title and a line or two under it.
 *
 * /work-from-hills has two of these side by side: How to Reach sets By Air, By
 * Rail and By Road in their own thirds, and Duration does the same with A Week,
 * 2 Week and 1 Month. A text block cannot hold them — it has one body, and
 * putting three columns' worth of prose in it would render them stacked, which
 * is a redesign rather than a migration.
 *
 * An array rather than a collection, because nothing here repeats. An amenity is
 * a document because "Hot Water" appears on two pages with the same icon; "By
 * Rail" appears once and means nothing anywhere else, so a collection would buy
 * a shared vocabulary nobody shares.
 *
 * `heading` is the words above the row. The origin writes it as a widget beside
 * the columns rather than in a section of its own, so the block reaches it with
 * replaceWidget — see src/lib/elementor.ts. Emptying it removes the heading.
 *
 * Each item's own `heading` is optional because Duration has none: its columns
 * are a line of text and nothing else.
 */
export const ColumnsBlock: Block = {
  slug: 'columns',

  labels: {
    singular: 'Columns',
    plural: 'Columns',
  },

  fields: [
    {
      name: 'target',
      type: 'select',
      required: true,
      options: asOptions(COLUMN_TARGETS),
      admin: { description: 'Which row of columns on the page this replaces.' },
    },
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Sits above the row — "How to Reach". Leave empty for none.',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Column', plural: 'Columns' },
      admin: {
        description: 'One entry per column, in the order they should read across the page.',
      },
      fields: [
        {
          name: 'heading',
          type: 'text',
          admin: {
            description: 'The column\'s own title — "By Air". Leave empty where it has none.',
          },
        },
        {
          name: 'body',
          type: 'richText',
          admin: { description: 'What the column says.' },
        },
      ],
    },
  ],
}
