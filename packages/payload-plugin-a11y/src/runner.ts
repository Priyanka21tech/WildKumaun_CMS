import type { A11yPage, A11yPluginOptions, CheckResult } from './types'
import { CHECKS } from './checks'

/**
 * axe's tag set.
 *
 * `best-practice` sits alongside the WCAG tags deliberately. Two checkpoints —
 * one H1 per page, and headings in order — are axe rules that live under
 * best-practice rather than under a success criterion, so a WCAG-only tag list
 * silently drops them: the checklist keeps two items that nothing is testing.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

export interface PageReport {
  route: string
  results: CheckResult[]
  passed: number
  failed: number
  manual: number
  skipped: number
}

/** What a run produced, before anything is written down. */
export interface RunReport {
  runId: string
  scannedAt: string
  pages: PageReport[]
}

/**
 * Say what went wrong in words the person reading the report can act on.
 *
 * These land in the admin panel, where the reader is as likely to be the person
 * who owns the site as the person who built it. A stack trace tells them nothing
 * they can do, and forty lines of it buries the one page that actually failed.
 *
 * Each case below is a failure that has actually happened here, phrased as what
 * to do about it. Anything unrecognised keeps its first line — still terse, but
 * honest about being unhandled, and the full text stays in the server log.
 */
function explain(error: unknown, baseUrl: string): string {
  const raw = error instanceof Error ? error.message : String(error)
  const firstLine = raw.split('\n')[0].trim()

  if (/ERR_CONNECTION_REFUSED|ECONNREFUSED/i.test(raw)) {
    return `Nothing is answering at ${baseUrl}. Start the site, then run the scan again.`
  }

  if (/ERR_NAME_NOT_RESOLVED|ENOTFOUND/i.test(raw)) {
    return `The address ${baseUrl} could not be found. Check the site URL in the plugin settings.`
  }

  if (/Timeout|exceeded|timed out/i.test(raw)) {
    return 'The page took more than 60 seconds to load, so it was skipped. It may be very slow, or stuck.'
  }

  if (/module is not defined|require is not defined/i.test(raw)) {
    return (
      'The accessibility engine could not start inside the browser. ' +
      'This happens when axe-core is bundled instead of loaded from disk — ' +
      'add it to serverExternalPackages in next.config.ts.'
    )
  }

  if (/Executable doesn't exist|browserType\.launch/i.test(raw)) {
    return 'No browser is installed for Playwright. Run "npx playwright install chromium" and scan again.'
  }

  if (/net::ERR_/i.test(raw)) {
    return `The browser could not open this page. ${firstLine}`
  }

  return firstLine
}

const tally = (results: CheckResult[]) => ({
  passed: results.filter((r) => r.status === 'pass').length,
  failed: results.filter((r) => r.status === 'fail' || r.status === 'error').length,
  manual: results.filter((r) => r.status === 'manual').length,
  skipped: results.filter((r) => r.status === 'skipped').length,
})

/**
 * Open a browser, visit each route, and report what is wrong.
 *
 * Playwright and axe are imported here rather than at the top of the package so
 * that a host which never runs a scan — a production server, say — does not
 * load a browser driver to serve a page.
 */
export async function runScan(options: A11yPluginOptions): Promise<RunReport> {
  /**
   * Both packages ship CommonJS, and what `await import()` hands back for those
   * depends on who is running it: Node's ESM loader, tsx and Turbopack each
   * detect named exports slightly differently, so `chromium` may sit on the
   * namespace or one level down on `default`. Reading through both is what makes
   * the same runner work from a script and from inside the Next server.
   */
  const playwrightModule = await import('@playwright/test')
  const playwright = playwrightModule as typeof playwrightModule & {
    default?: typeof playwrightModule
  }
  const chromium = playwright.chromium ?? playwright.default?.chromium

  const axeModule = await import('@axe-core/playwright')
  const axe = axeModule as typeof axeModule & { default?: typeof axeModule.default }
  const AxeBuilder = axe.default ?? (axe as unknown as typeof axeModule.default)

  if (!chromium) throw new Error('Playwright is installed but exposes no chromium launcher.')

  const baseUrl =
    options.baseUrl ?? process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
  const routes = typeof options.routes === 'function' ? await options.routes() : options.routes
  const skip = new Set(options.skip ?? [])

  const runId = `run-${Date.now()}`
  const scannedAt = new Date().toISOString()
  const pages: PageReport[] = []

  const browser = await chromium.launch()
  const context = await browser.newContext()

  try {
    for (const route of routes) {
      const page = await context.newPage()
      const results: CheckResult[] = []

      try {
        await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 60_000 })
        /**
         * The mirrored pages carry Elementor markup that its own scripts finish
         * arranging after load. Scanning before that settles reports layout that
         * no visitor ever sees.
         */
        await page.waitForTimeout(1500)

        const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze()

        for (const violation of axe.violations) {
          results.push({
            id: `axe:${violation.id}`,
            status: 'fail',
            count: violation.nodes.length,
            sample: violation.nodes[0]?.target?.join(' ')?.slice(0, 200),
            detail: violation.help,
          })
        }

        for (const check of CHECKS) {
          if (skip.has(check.id)) {
            results.push({ id: check.id, status: 'skipped' })
            continue
          }

          /**
           * One check throwing must not lose the page's other results, or the
           * report quietly shrinks and looks like an improvement.
           */
          try {
            const outcome = await check.run(page as unknown as A11yPage)
            results.push({ id: check.id, ...outcome })
          } catch (error) {
            results.push({
              id: check.id,
              status: 'error',
              detail: explain(error, baseUrl),
            })
          }
        }
      } catch (error) {
        results.push({
          id: 'page-load',
          status: 'error',
          detail: explain(error, baseUrl),
        })
      } finally {
        await page.close()
      }

      pages.push({ route, results, ...tally(results) })
    }
  } finally {
    await browser.close()
  }

  return { runId, scannedAt, pages }
}
