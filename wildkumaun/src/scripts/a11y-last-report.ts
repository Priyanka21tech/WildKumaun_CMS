/**
 * Print the most recent accessibility run, in full.
 *
 * The admin list shows the tallies; when those look wrong the reason is in the
 * per-check detail, which is one click deep per page and twenty-six pages wide.
 *
 * Run:  npm run a11y:last
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const latest = await payload.find({
  collection: 'a11y-reports',
  sort: '-scannedAt',
  limit: 1,
  depth: 0,
  overrideAccess: true,
})

const newest = latest.docs[0]
if (!newest) {
  console.log('No scans recorded yet.')
  process.exit(0)
}

const run = await payload.find({
  collection: 'a11y-reports',
  where: { runId: { equals: newest.runId } },
  limit: 0,
  pagination: false,
  sort: 'route',
  depth: 0,
  overrideAccess: true,
})

console.log(`run ${newest.runId}   ${newest.scannedAt}   ${run.docs.length} page(s)\n`)

for (const page of run.docs) {
  console.log(
    `${page.route}  pass:${page.passed} fail:${page.failed} manual:${page.manual} skip:${page.skipped}`,
  )
  for (const result of page.results ?? []) {
    if (result.status === 'pass') continue
    console.log(`    ${String(result.status).toUpperCase().padEnd(7)} ${result.checkId}`)
    if (result.detail) console.log(`            ${String(result.detail).slice(0, 300)}`)
  }
}

process.exit(0)
