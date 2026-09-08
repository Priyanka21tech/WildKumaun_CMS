/**
 * Run the plugin's scanner against a few routes and print what it found.
 *
 * The endpoint needs a signed-in editor, which is right for something that opens
 * a browser and walks the site — but it makes the scanner awkward to check while
 * building it. This calls the runner directly instead, so a check can be proved
 * on the real site without a session.
 *
 * Run:  npx tsx scripts/a11y-plugin-smoke.ts
 */
import { runScan } from '@webuters/payload-plugin-a11y'

const report = await runScan({
  baseUrl: 'http://localhost:3000',
  // Three routes that between them exercise all three checks: a page with
  // carousels, the one page carrying an embedded video, and a gallery page.
  routes: ['/experiences', '/eco-friendly-enterprises-in-sattal', '/gallery'],
})

console.log(`run ${report.runId}  ${report.scannedAt}\n`)

for (const page of report.pages) {
  console.log(
    `${page.route}  pass:${page.passed} fail:${page.failed} manual:${page.manual}`,
  )

  for (const result of page.results) {
    if (result.status === 'pass') continue
    const count = result.count ? ` (${result.count})` : ''
    console.log(`    ${result.status.toUpperCase().padEnd(6)} ${result.id}${count}`)
    if (result.detail) console.log(`           ${result.detail}`)
    if (result.sample) console.log(`           sample: ${result.sample}`)
  }
  console.log()
}

process.exit(0)
