import type { GlobalConfig } from 'payload'
import { link } from '../fields/link'

/**
 * The strip at the bottom of every page.
 *
 * The live footer is deliberately thin — three phone numbers, an email address
 * and "WildKumaon, Sattal". None of that is configured here: those come from Site
 * Settings, from the numbers marked "show in footer" and from the short address,
 * so a number is edited in one place and changes everywhere it appears.
 *
 * What is here is what belongs to the footer alone: whether to show each of those
 * blocks, the legal line, and a set of link columns the current footer does not
 * have but is the obvious next thing to want.
 */
export const Footer: GlobalConfig = {
  slug: 'footer',

  admin: {
    description: 'What the bottom of every page shows. Contact details come from Site Settings.',
  },

  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },

  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'showPhones',
          type: 'checkbox',
          label: 'Show phone numbers',
          defaultValue: true,
          admin: { width: '33%' },
        },
        {
          name: 'showEmail',
          type: 'checkbox',
          label: 'Show email',
          defaultValue: true,
          admin: { width: '33%' },
        },
        {
          name: 'showAddress',
          type: 'checkbox',
          label: 'Show address',
          defaultValue: true,
          admin: { width: '34%' },
        },
      ],
    },
    {
      name: 'columns',
      type: 'array',
      label: 'Link columns',
      labels: { singular: 'Column', plural: 'Columns' },
      admin: {
        description:
          'Optional. The live footer has none; add one to group links under a heading.',
        initCollapsed: true,
      },
      fields: [
        { name: 'heading', type: 'text' },
        {
          name: 'links',
          type: 'array',
          labels: { singular: 'Link', plural: 'Links' },
          fields: [link({ label: 'Destination' })],
        },
      ],
    },
    {
      name: 'legal',
      type: 'text',
      label: 'Legal line',
      admin: {
        description:
          'The copyright line. Leave empty to show none. A © and the current year are added by the site.',
      },
    },
  ],
}
