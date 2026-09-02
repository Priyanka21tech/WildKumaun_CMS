/**
 * Which mirrored section each block takes over, and the widget hashes it uses.
 *
 * A block has to say where on the page it goes, because the mirror is one long
 * string of Elementor markup and nothing in a block's fields could work it out.
 * The obvious way would be to put the Elementor hash on the block — but
 * `c9d39f8` means nothing to whoever is editing the page, and a hash typed into
 * an admin field is a hash nobody can verify. So the block stores a name, and
 * this file is the one place that knows what the name points at. It is also why
 * a block and its renderer cannot disagree: the select options and the ids being
 * spliced are read from the same table.
 *
 * The hashes matter as much as the section id. Elementor writes a rule per
 * widget — `.elementor-3761 .elementor-element.elementor-element-45a166e` — so a
 * widget rendered under the wrong hash is a widget with no styling. They differ
 * by position, not by content: the label under an amenity is 16px and dark in
 * the home page's icon row, and 21px, white and pulled up over the photograph in
 * the row below it. Both are "an amenity label".
 *
 * Within one section every item's hash carries an identical rule, which is what
 * makes it safe to render all of them under the first one. See src/lib/widgets.ts.
 *
 * `heading` is the separate section the origin put the title in. Elementor gives
 * a heading its own full-width section rather than nesting it, so a block that
 * owns a heading owns two sections — it renders the heading itself and blanks the
 * original, which is what makes an emptied `heading` field visibly remove the
 * heading rather than quietly fall back to the mirror's words.
 */

export type SectionTarget = {
  /** Stored on the block. */
  value: string
  /** What the admin panel calls it. */
  label: string
  /** Page slug the section lives on. */
  page: string
  /** `data-id` of the section whose contents the block replaces. */
  section: string
  /** How wide each column is — Elementor's `elementor-col-N`. */
  span: number
  /**
   * The origin's column ids, in order.
   *
   * Elementor styles columns as well as widgets — the enquiry form's dark panel
   * is `background-color:#11202A` on its column, the gold ring round each partner
   * logo is a border on its column, and the "Be a free bird" copy sits at the
   * bottom of its half because of an `align-items` rule on that column. A column
   * rendered without its id gets none of that, which is how the form lost its
   * panel the first time this was written.
   *
   * A repeating grid needs one id: every partner column carries an identical
   * rule, so all eight render under the first, the same way their widgets do. A
   * fixed layout needs each, because its halves differ — the form's left column
   * is a dark panel and its right is 80px of padding.
   */
  columns?: string[]
  /** The column inside the separate heading section. */
  headingColumn?: string
  /** `data-id` of the separate heading section above it, where the origin made one. */
  heading?: string
  /** The heading widget inside that section. */
  headingWidget?: string
  /** The widget the origin puts a subtitle in, under the heading. */
  subtitleWidget?: string
  /**
   * How the origin draws this spot.
   *
   * The block's own `display` field is what actually decides, because that is the
   * page's choice to make. This is only what the origin chose, so the seed can
   * reproduce it — switching a section to the CMS has to change nothing, and it
   * cannot if the seed has to guess which of three shapes the section was.
   */
  display?: 'icon-grid' | 'photo-grid' | 'list'
  /**
   * Typography the origin set inline, as CSS keyed by widget hash.
   *
   * WordPress's editor writes a paragraph's font and alignment into the markup
   * as `style` attributes on `<p>` and `<span>`. Rich text stored in Payload does
   * not carry those — nor should it, since they are how the text looks rather
   * than what it says — so a section moved to the CMS loses its centring and its
   * Georgia and comes out in the theme's default. That is a real change to the
   * page, and this is where it is put back: as a rule on the widget, which is
   * where Elementor would have put it, and which keeps applying to whatever an
   * editor types next.
   */
  css?: Record<string, string>
  /** Representative hashes for the items this block renders. */
  item?: {
    image?: string
    label?: string
    text?: string
    button?: string
    /** A second heading inside the same section — the form's copy has its own. */
    aside?: string
  }
}

export const AMENITY_TARGETS: SectionTarget[] = [
  {
    value: 'home-icons',
    columns: ['a9e87e6'],
    headingColumn: '6eefdd9',
    display: 'icon-grid',
    label: 'Home — amenity icons',
    page: 'home',
    section: 'c9d39f8',
    span: 14,
    heading: 'a57d6ca',
    headingWidget: '65e98f5',
    subtitleWidget: '93634b3',
    css: {
      '93634b3': 'text-align:center;font-family:georgia,palatino,serif;font-size:12pt;color:#333333;',
    },
    item: { image: '9b70847', label: '45a166e' },
  },
  {
    value: 'home-photos-1',
    columns: ['c36c06c'],
    display: 'photo-grid',
    label: 'Home — amenity photos (first row)',
    page: 'home',
    section: '3cca38e',
    span: 33,
    item: { image: '76b3471', label: '79ba219' },
  },
  {
    value: 'home-photos-2',
    columns: ['bdf6deb'],
    display: 'photo-grid',
    label: 'Home — amenity photos (second row)',
    page: 'home',
    section: 'b39d718',
    span: 33,
    item: { image: 'c583b19', label: '85f911f' },
  },
  {
    value: 'wfh-facilities',
    columns: ['de7ded4'],
    headingColumn: '87367c5',
    display: 'icon-grid',
    label: 'Work from Hills — Facilities',
    page: 'work-from-hills',
    section: 'c1fbdfa',
    span: 14,
    heading: 'ac125f6',
    headingWidget: '9075f1d',
    item: { image: '13ae4c1', label: '645ff35' },
  },
  {
    value: 'wfh-activities',
    columns: ['91ae023'],
    headingColumn: '1b60f2e',
    display: 'photo-grid',
    label: 'Work from Hills — Activities',
    page: 'work-from-hills',
    section: '5ab201a',
    span: 33,
    heading: '8f81b70',
    headingWidget: '5b79d81',
    item: { image: '7bcdb36', label: '59b7585' },
  },
  {
    // The only list-shaped one: a single photograph beside a bulleted list,
    // rather than a picture per item.
    value: 'premises-facilities',
    columns: ['7fee057', '8a303dd'],
    headingColumn: '47bfcfb',
    display: 'list',
    label: 'Facilities — at premises',
    page: 'facilities',
    section: 'c62c777',
    span: 50,
    heading: 'f70d30a',
    headingWidget: '63044b0',
    item: { image: '1f8c894', text: 'db049f8' },
  },
]

/**
 * The page's own words — a heading, a paragraph, sometimes a button.
 *
 * Four sections on the home page that are nothing but copy. They are one block
 * type rather than four, because what differs between them is which of the three
 * parts they use and whether they sit full width or in the right-hand half of a
 * split row — not what kind of thing they are.
 *
 * The split ones put their content on the right. The left half holds a small
 * carousel on the about section and nothing at all on the call to action, which
 * is why `images` is optional rather than what tells the two apart.
 */
export const TEXT_TARGETS: SectionTarget[] = [
  {
    value: 'home-intro',
    columns: ['0cbabfe'],
    label: 'Home — "WILD KUMAON- An Eco-Resort at Sattal"',
    page: 'home',
    section: '5110a54',
    span: 100,
    item: { label: '217b9af' },
  },
  {
    value: 'home-about',
    columns: ['dad6ad1', '4607010'],
    label: 'Home — about the resort',
    page: 'home',
    section: 'b2439dc',
    span: 50,
    css: { '9bef198': 'font-family:georgia,palatino,serif;font-size:14pt;color:#333333;' },
    item: { image: '1f0100e', text: '9bef198', button: '0bbdfba' },
  },
  {
    value: 'home-note',
    columns: ['a2fcf06'],
    label: 'Home — "We are a choice of Bird Watchers"',
    page: 'home',
    section: 'cfae1b7',
    span: 100,
    item: { text: 'eaa0d50' },
  },
  {
    value: 'home-cta',
    columns: ['1e23c45', '365efae'],
    label: 'Home — "Be a free bird in the Kumaon"',
    page: 'home',
    section: '5a14ca7',
    span: 50,
    item: { label: 'abf38f0', text: 'b8b43e4', button: 'e000efe' },
  },
]

/**
 * Where a form sits on a page.
 *
 * The origin gives the enquiry section two halves: the form on the left under
 * its heading, and a block of contact copy with a button on the right. Both
 * belong to the same block, because they are one section and splitting them
 * would mean two blocks that have to be kept next to each other by hand.
 */
export const FORM_TARGETS: SectionTarget[] = [
  {
    value: 'home-enquiry',
    columns: ['5020fa6', '2b1baa8'],
    label: 'Home — "Ask Your Queries"',
    page: 'home',
    section: 'a738d72',
    span: 50,
    item: { label: 'b60aac8', image: 'dd9d707', text: 'cc62ff1', button: '915492a', aside: '6aca2d3' },
  },
]

export const PACKAGE_TARGETS: SectionTarget[] = [
  {
    value: 'home-packages',
    columns: ['158262d', '123fd02'],
    headingColumn: 'e970a4d',
    label: 'Home — Packages',
    page: 'home',
    section: 'b895c10',
    // Two columns of cards, not four: the origin stacks two cards in each.
    span: 50,
    heading: 'f9c58ef',
    headingWidget: 'feee2e7',
    item: { label: '424639f', image: '9c104b0', text: '4bfab32', button: '2fcc71f' },
  },
]

export const GALLERY_TARGETS: SectionTarget[] = [
  {
    value: 'home-gallery',
    columns: ['2766524'],
    headingColumn: '8650871',
    label: 'Home — Gallery',
    page: 'home',
    section: '3bb0dd7',
    span: 100,
    heading: '3649378',
    headingWidget: 'ba86341',
    item: { image: 'ddb0fb8' },
  },
]

export const PARTNER_TARGETS: SectionTarget[] = [
  {
    value: 'home-partners',
    columns: ['0f87a97'],
    headingColumn: 'f7a2dd1',
    label: 'Home — Partners & Associations',
    page: 'home',
    section: 'b7966ac',
    span: 12,
    heading: '2d67e5b',
    headingWidget: 'd3340c1',
    item: { image: '3745511' },
  },
]

/** The `options` shape a select field wants. */
export const asOptions = (targets: SectionTarget[]) =>
  targets.map(({ value, label }) => ({ value, label }))

/** The target a block stored, or undefined if the name is no longer in the table. */
export const targetFor = (targets: SectionTarget[], value?: string | null) =>
  targets.find((target) => target.value === value)
