import type { Block } from 'payload'
import { MAP_TARGETS, asOptions } from '../lib/sections'

/**
 * The map on the contact page.
 *
 * A place to search for rather than an embed URL to paste. Google's embed
 * address carries a query, a map type, a zoom and an output mode in one string,
 * and asking an editor to keep that intact to move the pin is asking them to
 * edit a URL by hand. The renderer builds it from these two fields instead.
 *
 * It also means the page cannot be made to embed something else. A free-text
 * iframe source is a hole: whatever is typed there is loaded inside the site,
 * and an editor pasting a link they were sent is exactly how that goes wrong.
 *
 * Not read from Site Settings, even though there is a map link there. That one
 * is `https://g.page/SattalBirding?share`, a link for opening the listing — it
 * is not embeddable, and the two are different things despite both being "the
 * map".
 */
export const MapBlock: Block = {
  slug: 'map',

  labels: {
    singular: 'Map',
    plural: 'Maps',
  },

  fields: [
    {
      name: 'target',
      type: 'select',
      required: true,
      options: asOptions(MAP_TARGETS),
      admin: { description: 'Which map on the page this replaces.' },
    },
    {
      name: 'query',
      type: 'text',
      required: true,
      admin: {
        description: 'What to search for — a place name or an address.',
      },
    },
    {
      name: 'zoom',
      type: 'number',
      required: true,
      defaultValue: 10,
      min: 1,
      max: 20,
      admin: { description: 'Higher is closer in. 10 shows the surrounding area.' },
    },
    {
      name: 'label',
      type: 'text',
      admin: {
        description:
          "Describes the map to a screen reader — what it shows, not that it is a map. Falls back to the search term.",
      },
    },
  ],
}
