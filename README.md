# Wild Kumaon — mirror & extraction

The "get the exact site" step. Everything here is derived from the live site at
`https://www.wildkumaon.com`, and is the input for the seed.

## Layout

```
_reference/wildkumaon.com/   Byte-faithful mirror: 26 pages, CSS, fonts, images
assets/images/               Every site image, original filenames, flat
content/*.json               Transcribed content, ready to seed
design/                      design-tokens.md, tailwind.config.js, theme.css
notes/dump/*.txt             Plain-text dump of each page (transcription aid)
_tools/                      The scripts that produced all of the above
```

## What the live site actually is

A **Next.js app on Vercel** that serves the original **WordPress / Astra /
Elementor** markup verbatim. That matters for the design work: the thin Next
shell defines only a handful of tokens, while the real applied styling lives in
`_reference/wildkumaon.com/wp/site.css` (1.1 MB of Elementor per-element rules)
plus Astra's inline customizer CSS. The tokens in `design/` come from the
applied values, ranked by usage — not from framework defaults.

## Mirror

`_tools/mirror.mjs` — fetches the 26 known pages, flattens them to `<slug>.html`,
and rewrites every internal link and asset URL to a relative local path.

`_tools/fetch-assets.mjs` — downloads assets. It runs strictly serial with a
1.5 s delay because the origin sits behind a **Vercel Security Checkpoint** that
trips on bursts (the first parallel run tripped it at ~525 requests and got the
IP 403'd for several minutes). On a block it waits for the checkpoint to lift
rather than spending its retry budget. Resume-safe — rerun it any time and it
skips what is already on disk.

`_tools/asset-list.json` is the manifest, built by scanning the mirrored HTML and
CSS. Note that the site's legacy `wp-content/uploads/` paths are dead (403) — every
image is served from `/media/`, so the manifest remaps them and the mirrored HTML
has its lightbox links rewritten to match.

**Result:** 26 pages, 337 images, 54 font files, 2 stylesheets — 152 MB.
Every image referenced by a page is present; of 1,638 local references in the
mirrored HTML and CSS, 24 remain unresolved: WordPress taxonomy pages
(`category/general`, `author/adminneer`) that are not in the nav, and two
plugin admin icons that never render.

## Content

| File | Contents |
|---|---|
| `testimonials.json` | 10 guest testimonials (name + full quote) |
| `amenities.json` | 4 groups — 13 amenities, 7 WFH facilities, 6 activities, 5 premises facilities |
| `faqs.json` | 6 FAQs, each with its answer and bullet points |
| `packages.json` | 4 packages + the 5N/6D birding tour with its full 6-day itinerary and species lists |
| `experiences.json` | 4 experiences (swimming, nature walk, birdwatching, sound bath) |
| `bird-art.json` | 11 artworks by Abha Singh + artist statement + 2 artist portraits |
| `posts.json` | 3 blog posts — excerpt, full body blocks, images, outbound links |
| `guides.json` | Birding-guide offering, positioning, and the named team |
| `pages.json` | 26 pages, 153 sections. Per-page layout: every section in DOM order with its headings, copy, list items, images, background images and buttons |
| `site-settings.json` | Identity, contact, address, full nav tree, CTAs, forms, how-to-reach |

Original spellings are preserved verbatim throughout (`Car Rentel`,
`Fine Dinning`, `Kichen and Dinning`, `TESTMONIALS`, `Order Know`) with a `sic`
field alongside where it could otherwise read as a typo introduced here.

Image paths in `content/*.json` point at `assets/images/`, so the JSON and the
image folder line up with no rewriting.

## Reproducing

```bash
node _tools/mirror.mjs           # pages + link rewriting
node _tools/fetch-assets.mjs     # images and fonts (slow by design)
node _tools/extract-testimonials.mjs
node _tools/extract-posts.mjs
node _tools/extract-pages.mjs
node _tools/extract-pages-fallback.mjs
```

`extract-pages-fallback.mjs` must run after `extract-pages.mjs` — it adds the
WordPress `<main>` content region to pages whose copy is not inside Elementor
sections (about-us, blog, vision, enquiry, birders-paradise).
