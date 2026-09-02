import type { Payload } from 'payload'

/**
 * Create the enquiry form the site asks with.
 *
 * The questions are the origin's, in the origin's order, with its labels and
 * placeholders — Name, Numbers of Persons, Email, Mobile, Message. Only the
 * machinery behind them is new, because the origin's had stopped working: the
 * form posted to WordPress with a token that expired and a reCAPTCHA key for a
 * site that no longer answers.
 *
 * One form, not one per page. The same questions are asked on the home page, on
 * /contact-us and on /enquiry, and three copies would be three things to keep in
 * step and three places to read the answers.
 *
 * `confirmAndSave` rather than an email: the ticket asks for submissions to be
 * stored, and sending mail needs an adapter and credentials that this project
 * does not have. What arrives is in the admin panel under Enquiries, which is
 * where somebody would look for it.
 *
 * Creates only. A form already there has been through an editor's hands.
 */

const FORM_TITLE = 'Enquiry'

/** The origin's fields, read off its markup. `name` is what a submission is filed under. */
const FIELDS = [
  {
    blockType: 'text',
    name: 'name',
    label: 'Name',
    placeholder: 'Name*',
    required: true,
    width: 100,
  },
  {
    blockType: 'number',
    name: 'persons',
    label: 'Numbers of Persons',
    placeholder: 'Numbers of Persons',
    required: true,
    width: 100,
  },
  {
    blockType: 'email',
    name: 'email',
    label: 'Email',
    placeholder: 'Email*',
    required: true,
    width: 100,
  },
  {
    blockType: 'text',
    name: 'mobile',
    label: 'Mobile',
    placeholder: 'Mobile*',
    required: true,
    width: 100,
  },
  {
    blockType: 'textarea',
    name: 'message',
    label: 'Message',
    placeholder: 'Message',
    required: false,
    width: 100,
  },
]

/** A Lexical document holding one paragraph. */
const paragraph = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      },
    ],
  },
})

export async function seedForms(payload: Payload): Promise<{ created: number; id?: number }> {
  const found = await payload.find({
    collection: 'forms',
    where: { title: { equals: FORM_TITLE } },
    limit: 1,
    pagination: false,
    depth: 0,
  })

  const existing = found.docs[0]
  if (existing) return { created: 0, id: existing.id as number }

  const created = await payload.create({
    collection: 'forms',
    data: {
      title: FORM_TITLE,
      fields: FIELDS as never,
      submitButtonLabel: 'Send',
      confirmationType: 'message',
      confirmationMessage: paragraph(
        'Thank you — your enquiry has reached us. We will be in touch shortly.',
      ) as never,
    },
  })

  return { created: 1, id: created.id as number }
}
