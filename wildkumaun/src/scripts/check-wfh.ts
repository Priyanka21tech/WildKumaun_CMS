/**
 * A dry run of every block now pointed at /work-from-hills.
 *
 * The renderers leave the html alone when they cannot find the section they were
 * given — which is the right behaviour on a live page and the reason a wrong
 * hash is invisible. So each target is checked here the only way that proves
 * anything: render something the origin never said, and look for it.
 *
 * Run with `payload run src/scripts/check-wfh.ts`. Reads no database.
 */
import fs from 'node:fs'
import path from 'node:path'

import { replaceColumns } from '../lib/columns-render'
import { replaceGallery } from '../lib/gallery-render'
import { replaceText } from '../lib/text-render'

const html: string = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'content/mirror/work-from-hills.json'), 'utf8'),
).html

const map = { sizes: new Map(), widths: new Map() } as never
const lexical = (text: string) =>
  ({
    root: {
      type: 'root',
      direction: 'ltr' as const,
      format: '' as const,
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

const media = [{ filename: 'sitting-area-img.jpg', alt: 'x', width: 800, height: 600 }]

let failures = 0

const check = (name: string, out: string, wanted: string[], gone: string[]) => {
  const missing = wanted.filter((needle) => !out.includes(needle))
  const kept = gone.filter((needle) => out.includes(needle))

  if (missing.length || kept.length) {
    failures++
    console.log(`FAIL ${name}`)
    if (missing.length) console.log(`  never rendered: ${missing.join(', ')}`)
    if (kept.length) console.log(`  origin still there: ${kept.join(', ')}`)
    return
  }

  console.log(`ok   ${name}`)
}

check(
  'text:wfh-banner',
  replaceText(
    html,
    { target: 'wfh-banner', heading: 'HEAD-BANNER', body: lexical('BODY-BANNER') },
    map,
  ),
  ['HEAD-BANNER', 'BODY-BANNER', 'elementor-element-2509249', 'elementor-element-9ef53ab'],
  ['Accommodate yourself in the Nature of Sattal'],
)

check(
  'text:wfh-intro',
  replaceText(html, { target: 'wfh-intro', heading: 'HEAD-INTRO' }, map),
  ['HEAD-INTRO', 'elementor-element-7af7769'],
  ['WILD KUMAON- An Eco-Resort at Sattal'],
)

check(
  'text:wfh-about',
  replaceText(html, { target: 'wfh-about', body: lexical('BODY-ABOUT') }, map),
  ['BODY-ABOUT', 'elementor-element-799f534', 'font-family:georgia'],
  ['purely dedicated Wildlife Lodges'],
)

check(
  'text:wfh-enquiry',
  replaceText(
    html,
    {
      target: 'wfh-enquiry',
      showButton: true,
      button: { type: 'custom', label: 'BTN-ENQUIRY', url: '/enquiry' },
    },
    map,
  ),
  ['BTN-ENQUIRY', 'elementor-element-b8e9df5'],
  ['Make A Enquiry'],
)

check(
  'gallery:wfh-gallery',
  replaceGallery(
    html,
    {
      target: 'wfh-gallery',
      heading: 'HEAD-GALLERY',
      display: 'gallery',
      columns: 4,
      images: media,
    },
    map,
  ),
  ['HEAD-GALLERY', 'elementor-element-2865909', 'elementor-element-3dc53b6'],
  ['IMAGE GALLERY'],
)

check(
  'columns:wfh-how-to-reach',
  replaceColumns(
    html,
    {
      target: 'wfh-how-to-reach',
      heading: 'HEAD-REACH',
      items: [
        { heading: 'COL-ONE', body: lexical('BODY-ONE') },
        { heading: 'COL-TWO', body: lexical('BODY-TWO') },
        { heading: 'COL-THREE', body: lexical('BODY-THREE') },
      ],
    },
    map,
  ),
  [
    'HEAD-REACH',
    'COL-ONE',
    'COL-TWO',
    'COL-THREE',
    'BODY-THREE',
    'elementor-element-038ed6d',
    'elementor-element-d9904fd',
    'text-align:justify',
  ],
  ['How to Reach', 'By Air', 'Pantnagar Airport'],
)

check(
  'columns:wfh-duration',
  replaceColumns(
    html,
    {
      target: 'wfh-duration',
      heading: 'HEAD-LENGTHS',
      items: [
        { body: lexical('DUR-ONE') },
        { body: lexical('DUR-TWO') },
        { body: lexical('DUR-THREE') },
      ],
    },
    map,
  ),
  ['HEAD-LENGTHS', 'DUR-ONE', 'DUR-THREE', 'elementor-element-8b6f22c', 'text-align:center'],
  ['DURATION', 'A Week', '1 Month'],
)

// The two rows sit in the same outer section, so each has to survive the other.
const both = replaceColumns(
  replaceColumns(
    html,
    { target: 'wfh-how-to-reach', heading: 'HEAD-REACH', items: [{ heading: 'COL-ONE' }] },
    map,
  ),
  { target: 'wfh-duration', heading: 'HEAD-LENGTHS', items: [{ body: lexical('DUR-ONE') }] },
  map,
)

check('columns: both rows together', both, ['HEAD-REACH', 'COL-ONE', 'HEAD-LENGTHS', 'DUR-ONE'], [])

console.log(failures ? `\n${failures} failed` : '\nall good')
process.exit(failures ? 1 : 0)
