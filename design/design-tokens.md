# Wild Kumaon — Design Tokens

Extracted from the live site (`https://www.wildkumaon.com`) — mirrored in
`_reference/wildkumaon.com/`. The live site is a Next.js shell that renders the
original **Elementor/Astra** markup, so the authoritative styling lives in
`_reference/wildkumaon.com/wp/site.css` (1.1 MB of Elementor per-element rules).
Values below are the *applied* values, ranked by usage count across those rules —
not framework defaults.

---

## 1. Colour palette

### Brand (gold)
The single most-used accent. Every CTA button on the site is gold-on-black.

| Token | Hex | Role | Usage |
|---|---|---|---|
| `brand` | `#DCB415` | Button fill (rest), primary accent | 35 bg rules |
| `brand-bright` | `#FFD014` | Button fill (hover), highlight text | 39 bg + 10 color rules |
| `brand-amber` | `#F2B01E` | Secondary amber accent, icons | 25 |
| `brand-bronze` | `#B59753` | Button border on hover, dividers | 30 |

### Ink (near-black text + dark surfaces)
The site uses a spread of near-identical blacks (Elementor per-element drift).
Collapsed into three roles:

| Token | Hex | Role | Source values it replaces |
|---|---|---|---|
| `ink` | `#070707` | Headings, primary text on light | `#070707` `#060101` `#050000` `#020101` `#0D0808` `#0B0C01` |
| `ink-soft` | `#272727` | Sub-headings, strong body | `#272727` `#222222` |
| `ink-deep` | `#030C10` | Darkest headings / overlays | `#030C10` `#000203` |

### Body & muted
| Token | Hex | Role |
|---|---|---|
| `body` | `#3A3A3A` | Default body copy |
| `muted` | `#7A7A7A` | Captions, meta, secondary copy |
| `muted-light` | `#999999` | Placeholders, disabled |

### Surfaces
| Token | Hex | Role |
|---|---|---|
| `paper` | `#FFFFFF` | Page background |
| `paper-off` | `#FCFCFC` | Barely-off white blocks |
| `surface` | `#F4F4F4` | Alternating section background |
| `surface-warm` | `#FAF5F1` | Warm alternating section |
| `dark` | `#11202A` | Dark section / footer slate |
| `dark-ink` | `#070707` | Full-black section / overlay base |

### Lines & overlays
| Token | Value | Role |
|---|---|---|
| `rule` | `#EAEAEA` | Hairline dividers, card borders |
| `rule-strong` | `#DDDDDD` | Heavier dividers |
| `overlay` | `#1A0808` @ 44% (`#1A080870`) | Image scrim over hero photos |
| `overlay-soft` | `#080707` @ 39% (`#08070763`) | Lighter image scrim |
| `on-dark` | `#FFF9F9` | Text on dark/photo backgrounds (warm white) |
| `on-dark-dim` | `#FFF9F9` @ 15% (`#FFF9F926`) | Dimmed text on dark |

### Accents (sparse)
| Token | Hex | Role |
|---|---|---|
| `link` | `#0274BE` | Inline links (also the Next shell's `--color-brand`) |
| `link-bright` | `#1085E4` | Link hover / info button |
| `lime` | `#D2DF64` | Occasional nature-green highlight block |
| `danger` | `#D9534F` | Form errors |

---

## 2. Typography

### Families
| Token | Stack | Role | Usage |
|---|---|---|---|
| `sans` | `"Open Sans", ui-sans-serif, system-ui, sans-serif` | **Primary.** Body copy + most headings | 150 rules |
| `roboto` | `"Roboto", ui-sans-serif, system-ui, sans-serif` | Secondary — buttons, nav, UI labels | 37 rules |
| `display` | `"GFS Didot", Georgia, serif` | Display/feature headings (Didone, high contrast) | 6 rules |
| `script` | `"Sevillana", cursive` | Decorative script accent over hero imagery | 4 rules |
| `slab` | `"Roboto Slab", Georgia, serif` | Elementor secondary global (rarely applied) | 22 |

Self-hosted woff2 under `_reference/wildkumaon.com/wp/fonts/` (Google Fonts,
`font-display: swap`).

### Heading scale (applied font-sizes, by frequency)
| Step | px | rem | Typical use |
|---|---|---|---|
| `display` | 42 | 2.625 | Hero / page title (20 rules) |
| `h1` | 38 | 2.375 | Page heading |
| `h2` | 35 | 2.1875 | Section heading (20 rules) |
| `h2-alt` | 36 | 2.25 | Section heading variant (14 rules) |
| `h3` | 33 | 2.0625 | GFS Didot feature heading |
| `h3-alt` | 30 | 1.875 | Sub-section |
| `h4` | 26 | 1.625 | Card title (GFS Didot) |
| `h5` | 24 | 1.5 | Small card title |
| `h6` | 21 | 1.3125 | Eyebrow / label (20 rules) |
| `lead` | 20 | 1.25 | Intro paragraph |
| `body-lg` | 18 | 1.125 | Large body (22 rules) |
| `body` | 16 | 1.0 | Default body (29 rules) |
| `small` | 15 | 0.9375 | Meta, captions (23 rules) |
| `button` | 0.9em | — | Button label (relative, Elementor) |

### Astra theme scale (inline customizer CSS)
Alongside the Elementor per-element sizes, the Astra theme ships its own scale in
inline `<style>` on every page. It governs blog/archive/WordPress-templated pages:

| Selector | Size |
|---|---|
| `h1`, `.entry-content h1` | 40px / 2.667rem |
| `h2`, `.entry-content h2` | 30px / 2rem |
| `h3`, `.entry-content h3` | 25px / 1.667rem |
| `h4`, `.entry-content h4` | 20px / 1.333rem |
| `h5`, `.entry-content h5` | 18px / 1.2rem |
| `h6`, `.entry-content h6` | 15px / 1rem |
| `.entry-title` | 30px / 2rem |
| `.ast-archive-title` | 40px / 2.667rem |
| `.site-title` | 35px / 2.333rem |
| `.site-description`, `.widget-title` | 15px / 21px |

Astra also sets, in the same inline block:
`body` and all headings `#3a3a3a`; link/accent, `::selection` background, focus
border and `.entry-meta` all `#0274be`; logo `max-width: 300px`.

Line heights: body `1.7`, headings `1.2`, tight UI `1.0`.
Heading weight: `600`. Button weight: `500`. Body weight: `400`.

---

## 3. Layout

| Token | Value | Note |
|---|---|---|
| `container` | `1140px` | Elementor boxed section max-width — the site's real content width |
| `container-wide` | `1200px` | Occasional wide sections |
| `container-narrow` | `1024px` | Inner/text sections (44 rules) |
| `measure` | `68ch` | Prose max-width (from the Next shell) |
| `gutter` | `20px` | Elementor default column gap |
| `spacing-unit` | `0.25rem` | Tailwind base |

### Breakpoints (Elementor)
| Name | Width |
|---|---|
| `mobile` | `≤ 767px` |
| `tablet` | `768px – 1024px` |
| `desktop` | `≥ 1025px` |

---

## 4. Buttons

**Primary (the site's only real CTA style):**
```css
font-family: "Roboto", sans-serif;
font-size: 0.9em;      /* ~14.4px at 16px base */
font-weight: 500;
color: #060101;         /* near-black label */
fill:  #060101;
background-color: #DCB415;
border-radius: 10px;
padding: 12px 24px;     /* Elementor size-sm */
transition: all .3s;
```
**Hover:**
```css
background-color: #FFD014;
border-color: #B59753;
```

### Elementor size ramp (inherited, still in use)
| Size | font-size | padding | radius |
|---|---|---|---|
| `xs` | 13px | 10px 20px | 2px |
| `sm` | 15px | 12px 24px | 3px |
| `md` | 16px | 15px 30px | 4px |
| `lg` | 18px | 20px 40px | 5px |
| `xl` | 20px | 25px 50px | 6px |

The site overrides radius to **10px** on its own buttons; treat 10px as the
brand radius and the ramp above as legacy.

---

## 5. Misc

- Transition: `.3s` on buttons, `.15s cubic-bezier(.4,0,.2,1)` default.
- Focus ring: `2px solid` brand, `2px` offset.
- Images: `max-width:100%; height:auto`.
- Body antialiasing: `-webkit-font-smoothing: antialiased`.
