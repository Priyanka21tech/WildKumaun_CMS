/**
 * A dry run of every target, against the page it names.
 *
 * The renderers leave the html alone when they cannot find the section they were
 * given — the right behaviour on a live page, and the reason a wrong hash is
 * invisible. `pnpm seed:blocks` will not catch it either: it reads the same
 * mirror, so a target pointing at another page's section simply seeds nothing and
 * says nothing.
 *
 * So each target is rendered here with words the origin never wrote, and the
 * result is searched for them. A target that does not splice fails, and so does
 * one that splices somewhere the origin's own words survive.
 *
 * Run with `pnpm check:targets`. Reads no database.
 */
import fs from 'node:fs'
import path from 'node:path'

import { replaceColumns } from '../lib/columns-render'
import { replaceGallery } from '../lib/gallery-render'
import { replaceText } from '../lib/text-render'
import { COLUMN_TARGETS, GALLERY_TARGETS, TEXT_TARGETS, type SectionTarget } from '../lib/sections'
import { sectionByDataId } from '../lib/elementor'

const DIR = path.join(process.cwd(), 'content/mirror')

const mirror = (page: string): string =>
  JSON.parse(fs.readFileSync(path.join(DIR, `${page === 'home' ? 'index' : page}.json`), 'utf8'))
    .html

const map = { sizes: new Map(), widths: new Map() } as never

/** A rich text holding one paragraph, so the body has something to render. */
const lexical = (text: string) =>
  ({
    root: {
      type: 'root',
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
          children: [
            { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
          ],
        },
      ],
    },
  }) as never

const photo = [{ filename: 'sitting-area-img.jpg', alt: 'x', width: 800, height: 600 }]

let failures = 0
let checked = 0

function check(kind: string, target: SectionTarget, out: string, wanted: string[]) {
  checked++
  const missing = wanted.filter((needle) => !out.includes(needle))
  if (!missing.length) return

  failures++
  console.log(`FAIL ${kind}:${target.value}  (${target.page} #${target.section})`)
  console.log(`  never rendered: ${missing.join(', ')}`)
}

for (const target of TEXT_TARGETS) {
  const html = mirror(target.page)

  // A target naming a section that page does not have can only ever no-op.
  if (!sectionByDataId(html, target.section)) {
    failures++
    checked++
    console.log(`FAIL text:${target.value}  section ${target.section} is not on /${target.page}`)
    continue
  }

  const wanted: string[] = []
  const block: Record<string, unknown> = { target: target.value }

  if (target.item?.label) {
    block.heading = `HEAD-${target.value}`
    wanted.push(`HEAD-${target.value}`, `elementor-element-${target.item.label}`)
  }
  if (target.item?.text) {
    block.body = lexical(`BODY-${target.value}`)
    wanted.push(`BODY-${target.value}`, `elementor-element-${target.item.text}`)
  }
  if (target.item?.button) {
    block.showButton = true
    block.button = { type: 'custom', label: `BTN-${target.value}`, url: '/x' }
    wanted.push(`BTN-${target.value}`, `elementor-element-${target.item.button}`)
  }
  if (target.item?.image) {
    block.images = photo
    wanted.push(`elementor-element-${target.item.image}`)
  }
  if (target.headingWidget && !target.heading) {
    block.heading = `HEAD-${target.value}`
    wanted.push(`HEAD-${target.value}`)
  }

  // Nothing to assert on: the form targets carry their own hashes and their own
  // renderer, and this only covers the three that share these shapes.
  if (!wanted.length) continue

  check('text', target, replaceText(html, block as never, map), wanted)
}

for (const target of COLUMN_TARGETS) {
  const html = mirror(target.page)
  if (!sectionByDataId(html, target.section)) {
    failures++
    checked++
    console.log(`FAIL columns:${target.value}  section ${target.section} is not on /${target.page}`)
    continue
  }

  const items = [0, 1, 2].map((n) => ({
    heading: target.item?.label ? `HEAD-${target.value}-${n}` : undefined,
    body: target.item?.text ? lexical(`BODY-${target.value}-${n}`) : undefined,
  }))

  const wanted = [`elementor-element-${target.columns?.[0]}`]
  if (target.item?.label) wanted.push(`HEAD-${target.value}-0`, `HEAD-${target.value}-2`)
  if (target.item?.text) wanted.push(`BODY-${target.value}-0`, `BODY-${target.value}-2`)

  check(
    'columns',
    target,
    replaceColumns(html, { target: target.value, items } as never, map),
    wanted,
  )
}

for (const target of GALLERY_TARGETS) {
  const html = mirror(target.page)
  if (!sectionByDataId(html, target.section)) {
    failures++
    checked++
    console.log(`FAIL gallery:${target.value}  section ${target.section} is not on /${target.page}`)
    continue
  }

  const markup = sectionByDataId(html, target.section)!
  const slice = html.slice(markup.start, markup.end)
  const display = slice.includes('image-carousel')
    ? 'carousel'
    : slice.includes('image-gallery')
      ? 'gallery'
      : 'grid'

  check(
    'gallery',
    target,
    replaceGallery(html, { target: target.value, display, images: photo } as never, map),
    [`elementor-element-${target.item?.image}`],
  )
}

console.log(
  failures ? `\n${failures} of ${checked} failed` : `\nall ${checked} targets splice correctly`,
)
process.exit(failures ? 1 : 0)
