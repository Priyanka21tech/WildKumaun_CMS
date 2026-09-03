import type { Block } from 'payload'
import { ARTWORK_TARGETS, asOptions } from '../lib/sections'

/**
 * Paintings, or the people who painted them.
 *
 * Two shapes on one page and therefore one block with two modes, the same way
 * the amenities block covers three: a run of captioned paintings, and a row of
 * portraits with a name under each.
 *
 * `items` points at the Bird Art collection so a painting's name comes from the
 * painting. `people` is a plain array, because the two artists appear in exactly
 * one place and there is nothing else about them to know — the same reasoning the
 * partner logos are an array rather than a collection.
 */
export const ArtworkBlock: Block = {
  slug: 'artwork',

  labels: {
    singular: 'Artwork',
    plural: 'Artwork',
  },

  fields: [
    {
      name: 'target',
      type: 'select',
      required: true,
      options: asOptions(ARTWORK_TARGETS),
      admin: { description: 'Which run on the page this replaces.' },
    },
    {
      name: 'display',
      type: 'select',
      required: true,
      defaultValue: 'paintings',
      options: [
        { label: 'Paintings — captioned with their titles', value: 'paintings' },
        { label: 'Artists — a portrait and a name', value: 'artists' },
      ],
    },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'bird-art',
      hasMany: true,
      admin: {
        condition: (_data, siblingData) => siblingData?.display !== 'artists',
        description: 'The paintings to show, in the order they should appear.',
      },
    },
    {
      name: 'columns',
      type: 'number',
      defaultValue: 4,
      min: 1,
      max: 6,
      admin: {
        condition: (_data, siblingData) => siblingData?.display !== 'artists',
        description: 'How many paintings to a row.',
      },
    },
    {
      name: 'people',
      type: 'array',
      labels: { singular: 'Artist', plural: 'Artists' },
      admin: {
        condition: (_data, siblingData) => siblingData?.display === 'artists',
        description: 'The artists, in the order they should appear.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: { width: '50%', description: 'Shown under the portrait.' },
            },
          ],
        },
      ],
    },
  ],
}
