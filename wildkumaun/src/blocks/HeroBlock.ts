import type { Block } from 'payload'

/**
 * The rotating banner at the top of the home page.
 *
 * The last part of the page that could not be changed without editing a file,
 * and the most visible. Five slides, each a photograph with a line of text over
 * it, rotating every few seconds.
 *
 * It is a block rather than fields on the page because the number of slides is
 * the editor's to choose. A `slide1Image`, `slide2Image` set of fields would fix
 * it at whatever the origin happened to have.
 *
 * `caption` is plain text, not rich text. Every slide the origin wrote is one
 * sentence in one style, set in Sevillana at 30px over a translucent band, and
 * rich text here would offer formatting that the band's styling would then fight
 * with. A slide with no caption is a photograph on its own, which is what the
 * origin's fifth slide is.
 *
 * The rotation itself is not configurable, unlike the gallery carousel. There is
 * one hero on the site and its timing is a design decision that was made once;
 * exposing a speed field would be offering a choice nobody needs to make.
 */
export const HeroBlock: Block = {
  slug: 'hero',

  labels: {
    singular: 'Hero',
    plural: 'Heroes',
  },

  fields: [
    {
      name: 'slides',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Slide', plural: 'Slides' },
      admin: {
        description: 'The banner slides, in the order they should rotate.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description:
              'Fills the whole banner, cropped to fit. A wide photograph works best — a tall one will be cut off top and bottom.',
          },
        },
        {
          name: 'caption',
          type: 'textarea',
          admin: {
            description: 'The line of text over the photograph. Leave empty for a picture alone.',
          },
        },
      ],
    },
  ],
}
