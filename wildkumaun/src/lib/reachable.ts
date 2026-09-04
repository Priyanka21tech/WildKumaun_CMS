import fs from 'node:fs'
import path from 'node:path'

import { pageIndex } from './pages'

/**
 * Which pages a reader can actually get to.
 *
 * The mirror holds every page in the origin's sitemap, and six of them are not
 * linked from anywhere on the site — no menu entry, no button, no link in anyone
 * else's copy. `/facilities`, `/location`, `/birds-found-at-wild-kumaon`,
 * `/birders-paradise`, `/vision`, and `/enquiry` (reachable only from
 * `/birds-found-at-wild-kumaon`, which is itself not). They exist because a page
 * was made in WordPress and never put in the menu, or taken out of it later and
 * not deleted.
 *
 * A page nobody can reach is not part of the site, and moving one into the CMS
 * cannot be justified to whoever asks why it is there. So those pages render
 * from the mirror alone: their blocks and banner are ignored, and what the reader
 * gets — if they arrive from a search engine, since nothing else leads there — is
 * exactly the page the origin serves today.
 *
 * Derived rather than listed, because a list would be a second copy of something
 * the markup already says, and it would be wrong the moment a link is added. The
 * cost is reading 2.4MB of mirror once per process; the pages are already read
 * per request, and this runs on the first one and is kept.
 *
 * When a page does get linked — a menu entry in the Header global will not do it,
 * since this reads the origin's markup — it becomes reachable here and its blocks
 * start rendering with no further change.
 */

const DIR = path.join(process.cwd(), 'content/mirror')

type Page = { route: string; slug: string }

let reachable: Set<string> | null = null

/** Every internal route the page's markup links to. */
function linksIn(slug: string, routes: Map<string, string>): Set<string> {
  const file = path.join(DIR, `${slug}.json`)
  if (!fs.existsSync(file)) return new Set()

  const { html } = JSON.parse(fs.readFileSync(file, 'utf8')) as { html: string }
  const found = new Set<string>()

  for (const match of html.matchAll(/<a[^>]*href="([^"]+)"/g)) {
    const href = match[1].trim()
    // Site-relative only. An off-site link leads away, and /media and /wp are
    // files rather than pages.
    if (!href.startsWith('/') || href.startsWith('/media/') || href.startsWith('/wp/')) continue

    const route = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/'
    const slugFound = routes.get(route)
    if (slugFound) found.add(slugFound)
  }

  return found
}

/** The slugs reachable from the home page, by following links. */
function walk(): Set<string> {
  const pages = pageIndex as Page[]
  const routes = new Map(pages.map((page) => [page.route, page.slug]))

  const seen = new Set(['index'])
  const queue = ['index']

  while (queue.length) {
    const slug = queue.shift()!
    for (const next of linksIn(slug, routes)) {
      if (seen.has(next)) continue
      seen.add(next)
      queue.push(next)
    }
  }

  return seen
}

/**
 * Whether a reader can get to this route from the home page.
 *
 * Unknown routes count as reachable. This decides whether to show the CMS's
 * version of a page, and a route this cannot place is not a reason to ignore
 * what an editor has written.
 */
export function isReachable(route: string): boolean {
  reachable ??= walk()

  const page = (pageIndex as Page[]).find((entry) => entry.route === route)
  return page ? reachable.has(page.slug) : true
}
