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

/**
 * Alt text a person would have typed, from alt text a filename produced.
 *
 * The words harvested from the origin are right; their punctuation is not.
 * Elementor's lightbox titles are half prose and half slug — "Long-tailed
 * Minivet" in one place and "Black-headed-Bulbul" in another — and a screen
 * reader reads the second as a run of syllables.
 *
 * Only the joins between a lower-case word and a capitalised one are opened up.
 * That is the seam where a filename joined two real words, and it is the one
 * place a hyphen can be replaced without damage: the hyphen inside
 * "Yellow-breasted" belongs to the name, and the one inside "Bee-eater" does
 * too, while the one in "breasted-Greenfinch" never did.
 *
 *   Yellow-breasted-Greenfinch  ->  Yellow-breasted Greenfinch
 *   Blue-tailed-Bee-eater       ->  Blue-tailed Bee-eater
 *   Long-tailed Minivet         ->  unchanged, already correct
 *
 * A trailing size is dropped outright. Nobody needs to hear "1024 by 683".
 */
const SIZE_SUFFIX = /[\s-]*\b\d{2,4}\s*[x×]\s*\d{2,4}\b\s*$/i
const SLUG_SEAM = /([a-z])-([A-Z])/g

/**
 * Two words a filename ran together, because a space was not allowed.
 *
 * "LaughingThrush" is the same seam as "breasted-Greenfinch", just with the
 * hyphen omitted rather than kept. Split on the same evidence — a lower-case
 * letter meeting a capital inside one word.
 */
const RUN_TOGETHER = /([a-z])([A-Z])/g

/** Hyphens left dangling once a size or a word was taken off the end. */
const LOOSE_HYPHENS = /^-+|-+$/g

/**
 * The part of a filename that describes the file rather than the picture.
 *
 * `kettle-img`, `room-image`, `swimming-5` — a word saying "this is a picture",
 * or the number that kept two pictures of the same thing apart in a folder.
 * Neither means anything to somebody listening.
 */
const FILE_WORDS = /[-_](img|image|photo|pic|banner|final|finale|copy|new|edited)\d*$/i
const TRAILING_NUMBER = /[-_\s]\d+$/

/**
 * A name with no picture in it.
 *
 * Phone and camera filenames — `IMG-20220321-WA0019`, `DSC_0912`, `PXL_2022…`.
 * Nothing in them describes anything, and no amount of tidying will change that.
 * Recognised so the caller can say so rather than produce a tidier version of
 * the same noise.
 */
const CAMERA_NAME = /^(img|dsc|dscn|pxl|photo|pic|screenshot|whatsapp)[-_ ]?\d/i

export const isCameraName = (text: string): boolean => CAMERA_NAME.test(text.trim())

export function tidyAlt(text: string): string {
  let out = text.replace(SIZE_SUFFIX, '')

  /**
   * A slug is turned into a sentence; anything else is only repaired at the seams.
   *
   * The test is capitals, not spaces. `open-area-img` is lower-case throughout —
   * a machine wrote it, every hyphen in it stands in for a space, and all of them
   * can open up. `Black-backed-Forktail` has capitals, which means somebody typed
   * at least part of it, and its first hyphen belongs to the bird's name. Opening
   * that one produced "Black backed Forktail", which is not a species.
   *
   * So a capital anywhere is treated as evidence that a person chose the
   * punctuation, and only the joins between a lower-case letter and a capital are
   * touched — those are where a filename ran two real words together.
   */
  const machineWritten = !/[A-Z]/.test(out.slice(1))

  if (machineWritten && !out.includes(' ')) {
    out = out.replace(FILE_WORDS, '').replace(TRAILING_NUMBER, '').replace(/[-_]+/g, ' ')
    // Sentence case, not title case: "Open area" reads as a description,
    // "Open Area" reads as a heading.
    out = out.charAt(0).toUpperCase() + out.slice(1)
  } else {
    out = out.replace(SLUG_SEAM, '$1 $2').replace(RUN_TOGETHER, '$1 $2')

    /**
     * A hyphen in front of a joining word was never part of a name.
     *
     * `Balcony-of-Room-with-Twin-Beds` keeps its capitals, so the seam rule above
     * leaves "Balcony-of Room-with Twin Beds" — correct punctuation nowhere. No
     * species, place or person is written with "of" or "with" hyphenated onto the
     * word before it, so those joins can open with no risk to the names this is
     * otherwise so careful about.
     */
    out = out.replace(/-(of|with|at|in|on|the|and|for|from|to|a|an)\b/gi, ' $1')
  }

  return out.replace(LOOSE_HYPHENS, '').replace(/\s+/g, ' ').trim()
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

  const found = extracted[file] ?? EXTRA[file] ?? extracted[bare] ?? EXTRA[bare]
  if (!found) return undefined

  // EXTRA is written by hand and needs nothing; the extracted map is where the
  // filename punctuation comes from, and tidying both costs nothing.
  const tidied = tidyAlt(found)
  return tidied || undefined
}

/**
 * The site's own name, for the logo.
 *
 * The logo appears on all 26 pages, is the link home, and the origin describes
 * it as "wild-kumaon-logo-finale" — the only alt text on the site that every
 * single visitor's screen reader meets.
 *
 * "Wild Kumaon" rather than "Wild Kumaon logo": the word logo describes the
 * image, and alt text names what the image is *of*. A reader who has just been
 * told this is a link home does not need to hear it is a picture.
 */
export const LOGO_ALT: Record<string, string> = {
  'wild-kumaon-logo-finale': 'Wild Kumaon',
  'wild-kumaon-logo-finale-1': 'Wild Kumaon',
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
