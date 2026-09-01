import fs from 'node:fs'
import path from 'node:path'

// Page records built from the mirror by _tools/build-mirror-pages.mjs.
const DIR = path.join(process.cwd(), 'content/mirror')

export const pageIndex = JSON.parse(fs.readFileSync(path.join(DIR, '_pages.json'), 'utf8'))

export function pageBySlugSegments(segments) {
  const slug = segments?.length ? segments.join('/') : 'index'
  const file = path.join(DIR, `${slug}.json`)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
