import type { Block } from 'payload'
import { FORM_TARGETS, asOptions } from '../lib/sections'
import { link } from '../fields/link'

/**
 * A form on a page, and the copy beside it.
 *
 * The form itself is a document in the Forms collection, not fields here. Which
 * questions the enquiry form asks is a thing about the enquiry form, and the
 * same form appears in three places on this site — the home page, /contact-us
 * and /enquiry. Defined per block it would be three forms to keep in step, and
 * three sets of submissions to read separately.
 *
 * The `aside` fields are the block's own because they belong to the placement
 * rather than the form: the home page says "Want to know more about your stay"
 * and offers a booking button next to it, which is the home page talking, not
 * the enquiry form.
 *
 * The divider between the copy and the button is not a field. It is a rule with
 * the word "Or" on it, it is there whenever there is a button to separate, and
 * making it optional would be offering a choice that only has one sensible
 * answer.
 */
export const FormBlock: Block = {
  slug: 'form',

  labels: {
    singular: 'Form',
    plural: 'Forms',
  },

  fields: [
    {
      name: 'target',
      type: 'select',
      required: true,
      options: asOptions(FORM_TARGETS),
      admin: { description: 'Which form on the page this replaces.' },
    },
    {
      name: 'heading',
      type: 'text',
      admin: { description: 'Sits above the form. Leave empty for none.' },
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: { description: 'The form to show. Its questions are edited in Forms.' },
    },
    {
      name: 'asideHeading',
      type: 'text',
      admin: { description: 'The heading in the half beside the form.' },
    },
    {
      name: 'asideBody',
      type: 'richText',
      admin: { description: 'The copy under that heading.' },
    },
    {
      name: 'showAsideButton',
      type: 'checkbox',
      label: 'Show a button beside the form',
      defaultValue: false,
    },
    link({
      name: 'asideButton',
      label: 'Button beside the form',
      admin: {
        condition: (_data, siblingData) =>
          Boolean((siblingData as { showAsideButton?: boolean } | undefined)?.showAsideButton),
      },
    }),
  ],
}
