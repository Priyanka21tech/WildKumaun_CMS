/**
 * Give the raw-URL links on the eco-friendly page their names.
 *
 * Four links there show their own address as their text. A screen reader reads
 * that letter by letter — "h t t p colon slash slash h e a l dot f a r m" — and
 * out of a link list, where a reader often meets links with no surrounding
 * prose, three of the four say nothing at all about where they go.
 *
 * The words come from the paragraph they sit in: the article names Heal Farm and
 * describes Cochoa as "a very special chocolate factory in the Himalayas", and
 * the closing section invites the reader to come along on the journeys.
 *
 * One of them is not an accessibility fix at all. `https://wildkumaon.com/` takes
 * a visitor off this site and onto the original — from a link that looks like
 * part of the article. That is repointed at `/`.
 *
 * The content lives in the CMS, so this edits the document rather than the
 * markup: an editor who changes that paragraph tomorrow keeps the names.
 *
 * Idempotent — a second run reports nothing to do.
 *
 * Run:  npm run fix:link-text
 */
import { getPayload } from 'payload'
import config from '@payload-config'

/** url -> what the link should say, and where it should go if that changed. */
const NAMES: Record<string, { text: string; url?: string }> = {
  'https://wildkumaon.com/': { text: 'Wild Kumaon', url: '/' },
  'http://heal.farm/': { text: 'Heal Farm' },
  'https://cochoa.in/': { text: 'Cochoa chocolate factory' },
  'https://forms.gle/aFQaUf9DvP3vWfuWA': { text: 'Join the journey — sign-up form' },
}

type LexicalNode = {
  type?: string
  text?: string
  fields?: { url?: string; linkType?: string }
  children?: LexicalNode[]
}

const changes: string[] = []

/**
 * Rewrite a link node in place.
 *
 * Only when the link's single child is the URL repeated as text. A link whose
 * text somebody has already written is left alone — this runs again on every
 * deploy, and it must never undo an editor.
 */
function visit(node: LexicalNode): void {
  if (node.type === 'link' || node.type === 'autolink') {
    const url = node.fields?.url ?? ''
    const wanted = NAMES[url]
    const kids = node.children ?? []

    const shown = kids.length === 1 && kids[0].type === 'text' ? (kids[0].text ?? '').trim() : ''

    /**
     * Looked up by the words on screen as well as by the destination.
     *
     * `https://wildkumaon.com/` is the case that needs both: the import already
     * rewrote its href to `/`, so the link goes to the right place and only the
     * text still shows the old absolute address. Matching on url alone would
     * have missed it, and reading that text is how a reader would still be told
     * they are leaving for another site.
     */
    const match = wanted ?? NAMES[shown]

    if (match && shown && (shown === url || NAMES[shown])) {
      kids[0].text = match.text
      if (match.url && node.fields && node.fields.url !== match.url) {
        node.fields.url = match.url
        node.fields.linkType = 'custom'
      }
      changes.push(`"${shown}" -> "${match.text}"`)
    }
  }

  for (const child of node.children ?? []) visit(child)
}

const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'eco-friendly-enterprises-in-sattal' } },
  limit: 1,
  pagination: false,
  depth: 0,
  overrideAccess: true,
})

const page = docs[0]
if (!page) {
  console.log('No eco-friendly-enterprises-in-sattal page in the CMS.')
  process.exit(0)
}

const layout = structuredClone(page.layout ?? []) as { body?: { root?: LexicalNode } }[]
for (const block of layout) {
  if (block.body?.root) visit(block.body.root)
}

if (!changes.length) {
  console.log('Every link already has a name. Nothing to do.')
  process.exit(0)
}

await payload.update({
  collection: 'pages',
  id: page.id,
  data: { layout } as never,
  overrideAccess: true,
})

console.log('Renamed:')
for (const line of changes) console.log(`  ${line}`)

process.exit(0)
