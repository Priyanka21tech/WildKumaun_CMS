import type { Block } from 'payload'

/**
 * A run of guest reviews placed on a page.
 *
 * This replaces the `featured` checkbox that used to live on a testimonial. That
 * checkbox answered "does the home page show this one", which is a question about
 * the home page rather than about the review — and it could only ever answer it
 * for one page. A second place wanting a different three had nowhere to say so.
 *
 * Here the page picks: which reviews, in what order, under what heading. The same
 * review can appear on two pages in two different sets, and a review does not
 * carry any opinion about where it is shown.
 *
 * `items` is deliberately the only way to choose. A `limit` alongside it would be
 * a second answer to the same question, and whichever won would surprise whoever
 * used the other.
 */
export const TestimonialsBlock: Block = {
  slug: 'testimonials',

  labels: {
    singular: 'Testimonials',
    plural: 'Testimonials',
  },

  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Sits above the reviews. Leave empty for none.',
      },
    },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      required: true,
      minRows: 1,
      admin: {
        description: 'The reviews to show here, in the order they should appear.',
      },
    },
  ],
}
