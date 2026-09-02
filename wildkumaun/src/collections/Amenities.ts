import type { CollectionConfig } from 'payload'

/**
 * The things the property offers, as named items with an icon.
 *
 * One collection rather than one list per page, because the lists overlap: the
 * home page's thirteen and work-from-hills' seven share six items, and every one
 * of those shares its icon file too — `kettle-img-…png` is the same image in both
 * places. Kept per page, "Kettle" would be written twice and its icon swapped
 * twice, and the two would drift.
 *
 * Activities live here as well — Yoga, Hiking, Nature Walk. They are not
 * amenities by name, but they are the same thing structurally and the origin
 * renders them with the same markup, so splitting them into a second collection
 * would buy a more accurate label and cost a duplicate of everything around it.
 *
 * `icon` is optional because one of the three lists has none: /facilities writes
 * its items as a plain bulleted list beside a single photograph. An item with no
 * icon is not broken, it is an item shown somewhere that does not use icons.
 *
 * Spellings are the origin's — "Car Rentel", "Fine Dinning", "Kichen and
 * Dinning". They are wrong and they are what the live site says; correcting them
 * is now a field an editor can edit, which is the point, but it is their call
 * rather than a silent fix on the way in.
 */
export const Amenities: CollectionConfig = {
  slug: 'amenities',

  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'order', 'updatedAt'],
    description:
      'Amenities, facilities and activities. A page picks which to show with an amenities block.',
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
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'What it is called on the site — "Hot Water", "Nature Walk".' },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'The picture shown above the label. Leave empty for items that only ever appear in a plain list.',
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
        description: 'Identifies this item in the page markup. Rarely needs changing.',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'The order they are listed in here. A block can still choose its own order for one page.',
      },
    },
  ],
}
