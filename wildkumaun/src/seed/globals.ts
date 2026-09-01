import type { Payload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Fill the Pages registry and the three globals from the extracted content.
 *
 * Called from `onInit` in payload.config.ts, so it runs whenever Payload boots —
 * `npm run dev` and nothing else. Without that, a fresh database gives you a site
 * with an empty menu and no footer, and the only sign of what is wrong is that
 * nothing is there.
 *
 * It fills gaps and never overwrites. Running on every boot is only safe if a boot
 * cannot undo an edit, so a field that already holds something keeps it and a page
 * that already exists is not touched — but a field that is empty gets filled.
 *
 * Both halves matter. Skipping outright once a global had been seeded meant that
 * adding a field later left it empty forever: `ticker` was added after the first
 * seed had run, so the line under the header simply never appeared and nothing
 * said why. Filling gaps means a new field is populated on the next start, while
 * an editor's changes stay put.
 *
 * Pass `force` to overwrite regardless — `npm run seed:globals` does, for when the
 * content in the admin panel should go back to what was extracted.
 *
 * Order matters: pages have to exist before the menu can point at them, so all 26
 * are created first and kept in a slug -> id map to resolve links against.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(dirname, '../../..')

/**
 * The footer address links out to the resort's place on Google Maps. The link is
 * in the mirrored markup but not in the extracted settings, so it is carried here
 * rather than lost when the footer stops being rendered from that markup.
 */
const MAP_URL = 'https://g.page/SattalBirding?share'

/** "/" is stored as "home": a slug cannot be a bare slash. */
const toSlug = (route: string) => (route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, ''))

type NavEntry = { label: string; href: string; external?: boolean; children?: NavEntry[] }

type SeedResult = {
  pagesCreated: number
  /** One line per global that had a gap filled, naming the fields. Empty when nothing was missing. */
  filled: string[]
  unresolved: string[]
}

/**
 * Nothing there yet. `false` and `0` are answers, so only absence counts — an
 * unticked checkbox must not be treated as a gap and ticked again on next boot.
 */
const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)

/** Extracted values for the keys that are empty; existing content wins otherwise. */
function fillGaps<T extends Record<string, unknown>>(
  existing: Record<string, unknown> | undefined,
  desired: T,
  force: boolean,
): Partial<T> | null {
  if (force) return desired

  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(desired)) {
    if (!isEmpty(value) && isEmpty(existing?.[key])) patch[key] = value
  }

  return Object.keys(patch).length ? (patch as Partial<T>) : null
}

export async function seedGlobals(
  payload: Payload,
  { force = false }: { force?: boolean } = {},
): Promise<SeedResult> {
  const settings = JSON.parse(
    fs.readFileSync(path.join(REPO, 'content/site-settings.json'), 'utf8'),
  )
  const pagesDoc = JSON.parse(fs.readFileSync(path.join(REPO, 'content/pages.json'), 'utf8'))

  const [existingSettings, existingHeader, existingFooter] = (await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
    payload.findGlobal({ slug: 'header', depth: 0 }),
    payload.findGlobal({ slug: 'footer', depth: 0 }),
  ])) as unknown as Array<Record<string, unknown>>

  const filled: string[] = []

  // -------------------------------------------------------------- pages

  const slugToId = new Map<string, number>()
  let pagesCreated = 0

  for (const page of pagesDoc.pages as Array<{ slug: string; title?: string; navLabel?: string }>) {
    const slug = toSlug(page.slug)

    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    if (existing.docs.length) {
      // Left alone: the title may have been edited since, and nothing here knows
      // better than whoever edited it.
      slugToId.set(slug, existing.docs[0].id as number)
      continue
    }

    const doc = await payload.create({
      collection: 'pages',
      data: {
        title: page.title?.trim() || page.navLabel?.trim() || slug,
        slug,
        navLabel: page.navLabel?.trim() || undefined,
      },
    })
    slugToId.set(slug, doc.id as number)
    pagesCreated++
  }

  // -------------------------------------------------------------- links

  const unresolved: string[] = []

  /** Turn one extracted { label, href } into the link group the fields expect. */
  const toLink = (entry: NavEntry) => {
    const { label, href } = entry

    if (!href || href === '#') return { type: 'none' as const, label }

    if (/^https?:\/\//i.test(href) || entry.external) {
      return { type: 'custom' as const, label, url: href, newTab: true }
    }

    const [pathname, anchor] = href.split('#')
    const id = slugToId.get(toSlug(pathname || '/'))

    if (!id) {
      unresolved.push(`${label} -> ${href}`)
      return { type: 'custom' as const, label, url: href }
    }

    return { type: 'reference' as const, label, reference: id, anchor: anchor || undefined }
  }

  // ------------------------------------------------------- site settings

  const phones = (settings.contact?.phones ?? []) as Array<{ number: string; label: string }>
  const headerPhones = new Set(
    ((settings.contact?.headerPhones ?? []) as string[]).map((p) => p.replace(/^\+91/, '')),
  )
  const footerPhones = new Set((settings.contact?.footerPhones ?? []) as string[])

  const shownInHeader = new Set<string>()
  const shownInFooter = new Set<string>()

  /**
   * Mark this entry as one the header or footer shows — but only the first entry
   * carrying a given number.
   *
   * 9520017658 is listed twice in the extracted contacts, once for reservations
   * and once for birding tours: one number, two things it is for. Flagging both
   * would put it in the header twice, so the first entry claims it and the second
   * stays on record without being displayed.
   */
  const claim = (claimed: Set<string>, wanted: Set<string>, number: string): boolean => {
    if (!wanted.has(number) || claimed.has(number)) return false
    claimed.add(number)
    return true
  }

  /** The settings record images by their path in assets/images; Media knows them by filename. */
  const findMedia = async (assetPath?: string) => {
    if (!assetPath) return undefined
    const found = await payload.find({
      collection: 'media',
      where: { filename: { equals: path.basename(assetPath) } },
      limit: 1,
      pagination: false,
      depth: 0,
    })
    return (found.docs[0]?.id as number | undefined) ?? undefined
  }

  const [logo, favicon] = await Promise.all([
    findMedia(settings.logo),
    findMedia(settings.favicon),
  ])

  const settingsData = {
      name: settings.name,
      legalName: settings.legalName,
      tagline: settings.tagline,
      logo,
      favicon,
      email: settings.contact?.email,
      whatsapp: settings.contact?.whatsapp,
      phones: phones.map((p) => ({
        number: p.number,
        label: p.label,
        showInHeader: claim(shownInHeader, headerPhones, p.number),
        showInFooter: claim(shownInFooter, footerPhones, p.number),
      })),
      address: { ...settings.address, mapUrl: MAP_URL },
      social: (settings.social ?? []).map(
        (s: { network: string; label?: string; url?: string }) => ({
          network: s.network,
          label: s.label,
          url: s.url,
        }),
      ),
      metaDescription: settings.metaDescription,
  }

  const settingsPatch = fillGaps(existingSettings, settingsData, force)
  if (settingsPatch) {
    await payload.updateGlobal({ slug: 'site-settings', data: settingsPatch })
    filled.push(`site settings (${Object.keys(settingsPatch).join(', ')})`)
  }

  // -------------------------------------------------------------- header

  const nav = (settings.nav ?? []) as NavEntry[]

  const headerData = {
      nav: nav.map((item) => ({
        link: toLink(item),
        children: (item.children ?? []).map((child) => ({ link: toLink(child) })),
      })),
      // The extracted "intro" is the line the header scrolls, on all 26 pages. The
      // replacement is a stray byte in the mirror where the origin has a
      // non-breaking space between "researched" and "and".
      ticker: (settings.intro ?? '').replace(/\uFFFD/g, ' ').replace(/\s+/g, ' ').trim(),
      showSearch: true,
  }

  const headerPatch = fillGaps(existingHeader, headerData, force)
  if (headerPatch) {
    await payload.updateGlobal({ slug: 'header', data: headerPatch })
    filled.push(`header (${Object.keys(headerPatch).join(', ')})`)
  }

  // -------------------------------------------------------------- footer

  // columns is deliberately absent: an empty list is the intended state, and
  // offering it as a value would make it a permanent gap to refill every boot.
  const footerData = {
    showPhones: true,
    showEmail: true,
    showAddress: true,
    legal: settings.legalName ?? settings.name,
  }

  const footerPatch = fillGaps(existingFooter, footerData, force)
  if (footerPatch) {
    await payload.updateGlobal({ slug: 'footer', data: footerPatch })
    filled.push(`footer (${Object.keys(footerPatch).join(', ')})`)
  }

  return { pagesCreated, filled, unresolved }
}
