import type { CollectionBeforeChangeHook, Field } from 'payload'

import { GUEST_BOOK } from '../seed/forms'

/**
 * Turning an approved guest book comment into a review on the site.
 *
 * A comment left through the guest book form arrives as an enquiry like any other
 * submission, and stays there doing nothing until somebody ticks Approved. That
 * tick is the whole moderation step: what a stranger types must not reach the
 * client's website on its own, and an editor reading it and deciding is the only
 * thing that can tell a real review from abuse.
 *
 * A review typed straight into Testimonials is not affected — it was written by
 * whoever has the admin password, so there is nobody left to approve it to. That
 * asymmetry is the point: approval guards the door strangers come through, not
 * the one the client already holds a key to.
 *
 * Unticking Approved afterwards does not delete the review. Removing a document
 * as a side effect of a checkbox is a lot of destruction to hang off one click,
 * and the review is a document of its own by then — an editor may have reworded
 * it. The link stays visible on the enquiry so it is obvious one was published,
 * and deleting it is done in Testimonials, deliberately.
 */

/** The two fields approval adds to a submission. */
export const approvalFields: Field[] = [
  {
    name: 'approved',
    type: 'checkbox',
    defaultValue: false,
    label: 'Approved',
    admin: {
      position: 'sidebar',
      description:
        'Guest book comments only. Tick to publish this as a review on the guest book and make it available to the home page.',
    },
  },
  {
    name: 'testimonial',
    type: 'relationship',
    relationTo: 'testimonials',
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: 'The review created from this comment. Edit or remove it in Testimonials.',
    },
  },
]

/** What a submission answered for a given question, by the field's name. */
const answer = (
  doc: { submissionData?: { field?: string; value?: unknown }[] | null },
  field: string,
): string => String(doc.submissionData?.find((entry) => entry.field === field)?.value ?? '').trim()

/**
 * A slug for the review, unique across the collection.
 *
 * The name alone is not enough — two guests called Anita would collide, and the
 * field is unique because the slug becomes a DOM id on the page. The submission's
 * own id is already unique and never changes, so it is what disambiguates.
 */
const slugFor = (name: string, id: number | string): string =>
  `${
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'guest'
  }-${id}`

export const publishApprovedComment: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Only the moment it is ticked. Every later save of an approved comment would
  // otherwise publish it again.
  if (operation !== 'update') return data
  if (!data.approved || originalDoc?.approved) return data
  if (originalDoc?.testimonial ?? data.testimonial) return data

  const formId = typeof data.form === 'object' ? data.form?.id : (data.form ?? originalDoc?.form)
  if (!formId) return data

  try {
    const form = await req.payload.findByID({ collection: 'forms', id: formId, depth: 0, req })

    // The enquiry form asks about a booking, not about a stay. Approving one of
    // those means nothing, so the tick is ignored rather than publishing a review
    // out of somebody's room availability question.
    if (form?.title !== GUEST_BOOK) return data

    const submission = { submissionData: data.submissionData ?? originalDoc?.submissionData }
    const name = answer(submission, 'name')
    const quote = answer(submission, 'message')

    // Both are required on a testimonial. A comment missing either cannot become
    // one, and failing loudly here is better than creating a review with a blank
    // author on the client's site.
    if (!name || !quote) {
      req.payload.logger.warn(
        `Enquiry ${originalDoc?.id} approved but has no ${!name ? 'name' : 'message'} — no review created`,
      )
      return data
    }

    // Last, so a published comment joins the end of the guest book rather than
    // displacing the reviews already arranged.
    const existing = await req.payload.find({
      collection: 'testimonials',
      limit: 1,
      pagination: false,
      sort: '-order',
      depth: 0,
      req,
    })
    const order = ((existing.docs[0]?.order as number | undefined) ?? 0) + 10

    const testimonial = await req.payload.create({
      collection: 'testimonials',
      data: {
        name,
        quote,
        slug: slugFor(name, originalDoc?.id ?? 0),
        order,
        source: 'Guest book',
      },
      // The same transaction as the enquiry being saved. Without it this waits on
      // a lock the outer save is holding and neither ever finishes.
      req,
    })

    req.payload.logger.info(
      `Published enquiry ${originalDoc?.id} as testimonial ${testimonial.id}`,
    )

    // Written with the tick, in one save. A second update to store this would be
    // a write to the row already being written, which is the deadlock above.
    return { ...data, testimonial: testimonial.id }
  } catch (err) {
    // The tick still saves. A failure here must not lose the comment or make the
    // panel look broken — the log says what happened and the checkbox can be
    // toggled off and on again once the cause is fixed.
    req.payload.logger.error({ err }, `Could not publish enquiry ${originalDoc?.id} as a testimonial`)
    return data
  }
}
