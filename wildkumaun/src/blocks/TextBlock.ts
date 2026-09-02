import type { Block } from 'payload'
import { TEXT_TARGETS, asOptions } from '../lib/sections'
import { link } from '../fields/link'

/**
 * A run of the page's own words, in a section that holds nothing else.
 *
 * Four sections on the home page are copy and only copy — a heading, a
 * paragraph, sometimes a button beneath. They are one block rather than four
 * because the difference between them is which of those three parts they happen
 * to use, which is a matter of leaving a field empty.
 *
 * Not the same thing as the content block. That one replaces a whole page's
 * body, for pages the origin built as ordinary WordPress copy; this replaces one
 * Elementor section on a page that has twenty-four others. A page can carry
 * several of these and still be mostly mirror.
 *
 * `images` fills the empty half of a split section with a small carousel, which
 * is what the about section does. On a full-width target it has nowhere to go
 * and is hidden, rather than being offered and then ignored.
 */
export const TextBlock: Block = {
  slug: 'text',

  labels: {
    singular: 'Text',
    plural: 'Text',
  },

  fields: [
    {
      name: 'target',
      type: 'select',
      required: true,
      options: asOptions(TEXT_TARGETS),
      admin: { description: 'Which run of copy on the page this replaces.' },
    },
    {
      name: 'heading',
      type: 'text',
      admin: { description: 'Sits above the text. Leave empty for none.' },
    },
    {
      name: 'body',
      type: 'richText',
      admin: { description: 'The paragraphs themselves.' },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description:
          'Optional. Shown as a small carousel beside the text, on the sections laid out in two halves.',
      },
    },
    {
      name: 'showButton',
      type: 'checkbox',
      label: 'Show a button',
      defaultValue: false,
    },
    link({
      name: 'button',
      label: 'Button',
      admin: {
        condition: (_data, siblingData) =>
          Boolean((siblingData as { showButton?: boolean } | undefined)?.showButton),
      },
    }),
  ],
}
