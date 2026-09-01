/**
 * Download the WordPress scripts the site loads on the client.
 *
 * These never came down with the original mirror: the shell passes the list to a
 * client component as props rather than emitting <script> tags, so the scanner
 * that built asset-list.json never saw them. Without them Elementor never runs,
 * and every carousel renders as an empty box because Swiper is what gives the
 * slides their width.
 *
 * The list comes from content/mirror/_scripts.json (written by
 * build-mirror-pages.mjs) plus the three libraries Elementor's AssetsLoader
 * fetches lazily at runtime off elementorFrontendConfig.urls.assets.
 *
 * Serial with a delay, like fetch-assets.mjs — the origin sits behind a Vercel
 * Security Checkpoint that trips on bursts. Resume-safe: rerun any time and it
 * skips what is already on disk.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const MIRROR = path.join(ROOT, '_reference/wildkumaon.com')
const LIST = path.join(ROOT, 'site/content/mirror/_scripts.json')
const ORIGIN = 'https://www.wildkumaon.com'
// Slower than fetch-assets.mjs on purpose: the checkpoint blocks the whole IP
// once tripped, and waiting it out costs far more than pacing the requests.
const DELAY_MS = 4000

// Elementor loads these on demand rather than up front, so they are not in the
// page's script list. Paths are relative to the Elementor assets directory.
const ELEMENTOR_ASSETS = '/wp/wildkumaon.com/wp-content/plugins/elementor/assets/'
const LAZY = [
  'lib/swiper/swiper.min.js',
  'lib/dialog/dialog.min.js',
  'lib/share-link/share-link.min.js',
].map((p) => ELEMENTOR_ASSETS + p)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.9',
  referer: ORIGIN + '/',
}

const urls = [...new Set([...JSON.parse(fs.readFileSync(LIST, 'utf8')), ...LAZY])].sort()

let fetched = 0
let skipped = 0
const failed = []

for (const url of urls) {
  // /wp/... in the page maps to _reference/wildkumaon.com/wp/...
  const dest = path.join(MIRROR, url.replace(/^\//, ''))

  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    skipped++
    continue
  }

  let ok = false
  for (let attempt = 1; attempt <= 25 && !ok; attempt++) {
    try {
      const res = await fetch(ORIGIN + url, { headers: HEADERS })
      if (res.status === 403) {
        // The checkpoint blocks the whole IP for a few minutes once tripped, so
        // wait it out rather than spending the retry budget hammering it.
        const wait = Math.min(30000 * attempt, 120000)
        console.log(`   checkpoint — waiting ${wait / 1000}s before retrying ${path.basename(url)}`)
        await sleep(wait)
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (!buf.length) throw new Error('empty body')
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, buf)
      console.log(`   ${String(buf.length).padStart(7)}  ${url}`)
      fetched++
      ok = true
    } catch (err) {
      if (attempt === 4) failed.push([url, err.message])
      else await sleep(DELAY_MS * attempt)
    }
  }

  await sleep(DELAY_MS)
}

console.log(`\nfetched ${fetched}, already present ${skipped}, failed ${failed.length}`)
for (const [url, msg] of failed) console.log(`   FAILED ${url} — ${msg}`)
process.exit(failed.length ? 1 : 0)
