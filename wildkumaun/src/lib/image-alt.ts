/**
 * Alt text for the mirrored images — WCAG 1.1.1 Non-text Content.
 *
 * The origin ships 331 images and every one of them has an `alt` attribute, so
 * axe reports nothing. 200 of those attributes are empty, and an empty alt is not
 * a missing description: it is a positive claim that the image is decorative and
 * assistive technology should skip it. On a birding lodge site, where whole pages
 * are nothing but photographs of birds, that claim is false for most of them — a
 * screen-reader user on /birds-of-sattal-and-around currently hears nothing for
 * 45 of the 46 photographs.
 *
 * The words come from the origin itself rather than from anything invented here.
 * Elementor stores a title on the lightbox link behind each thumbnail, and
 * _tools/extract-image-alts.mjs harvests those into content/image-alts.json —
 * which is why a file named `0a17da2b-8024-43b7-a76d-ac144fbfeda9.jpg` can still
 * be described as "Blue Whistling Thrush". That covers 131 of the 188 distinct
 * files. EXTRA below covers the rest.
 *
 * Applied to the mirrored html before responsiveHtml rewrites the image URLs, so
 * the filenames still match the map. Images the CMS renders are not touched here
 * and do not need to be: Media.alt is a required field, and widgets.ts writes it.
 */
import fs from 'node:fs'
import path from 'node:path'

/**
 * Read from the repo root rather than from inside the app.
 *
 * content/image-alts.json is extraction output, produced by _tools and consumed
 * by src/scripts/import-media.ts as well as by this file. `process.cwd()` is the
 * app directory when Next runs — the same assumption src/lib/pages.js makes.
 */
const ALTS = path.join(process.cwd(), '..', 'content', 'image-alts.json')

const extracted: Record<string, string> = JSON.parse(fs.readFileSync(ALTS, 'utf8'))

/**
 * The files the origin never gave a lightbox title, described from what the file
 * is named.
 *
 * Deliberately literal. `bedroom-img-1024x683.jpg` becomes "Bedroom" and not
 * "Bedroom with twin beds looking onto the hills", because nobody writing this
 * has seen the photograph and alt text that describes the wrong picture is worse
 * than alt text that describes little. Someone who can see them should improve
 * these; naming what the image is of is the floor, not the ceiling.
 *
 * The origin's own misspellings are not carried over. `dinning-area-3.jpg` is
 * "Dining area": the sic-preserving rule in the content extraction exists so the
 * site still reads as the client wrote it, and this is not the client's prose —
 * it is a description read aloud to somebody who cannot see the image.
 */
const EXTRA: Record<string, string> = {
  // People
  'Owner-and-Founder-WILD-KUMAON-Hitendra-Bisht-1024x576.png':
    'Hitendra Bisht, owner and founder of Wild Kumaon',
  'Abha-Singh.jpg': 'Abha Singh',

  // Birds and artwork
  'Tawny-Fish-Owl.jpg': 'Tawny Fish Owl',
  'Shevali.jpg': 'Shevali',
  'Common-Green-Magpie-2-1-300x180.jpg': 'Common Green Magpie',
  'Crested-Kingfisher-3-300x180.jpg': 'Crested Kingfisher',

  // Rooms and grounds. The same photographs are served at two sizes, once for
  // /facilities and once for /work-from-hills, so each appears twice.
  'room-1.jpg': 'Guest room',
  'room-img-768x512.jpg': 'Guest room',
  'bedroom-img-1024x683.jpg': 'Bedroom',
  'bedroom-img-768x512.jpg': 'Bedroom',
  'siitting-area-1024x683.png': 'Sitting area',
  'siitting-area-1-768x512.png': 'Sitting area',
  'sitting-area-img-768x512.jpg': 'Sitting area',
  'dinning-area-1-1024x683.jpg': 'Dining area',
  'dinning-area-1-768x512.jpg': 'Dining area',
  'dinning-area-3.jpg': 'Dining area',
  'garden-img-1024x683.jpg': 'Garden',
  'garden-img-768x512.jpg': 'Garden',
  'outdoor-garden-1024x683.jpg': 'Outdoor garden',
  'outdoor-garden-768x512.jpg': 'Outdoor garden',
  'outdoor-open-area-1024x683.jpg': 'Outdoor open area',
  'outdoor-open-area-768x512.jpg': 'Outdoor open area',
  'open-area-1-1024x683.jpg': 'Open area',
  'open-area-1-768x512.jpg': 'Open area',
  'open-area-img-768x512.jpg': 'Open area',
  'wild-kumaon-1024x683.jpg': 'The Wild Kumaon property',
  'wild-kumaon-768x512.jpg': 'The Wild Kumaon property',
  'wild-kumaon-location-2-img-1.jpg': 'The Wild Kumaon location',
  'Restaurant-Image.jpg': 'The restaurant',

  // Amenities
  'wifi-facilities-1024x683.jpg': 'Wi-Fi facilities',
  'wifi-facilities-1-768x512.jpg': 'Wi-Fi facilities',
  'wifi-facilites.jpg': 'Wi-Fi facilities',
  'clean-washroom.jpg': 'Clean washroom',
  'parking-img.jpg': 'Parking',
  'spring-water.jpg': 'Spring water',
  'linen-1.jpg': 'Fresh linen',

  // Activities
  'nature-walk.jpg': 'Nature walk',
  'village-walk.jpg': 'Village walk',
  'birding.jpg': 'Birding',
  'birding-tour-img-1024x683.jpg': 'Birding tour',
  'hiking-img.jpg': 'Hiking',
  'yoga-img.jpg': 'Yoga',
  'reading-writting-book.jpg': 'Reading and writing',
  'camping-and-adventures-1024x683.jpg': 'Camping and adventures',
  'work-from-hills-1024x683.jpg': 'Working from the hills',
  'kumaon-culture-img-1024x683.jpg': 'Kumaoni culture',

  // Documents and flyers, where the filename carries the whole message
  'sattal-petition-1024x1024.jpg': 'Petition to protect Sattal',
  'Heal-Farm-Sound-Bath-donation-flyer-1-724x1024.png':
    'Heal Farm sound bath donation flyer',
  'Sattal-5N-6D-Birding-tour-Best-time-Nov-June.png':
    'Sattal 5 nights and 6 days birding tour, best time November to June',

  /**
   * Five photographs on /birds-found-at-wild-kumaon named only `bird-2.jpg`,
   * `bird-3.jpg` and so on. The species cannot be recovered from the file or the
   * page, and naming the wrong bird on a birding site is a worse failure than
   * naming none — so these say what is true and no more. They are the first
   * entries somebody who knows the birds should replace.
   */
  'bird-2.jpg': 'Bird photographed at Wild Kumaon',
  'bird-3.jpg': 'Bird photographed at Wild Kumaon',
  'bird-4.jpg': 'Bird photographed at Wild Kumaon',
  'bird-14.jpg': 'Bird photographed at Wild Kumaon',
  'bird-24.jpg': 'Bird photographed at Wild Kumaon',
}

/**
 * Images left as `alt=""` on purpose, and the reason for each.
 *
 * Everything else that stays empty stays empty by accident, which is the state
 * this file exists to end. Listing them is what makes the difference visible: an
 * empty alt here is a decision somebody can disagree with, not an oversight.
 */
export const DECORATIVE: Record<string, string> = {
  'about-us-4.jpg': 'A background band on /about-us carrying no information.',
  'Logo-300x300.jpg': 'Repeats the organisation name already in the text beside it.',
  'testimonials.jpg': 'A heading ornament above the guest book reviews.',
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const basename = (url: string) => decodeURIComponent(url.split('/').pop()?.split(/[?#]/)[0] ?? '')

/**
 * Payload writes `name-900x600.jpg` beside `name.jpg` for the sizes it generates.
 * Trying the un-suffixed name too means one entry describes every size of the
 * same photograph, rather than the map needing a row per size.
 */
const unsized = (file: string) => file.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '')

/**
 * The words for one file, or nothing if none are known.
 *
 * Exported because the mirror is not the only thing that needs them: the same
 * map is what src/scripts/fix-media-alt.ts writes into the Media collection, so
 * a CMS-rendered gallery and a mirrored page describe the same photograph the
 * same way.
 */
export function altForFile(file: string): string | undefined {
  if (!file) return undefined
  if (file in DECORATIVE) return undefined
  const bare = unsized(file)
  if (bare in DECORATIVE) return undefined
  return extracted[file] ?? EXTRA[file] ?? extracted[bare] ?? EXTRA[bare]
}

const lookup = (src: string): string | undefined => altForFile(basename(src))

const IMG = /<img\b[^>]*>/gi
const ALT_ATTR = /\salt\s*=\s*"([^"]*)"/i
const SRC_ATTR = /\ssrc\s*=\s*"([^"]*)"/i

/**
 * Fill in the empty alt attributes this map has words for.
 *
 * An image that already carries alt text is left exactly as it is — the origin's
 * own description beats anything derived here — and so is one the map does not
 * cover, because a wrong description is worse than an absent one.
 */
export function withImageAlt(html: string): string {
  return html.replace(IMG, (tag) => {
    const alt = tag.match(ALT_ATTR)
    if (!alt || alt[1].trim() !== '') return tag

    const src = tag.match(SRC_ATTR)?.[1]
    if (!src) return tag

    const text = lookup(src)
    if (!text) return tag

    return tag.replace(ALT_ATTR, ` alt="${esc(text)}"`)
  })
}
