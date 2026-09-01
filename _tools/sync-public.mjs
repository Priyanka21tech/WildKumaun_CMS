/**
 * Copy the mirror's static assets into wildkumaun/public.
 *
 * Next only serves files that physically live under public/, and symlinks are
 * unreliable on Windows (ln -s silently falls back to a copy), so this is an
 * explicit copy step rather than a link. Rerun it after fetching new assets.
 *
 *   /wp/...    stylesheets, fonts, WordPress scripts, plugin font assets
 *   /media/... every image the site references
 *   /favicon.ico
 *
 * site.css's own url() paths (fonts/, ../media/, wildkumaon.com/wp-content/)
 * resolve correctly against this layout, which is why it needs no rewriting.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const MIRROR = path.join(ROOT, '_reference/wildkumaon.com')
const PUBLIC = path.join(ROOT, 'wildkumaun/public')

/** Copy src -> dest, skipping files already present with the same size. */
function copyTree(src, dest) {
  let copied = 0
  let skipped = 0
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true })
      const r = copyTree(from, to)
      copied += r.copied
      skipped += r.skipped
    } else {
      const s = fs.statSync(from)
      if (fs.existsSync(to) && fs.statSync(to).size === s.size) {
        skipped++
        continue
      }
      fs.mkdirSync(path.dirname(to), { recursive: true })
      fs.copyFileSync(from, to)
      copied++
    }
  }
  return { copied, skipped }
}

// The Tailwind sheet the origin's Next shell ships. It loads before site.css, so
// it is part of the applied cascade and belongs alongside it.
const shellCss = path.join(MIRROR, '_next/static/immutable/chunks/0cc1imiso8w1n.css')
fs.mkdirSync(path.join(PUBLIC, 'wp'), { recursive: true })
fs.copyFileSync(shellCss, path.join(PUBLIC, 'wp/shell.css'))

const wp = copyTree(path.join(MIRROR, 'wp'), path.join(PUBLIC, 'wp'))
console.log(`wp     : ${wp.copied} copied, ${wp.skipped} already current`)

const media = copyTree(path.join(MIRROR, 'media'), path.join(PUBLIC, 'media'))
console.log(`media  : ${media.copied} copied, ${media.skipped} already current`)

fs.copyFileSync(path.join(MIRROR, 'favicon.ico'), path.join(PUBLIC, 'favicon.ico'))
console.log('favicon: copied')

const jsCount = (function count(dir) {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? count(path.join(dir, e.name)) : e.name.endsWith('.js') ? 1 : 0
  }
  return n
})(path.join(PUBLIC, 'wp'))
console.log(`\n${jsCount} WordPress scripts present under public/wp`)
