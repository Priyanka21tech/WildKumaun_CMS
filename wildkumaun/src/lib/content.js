// Reads the extracted content in ../content at build time.
// Server-only: these are plain filesystem reads, no client bundle impact.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), '..', 'content')

const load = (name) => JSON.parse(readFileSync(join(DIR, `${name}.json`), 'utf8'))

export const site = load('site-settings')
export const testimonials = load('testimonials').testimonials
export const amenityGroups = load('amenities').groups
export const faqs = load('faqs').faqs
export const packagesDoc = load('packages')
export const experiences = load('experiences').experiences
export const birdArt = load('bird-art')
export const posts = load('posts').posts
export const guides = load('guides')
export const pagesDoc = load('pages')

/** One page's extracted layout, by slug ("/" or "/about-us"). */
export function pageBySlug(slug) {
  return pagesDoc.pages.find((p) => p.slug === slug)
}

/** Every image on a page, in DOM order, deduped. */
export function imagesFor(slug) {
  const page = pageBySlug(slug)
  if (!page) return []
  const out = []
  for (const s of page.sections) for (const i of s.images || []) if (!out.includes(i)) out.push(i)
  for (const i of page.content?.images || []) if (!out.includes(i)) out.push(i)
  return out
}

export const amenityGroup = (id) => amenityGroups.find((g) => g.id === id)
export const postBySlug = (slug) => posts.find((p) => p.id === slug)
export const tour = packagesDoc.tours[0]
export const packages = packagesDoc.packages
