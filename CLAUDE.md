# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Two halves of one job: replacing a live WordPress/Astra/Elementor site
(`wildkumaon.com`) with a Payload CMS app, **without the rendered page changing**.

- **Repo root** — the mirror-and-extraction toolchain. `_tools/*.mjs` fetch the
  origin's 26 pages and assets and transcribe them into `content/*.json`,
  `assets/images/`, and `design/`. See `README.md` for the full inventory and the
  reproduction order (`extract-pages-fallback.mjs` must run *after*
  `extract-pages.mjs`).
- **`wildkumaun/`** — the Next.js 16 + Payload 3 app that serves the site. This is
  where nearly all development happens.

The migration is **section by section**, not page by page: every page still
renders from its mirrored HTML, and each CMS block takes over one Elementor
section of it. A page with no blocks renders byte-identically to the origin,
which is what makes it safe to move one section at a time.

## Commands

Run from the repo root (they proxy into `wildkumaun/` via `npm --prefix`):

```bash
npm run dev                 # dev server on :3000
npm run build               # payload generate:types, then next build
npm run mirror              # re-run mirror:pages + mirror:sync + mirror:media
npm run audit               # _tools/audit-links.mjs
```

Run from `wildkumaun/`:

```bash
npm run lint                # eslint
npm run generate:types      # regenerate src/payload-types.ts after any schema change
npm run test:int            # vitest, tests/int/**/*.int.spec.ts
npm run test:e2e            # playwright, tests/e2e/ (auto-starts the dev server)

npx vitest run --config ./vitest.config.mts -t "name of test"   # one int test
npx playwright test --config=playwright.config.ts tests/e2e/admin.e2e.spec.ts   # one e2e file
```

**Use npm, not pnpm.** The `package.json` scripts and several source comments say
`pnpm` (inherited from the Payload template), but the only lockfiles are
`package-lock.json`. `npm run test` will fail because it shells out to `pnpm`;
run `test:int` and `test:e2e` separately.

Seeding and checks (all from `wildkumaun/`, all need `DATABASE_URL` set):

```bash
npm run seed:globals        # then :faqs :testimonials :posts :content :amenities
                            #      :packages :birdart :blocks — see package.json
npm run import:media        # imports assets/images into the Media collection
npm run check:targets       # dry-run every block target against the mirror — see below
npm run a11y:baseline       # axe-core WCAG 2.2 AA scan; needs `npm run dev` running
```

`predev` runs `scripts/drop-orphan-columns.mjs` against `.env` before every dev
start, then `payload generate:types`.

**Environment:** `.env.example` is the stock Payload template's and is wrong for
this project — it names MongoDB. The app uses **Postgres**
(`@payloadcms/db-postgres`); `DATABASE_URL` must be a Postgres connection string.
`PAYLOAD_SECRET` and `NEXT_PUBLIC_SERVER_URL` are also read.
`wildkumaun/README.md` is the unmodified Payload template README — ignore it.

## Architecture

### The render pipeline

`src/app/(frontend)/[[...slug]]/page.tsx` is the whole public site — one
catch-all route. It:

1. Loads the mirrored page record for the slug from `content/mirror/<slug>.json`
   (`src/lib/pages.js`; `index.json` is `/`).
2. Rewrites image URLs to the sizes Payload generated (`responsive-html.ts` +
   `media-map.ts`).
3. Runs each CMS block through its renderer in `src/lib/*-render.ts`, splicing
   generated markup over the Elementor section that block targets.
4. Cuts the mirrored body open at `<header>`/`<footer>` (`shell.ts`) and splices
   in `SiteHeader`/`SiteFooter` rendered from the Header/Footer globals.
5. Applies `withHeadingStructure` and `withAccessibleMarkup` (`a11y-markup.ts`)
   over the finished document.
6. Returns it as a single `dangerouslySetInnerHTML` string, plus `<Enhancements>`
   for client-side behaviour.

**The page must reach the browser as one string.** Astra's stylesheet depends on
`#page > #content` nesting, and the wrappers opened before the header are closed
after the footer — three sibling `dangerouslySetInnerHTML` containers would each
get its own auto-closed subtree and the styling would be gone. This is why every
renderer is a string transform over HTML rather than a React component tree, and
why `src/lib/elementor.ts` counts nesting depth by hand instead of using a regex
or a DOM parser.

`export const dynamic = 'force-dynamic'`, and **there is deliberately no
`generateStaticParams`** — adding it makes Next prerender the routes and admin
saves stop reaching the page. Both decisions are documented in place; read those
comments before changing caching.

### Blocks and targets

A block does not know where it goes — the mirror is one long string.
`src/lib/sections.ts` is the single source of truth mapping a human-readable
target name (stored on the block as a select option) to the Elementor `data-id`
of the section it replaces and the widget hashes it renders under. Block
definitions and their renderers both read that table, so they cannot disagree.

Elementor writes a CSS rule per widget id, so **a widget rendered under the wrong
hash has no styling**. Renderers fail silent by design — an unfound section is
left untouched rather than half-replaced — which means a wrong hash is invisible
on the page and invisible to seeding. `npm run check:targets` is the safety net:
it renders every target with words the origin never wrote and asserts they land.
Run it after touching `sections.ts` or any renderer.

Blocks live in `src/blocks/`, their renderers in `src/lib/<name>-render.ts`, and
the dispatch is the `for (const block of cms?.layout ?? [])` loop in the route.
Adding a block means all three plus a `sections.ts` entry.

### Unreachable pages

`src/lib/reachable.ts` lists six origin pages nothing links to. They render as
pure mirror — no blocks, no banner override — so an empty CMS field can't blank a
section on a page nobody is checking. Content stored against them starts
rendering the day something links to them.

### CMS shape

Collections in `src/collections/`, globals in `src/globals/` (SiteSettings,
Header, Footer), seed data in `src/seed/` with runners in `src/scripts/`. Forms
use `@payloadcms/plugin-form-builder` — the one part of the site that is a
rebuild rather than a migration, since every origin form's token had expired.
Submissions are renamed to the `enquiries` collection.

Live preview goes through `src/app/(frontend)/next/preview/route.ts`, which
enables draft mode and forwards; the page then queries with `draft` and
`overrideAccess`. `resolveHref` in `src/fields/link.ts` and the `livePreview.url`
function in `payload.config.ts` both encode that `home` in the CMS is `/` on the
site — change one and change the other.

### Accessibility layer

Fixes that CSS can reach live in `public/a11y.css`, loaded last so it wins the
cascade; fixes that require different elements live in `src/lib/a11y-markup.ts`
and run over the assembled document. Both are applied at render time rather than
edited into `content/mirror/*.json`, so `npm run mirror:pages` can be re-run
without losing them — the same principle the rest of `src/lib` follows.
`reports/a11y/latest.json` holds the most recent scan.

## Conventions

- **Comments carry the reasoning.** This codebase explains *why* — which
  measurement, which failure, which alternative was tried — in block comments
  above the code. Match that when adding to it, and read the comment before
  changing what it guards; several innocuous-looking edits (adding
  `generateStaticParams`, removing an `!important`, re-tagging a footer heading)
  have already been made and reverted for reasons recorded there.
- Original site spellings are preserved verbatim in content (`Car Rentel`,
  `Fine Dinning`, `TESTMONIALS`), with a `sic` field where it could read as a
  typo introduced here. Don't "fix" them.
- Payload work: start at `wildkumaun/.claude/skills/payload/SKILL.md`, then
  `reference/`.
- `wildkumaun/CLAUDE.md` carries a `nextjs-agent-rules` block that `next dev`
  rewrites — this Next version differs from training data, so consult
  `node_modules/next/dist/docs/`.
