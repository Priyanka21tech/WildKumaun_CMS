# _legacy

The first pass at rebuilding wildkumaon.com as hand-authored React — a Header, a
Footer, an EnquiryForm, an Accordion, a TestimonialSlider, a small `ui.jsx`, and a
page component per route, reading from the extracted JSON in `../content` through
`wildkumaun/src/lib/content.js`.

It was set aside in favour of the mirror the site serves today: the pages under
`wildkumaun/content/mirror/` are the origin's own Astra/Elementor markup, rendered
verbatim, which is why the site looks pixel-identical to the original.

Nothing here is built or served — it sits outside `wildkumaun/src/app` on purpose,
so Next never turns these files into routes.

It is kept because it is the natural starting point for the Payload migration. As
each page moves from mirrored HTML to CMS-driven content, the component for that
page already exists here; it needs its data source swapped from `content/*.json`
to Payload, not to be written from scratch.
