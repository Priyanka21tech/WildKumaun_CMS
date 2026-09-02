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
   *
   * A key is a widget hash, optionally followed by a descendant selector —
   * `'6c3f0dd h2'` reaches only the headings inside that widget, for the case
   * where the origin styled the headings and the paragraphs differently.
   */
  css?: Record<string, string>
  /**
   * How the pictures beside a text block are drawn.
   *
   * The home page's about section rotates several; conservation's petition shows
   * one, and rendering that as a carousel of one would put arrows either side of
   * a still image.
   */
  imageAs?: 'carousel' | 'image'
  /** The form sits in the second column rather than the first. */
  reversed?: boolean
  /**
   * What level the heading beside the form is.
   *
   * The home page makes it an h3 under its own h2; the contact page and the guest
   * book give it an h2 of its own. It is the same field either way, so the level
   * belongs to the placement rather than the block.
   */
  asideTag?: 'h2' | 'h3'
  /**
   * The body is everything in the section, not one widget.
   *
   * /team writes three headings and three paragraphs as six widgets in one
   * section. They are one run of prose, so the seed gathers the lot into a single
   * rich text rather than needing three targets kept in order by hand.
   */
  wholeSection?: boolean
  /**
   * A widget hash per item, where the origin's items are not interchangeable.
   *
   * A gallery normally renders every picture under one hash because every rule
   * behind them is identical. Conservation's two logos are the exception: one is
   * pushed down 200px and the other has rounded corners, so each needs its own.
   */
  itemWidgets?: string[]
  /** Representative hashes for the items this block renders. */
  item?: {
    image?: string
    label?: string
    text?: string
    button?: string
    /** A second heading inside the same section — the form's copy has its own. */
    aside?: string
    /** A picture in the column beside the form — the guest book shows one. */
    asideImage?: string
    /** The contact details beside the form: a name, an address list, the social icons. */
    contactName?: string
    contactList?: string
    socialHeading?: string
    social?: string
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
  {
    /**
     * All three of the page's headings and their paragraphs, in one rich text.
     *
     * The origin gives each pair its own heading and text widget — six widgets in
     * one section — but they are one run of prose about one subject, and a block
     * per pair would mean three targets that must be kept in order by hand. Rich
     * text already holds headings, so it holds these.
     */
    value: 'team-guides',
    label: 'Birding Guides — what we offer',
    page: 'team',
    section: '119ccf0',
    span: 100,
    columns: ['fb61487'],
    wholeSection: true,
    // Only the headings: the origin's paragraphs carry no colour of their own.
    css: { '6c3f0dd h2': 'color:#54595F;' },
    item: { text: '6c3f0dd' },
  },
  {
    value: 'conservation-intro',
    label: 'Conservation — "proudly supports Sattal Conservation Club"',
    page: 'conservation',
    section: '81101ce',
    span: 100,
    columns: ['b671337'],
    item: { label: 'f2ba109' },
  },
  {
    value: 'conservation-about',
    label: 'Conservation — about the club',
    page: 'conservation',
    section: 'a3eeb55',
    span: 100,
    columns: ['0d6b8d6'],
    css: { af21b00: 'font-size:14pt;color:#333333;' },
    item: { text: 'af21b00' },
  },
  {
    value: 'conservation-risk',
    label: 'Conservation — "the future of Sattal’s lakes"',
    page: 'conservation',
    section: '4b874f1',
    span: 100,
    columns: ['921bd45'],
    item: { label: 'bd93788' },
  },
  {
    value: 'conservation-detail',
    label: 'Conservation — what is at risk',
    page: 'conservation',
    section: 'a9c2b5e',
    span: 100,
    columns: ['ff47db2'],
    css: { '0d2056b': 'font-size:14pt;color:#333333;' },
    item: { text: '0d2056b' },
  },
  {
    value: 'conservation-petition',
    label: 'Conservation — Save Sattal petition',
    page: 'conservation',
    section: '880b958',
    span: 50,
    columns: ['cb178b3', '9342d1a'],
    // One photograph, not a rotation — see imageAs.
    imageAs: 'image',
    css: { '4d5069c': 'text-align:center;color:#333333;font-size:24pt;' },
    item: { image: '17608e9', text: '4d5069c' },
  },
  {
    value: 'contact-heading',
    label: 'Contact Us — page heading',
    page: 'contact-us',
    section: '2d360af',
    span: 100,
    columns: ['c3e5b93'],
    item: { label: '69b68ed' },
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
    asideTag: 'h3',
    item: { label: 'b60aac8', image: 'dd9d707', text: 'cc62ff1', button: '915492a', aside: '6aca2d3' },
  },
  {
    value: 'contact-form',
    label: 'Contact Us — enquiry form and address',
    page: 'contact-us',
    section: '528b8a8',
    span: 50,
    columns: ['4c8def5', '7a2e830'],
    asideTag: 'h2',
    item: {
      label: '2fa0fd4',
      image: '6148b30',
      aside: '00e29a9',
      contactName: 'cbd3cd7',
      contactList: 'fadf5f1',
      socialHeading: '6014fc7',
      social: '07839c3',
    },
  },
  {
    /**
     * The one target where the form sits on the right. The origin puts the
     * photograph first here and the form beside it, the other way round from the
     * home page — so `reversed` rather than a second set of hashes.
     */
    value: 'guestbook-form',
    label: 'Guest Book — leave a comment',
    page: 'guest-book',
    section: 'bae9493',
    span: 50,
    columns: ['6be1055', '867c431'],
    reversed: true,
    asideTag: 'h2',
    item: { label: '3b4dfdd', image: '881ec20', aside: '05179fe', asideImage: '70e962e' },
  },
]

export const MAP_TARGETS: SectionTarget[] = [
  {
    value: 'contact-map',
    label: 'Contact Us — map',
    page: 'contact-us',
    section: '386ff71',
    span: 100,
    columns: ['c52cb14'],
    item: { image: '8e73bab' },
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
  {
    value: 'conservation-logos',
    label: 'Conservation — club logo and objectives',
    page: 'conservation',
    section: '1925ed8',
    span: 50,
    columns: ['8ccaeac', 'e4a9607'],
    // Two pictures that are not interchangeable: one is pushed down 200px, the
    // other has rounded corners.
    itemWidgets: ['bc5fc85', 'badd7d4'],
    item: { image: 'bc5fc85' },
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
