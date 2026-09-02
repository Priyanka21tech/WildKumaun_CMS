import type { CollectionConfig } from 'payload'
import { link } from '../fields/link'

/**
 * What the property sells: a stay, a tour, a weekend.
 *
 * The home page shows all four as cards, and two of them — Work from Hills and
 * the 5N/6D birding tour — have a page of their own behind the card. That is why
 * a package is a document and not four cards typed into the home page: the card
 * and the page it opens are the same offering, and its name should be written
 * once.
 *
 * `link` is the shared link field rather than a text href, so a card points at
 * the Page document for its detail page. The origin typed `#quiry` and
 * `work-from-hills.html` into the markup; as a reference, a slug can change
 * without the card breaking, and Payload knows the card exists before anyone
 * deletes the page. Two of the four have no detail page and open the enquiry
 * anchor instead, which the link field's `anchor` covers.
 *
 * `durations` is on the package rather than in a block because it belongs to the
 * offering — Work from Hills is sold by the week or the month wherever it is
 * shown. It is empty for the other three, which is the honest answer for an
 * offering that is not sold that way, rather than a field made required to look
 * consistent.
 */
export const Packages: CollectionConfig = {
  slug: 'packages',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'updatedAt'],
    description: 'Stays and tours. A page shows a set of them with a packages block.',
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'blurb',
      type: 'textarea',
      required: true,
      admin: { description: 'The paragraph on the card.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    // `allowNone` because every card today is an in-page jump to the enquiry
    // form rather than a link to a page — see the note above and src/fields/link.ts,
    // where `none` plus an anchor is what the site's own in-page jumps use.
    link({ name: 'link', label: 'Card button', allowNone: true }),
    {
      name: 'durations',
      type: 'array',
      labels: { singular: 'Duration', plural: 'Durations' },
      fields: [{ name: 'label', type: 'text', required: true }],
      admin: {
        description:
          'How long it can be booked for — "A Week", "1 Month". Leave empty for a package not sold by length.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Identifies this package in the page markup. Rarely needs changing.',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Low numbers first. Leave gaps so a package can be slotted in later.',
      },
    },
  ],
}
