/**
 * Put the orphaned pages into the menu, and give WELLNESS somewhere to go.
 *
 * Two pages carry real content and nothing links to them: /facilities has
 * eleven photographs of the property, /birds-found-at-wild-kumaon has six and a
 * bird list. A page nobody can reach is content thrown away, and both belong
 * under Services, which is where Restaurant, Work from Hills and Experiences
 * already sit.
 *
 * WELLNESS was a menu entry with no destination — a link that took the reader to
 * the top of the page they were already on. It is not given a new page: the site
 * already has that content under "Group Sound Bath / Immersion" on /experiences,
 * and a second page saying the same thing is two pages to keep in step and two
 * results competing in search.
 *
 * Idempotent. Run it twice and the second run reports nothing to do.
 *
 * Run:  npm run fix:nav
 */
import { getPayload } from 'payload'
import config from '@payload-config'

import type { Header } from '../payload-types'

/**
 * Payload's own generated shape rather than one written here.
 *
 * A hand-written type would be looser than the field config — `type` as a plain
 * string instead of the three values the field allows — and the update would
 * then be rejected by a validator this script could not see.
 */
type NavItem = NonNullable<Header['nav']>[number]
type NavChild = NonNullable<NavItem['children']>[number]

const payload = await getPayload({ config })

const pages = await payload.find({
  collection: 'pages',
  limit: 0,
  pagination: false,
  depth: 0,
  overrideAccess: true,
})

const idFor = (slug: string): number | string | undefined =>
  pages.docs.find((page) => page.slug === slug)?.id

/** A menu entry pointing at one of this site's own pages. */
const entry = (slug: string, label: string): NavChild => {
  const id = idFor(slug)
  if (!id) throw new Error(`No page with slug "${slug}" — cannot link to it.`)
  return { link: { type: 'reference' as const, label, reference: id as number } }
}

const header = (await payload.findGlobal({ slug: 'header', depth: 0 })) as Header

const nav = structuredClone(header.nav ?? [])

const services = nav.find((item) => item.link?.label?.toUpperCase() === 'SERVICES')
if (!services) throw new Error('No SERVICES entry in the header menu.')

services.children = services.children ?? []

const childLabels = new Set(services.children.map((child) => (child.link?.label ?? '').toUpperCase()))

const added: string[] = []

/** WELLNESS already exists as a child; it is repointed rather than added. */
const wellness = services.children.find(
  (child) => String(child.link?.label ?? '').toUpperCase() === 'WELLNESS',
)

if (wellness) {
  const experiences = idFor('experiences')
  if (!experiences) throw new Error('No /experiences page to point WELLNESS at.')
  wellness.link = { type: 'reference', label: 'WELLNESS', reference: experiences as number }
  added.push('WELLNESS -> /experiences')
}

if (!childLabels.has('FACILITIES')) {
  services.children.push(entry('facilities', 'FACILITIES'))
  added.push('FACILITIES -> /facilities')
}

if (!childLabels.has('BIRDS FOUND')) {
  services.children.push(entry('birds-found-at-wild-kumaon', 'BIRDS FOUND'))
  added.push('BIRDS FOUND -> /birds-found-at-wild-kumaon')
}

if (!added.length) {
  console.log('Menu already has all of these. Nothing to do.')
  process.exit(0)
}

await payload.updateGlobal({ slug: 'header', data: { nav }, overrideAccess: true })

console.log('Updated the Services menu:')
for (const line of added) console.log(`  ${line}`)

process.exit(0)
