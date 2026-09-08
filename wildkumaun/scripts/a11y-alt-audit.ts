/**
 * What alt text is still missing after src/lib/image-alt.ts has run.
 *
 * A script rather than a test, for the same reason a11y-baseline.mjs is one: the
 * useful output is the list of files still needing words, not a pass or a fail.
 * axe cannot stand in for this — an empty alt is valid markup, so a page full of
 * undescribed photographs scans clean.
 *
 * Run from wildkumaun/:  npx tsx scripts/a11y-alt-audit.ts
 */
import fs from 'node:fs'
import path from 'node:path'

import { withImageAlt, DECORATIVE } from '../src/lib/image-alt'

const DIR = path.join(process.cwd(), 'content/mirror')

const emptyAlts = (html: string): string[] => {
  const out: string[] = []
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const alt = m[0].match(/\salt\s*=\s*"([^"]*)"/i)
    if (!alt || alt[1].trim() !== '') continue
    const src = m[0].match(/\ssrc\s*=\s*"([^"]*)"/i)?.[1] ?? ''
    out.push(decodeURIComponent(src.split('/').pop() ?? ''))
  }
  return out
}

let before = 0
let after = 0
const remaining = new Map<string, Set<string>>()

for (const file of fs.readdirSync(DIR)) {
  if (file.startsWith('_')) continue
  const page = file.replace('.json', '')
  const html: string = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')).html ?? ''

  before += emptyAlts(html).length

  for (const name of emptyAlts(withImageAlt(html))) {
    after++
    if (!remaining.has(name)) remaining.set(name, new Set())
    remaining.get(name)!.add(page)
  }
}

console.log(`empty alt before: ${before}`)
console.log(`empty alt after:  ${after}`)
console.log(`filled:           ${before - after}`)

const declared = [...remaining.keys()].filter((n) => n in DECORATIVE)
const undeclared = [...remaining.keys()].filter((n) => !(n in DECORATIVE))

console.log(`\ndecorative on purpose (${declared.length}):`)
for (const name of declared) console.log(`  ${name} — ${DECORATIVE[name]}`)

console.log(`\nstill undescribed (${undeclared.length}):`)
for (const name of undeclared) {
  console.log(`  ${name}  [${[...remaining.get(name)!].join(', ')}]`)
}
