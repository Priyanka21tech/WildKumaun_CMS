import type { CollectionConfig } from 'payload'

/**
 * What guests have said, as gathered from the site's Google reviews.
 *
 * Two pages show them and they show them differently: the guest book lists all
 * ten in a two-column grid, the home page rotates a few in a slider. That is why
 * this is one collection rather than content sitting on either page — the same
 * review appears twice, and it should not have to be written twice.

 *
 * A review says nothing about where it appears. That used to be a `featured`
 * checkbox meaning "the home page shows this one", which was the home page's
 * business filed under the review, and could only ever speak for one page. The
 * testimonials block on a page picks its own, so a second page wanting a different
 * three has somewhere to say so.
 *
 * `quote` is plain text on purpose. These are somebody else's words, quoted; an
 * editor should be able to correct a typo, not italicise half of a review. It
 * also keeps both renderers simple, since each page wraps the text in its own
 * markup.
 *
 * `rating` and `source` are recorded but not shown anywhere. The origin displays
 * neither — no stars, no "via Google" — and they are kept because they are true
 * of the review and a later design will likely want them, not because anything
 * reads them today.
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order', 'updatedAt'],
    description: 'Guest reviews. The guest book lists them all; a page picks which to show with a testimonials block.',
  },

  defaultSort: 'order',

  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Who wrote it.' },
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rating',
          type: 'number',
          min: 1,
          max: 5,
          admin: { width: '50%', description: 'Recorded, not currently shown on the site.' },
        },
        {
          name: 'source',
          type: 'text',
          admin: { width: '50%', description: 'Where it was left — "Google Reviews".' },
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Identifies this review in the page markup. Rarely needs changing.',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Low numbers first. Leave gaps so a review can be slotted in later.',
      },
    },
  ],
}
