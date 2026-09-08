import type { CollectionConfig } from 'payload'

/**
 * One row per page per scan.
 *
 * Per page rather than per scan, because the question people actually ask is
 * "what is wrong with /gallery", and a row per page answers it without unpacking
 * a document holding all twenty-six. The `runId` ties a run back together when
 * somebody wants the whole picture instead.
 *
 * Nothing here is editable except the manual sign-off. The rest is the machine's
 * account of what it found, and a report somebody can edit is not evidence.
 */
export const A11yReports = (group: string): CollectionConfig => ({
  slug: 'a11y-reports',

  labels: {
    singular: 'Accessibility report',
    plural: 'Accessibility reports',
  },

  admin: {
    group,
    useAsTitle: 'route',
    defaultColumns: ['route', 'scannedAt', 'failed', 'passed', 'manual'],
    description: 'What each page scored, one row per page per scan.',
    components: {
      /**
       * The Run scan button, above the list.
       *
       * Referenced by path rather than imported: Payload compiles admin
       * components through its own import map, and a component handed to it as a
       * value would be bundled into the server config instead.
       */
      beforeList: ['@webuters/payload-plugin-a11y/client#RunScanButton'],
    },
  },

  access: {
    read: ({ req }) => Boolean(req.user),
    // Written by the scan, not by hand.
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },

  fields: [
    {
      name: 'runId',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Groups every page from a single scan.' },
    },
    {
      name: 'route',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'scannedAt',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },

    /**
     * Counted at write time rather than derived in the admin list.
     *
     * A list view that has to open every result to show a total is a list view
     * that gets slow at exactly the point the site has enough history to be
     * worth looking at.
     */
    {
      type: 'row',
      fields: [
        { name: 'passed', type: 'number', defaultValue: 0 },
        { name: 'failed', type: 'number', defaultValue: 0 },
        { name: 'manual', type: 'number', defaultValue: 0 },
        { name: 'skipped', type: 'number', defaultValue: 0 },
      ],
    },

    {
      name: 'results',
      type: 'array',
      admin: { description: 'One entry per checkpoint.' },
      fields: [
        { name: 'checkId', type: 'text', required: true },
        { name: 'title', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: [
            { label: 'Pass', value: 'pass' },
            { label: 'Fail', value: 'fail' },
            { label: 'Needs a person', value: 'manual' },
            { label: 'Skipped', value: 'skipped' },
            { label: 'Error', value: 'error' },
          ],
        },
        { name: 'wcag', type: 'text', admin: { description: 'Success criteria, comma separated.' } },
        { name: 'detail', type: 'textarea' },
        { name: 'count', type: 'number' },
        { name: 'sample', type: 'text' },
      ],
    },

    /**
     * The half a browser cannot answer.
     *
     * Two of the seventeen checkpoints — audio description, and whether meaning
     * rests on colour or hover alone — need somebody to look. Recording who
     * looked and when is what stops "manual" from meaning "nobody ever did".
     */
    {
      name: 'signOff',
      type: 'group',
      label: 'Manual sign-off',
      fields: [
        { name: 'checkedBy', type: 'relationship', relationTo: 'users' },
        { name: 'checkedAt', type: 'date' },
        { name: 'notes', type: 'textarea' },
      ],
    },
  ],
})
