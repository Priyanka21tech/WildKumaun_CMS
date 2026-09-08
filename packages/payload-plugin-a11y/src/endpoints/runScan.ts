import type { Endpoint, PayloadRequest } from 'payload'

import type { A11yPluginOptions } from '../types'
import { runScan } from '../runner'
import { CHECKS } from '../checks'

/**
 * The title for a result id, so the report reads as sentences rather than slugs.
 *
 * axe names its rules for developers — `color-contrast`, `landmark-unique`,
 * `presentation-role-conflict` — and those ids go straight into a column the
 * site's owner reads. Turning them back into words costs one line and stops the
 * report looking like something only its author can use. The rule's own help
 * text still lands in the detail beside it.
 */
const titleFor = (id: string): string => {
  if (id === 'page-load') return 'Page could not be loaded'

  if (id.startsWith('axe:')) {
    const slug = id.slice(4).replace(/-/g, ' ')
    return slug.charAt(0).toUpperCase() + slug.slice(1)
  }

  return CHECKS.find((check) => check.id === id)?.title ?? id
}

const wcagFor = (id: string): string =>
  CHECKS.find((check) => check.id === id)?.wcag.join(', ') ?? ''

/**
 * `POST /api/a11y/scan` — run the checks and store what they found.
 *
 * Behind a login, because it opens a browser and visits every page on the site.
 * That is expensive enough to be worth a credential even though it only reads.
 */
export const runScanEndpoint = (options: A11yPluginOptions): Endpoint => ({
  path: '/a11y/scan',
  method: 'post',

  handler: async (req: PayloadRequest) => {
    if (!req.user) {
      return Response.json({ error: 'Sign in to run a scan.' }, { status: 401 })
    }

    try {
      const report = await runScan(options)

      /**
       * One document per page, written after the whole run rather than as each
       * page finishes. A run that dies halfway then leaves nothing, instead of a
       * partial report that reads like a complete one.
       */
      for (const page of report.pages) {
        await req.payload.create({
          collection: 'a11y-reports',
          data: {
            runId: report.runId,
            route: page.route,
            scannedAt: report.scannedAt,
            passed: page.passed,
            failed: page.failed,
            manual: page.manual,
            skipped: page.skipped,
            results: page.results.map((result) => ({
              checkId: result.id,
              title: titleFor(result.id),
              status: result.status,
              wcag: wcagFor(result.id),
              detail: result.detail,
              count: result.count,
              sample: result.sample,
            })),
          },
          overrideAccess: true,
        })
      }

      const totals = report.pages.reduce(
        (sum, page) => ({
          failed: sum.failed + page.failed,
          manual: sum.manual + page.manual,
        }),
        { failed: 0, manual: 0 },
      )

      return Response.json({
        runId: report.runId,
        pages: report.pages.length,
        ...totals,
      })
    } catch (error) {
      req.payload.logger.error({ err: error }, 'Accessibility scan failed')
      return Response.json(
        { error: error instanceof Error ? error.message : 'Scan failed' },
        { status: 500 },
      )
    }
  },
})
