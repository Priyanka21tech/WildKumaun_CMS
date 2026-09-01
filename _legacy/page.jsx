import Link from 'next/link'
import { site, amenityGroup, packages, testimonials, imagesFor } from '@/lib/content'
import { Button, Section, SectionHeading } from '@/components/ui'
import TestimonialSlider from '@/components/TestimonialSlider'
import EnquiryForm from '@/components/EnquiryForm'

const img = (p) => `/${p}`

export default function HomePage() {
  const amenities = amenityGroup('amenities')
  const gallery = imagesFor('/').filter((i) => !i.includes('logo')).slice(0, 8)

  return (
    <>
      {/* hero */}
      <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/wild-kumaon-an-eco-resort-1024x683.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-scrim" />
        <div className="relative mx-auto w-full max-w-container px-5 text-center">
          <p className="font-script text-h3-alt text-on-dark">Sattal, Uttarakhand</p>
          <h1 className="mt-2 font-sans text-display font-heading uppercase tracking-wide text-on-dark md:text-[3.5rem]">
            Wild Kumaon
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-body-lg text-on-dark/90">{site.tagline}</p>
          <p className="mx-auto mt-3 max-w-2xl text-on-dark/80">{site.positioning[2]}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Button href="/contact-us" size="lg">{site.ctas.primary}</Button>
            <Button href="/sattal-5n-6d-birding-tour" size="lg" className="!bg-transparent !text-on-dark !border-on-dark hover:!bg-brand hover:!text-[#060101]">
              Birding Tours
            </Button>
          </div>
        </div>
      </section>

      {/* intro */}
      <Section>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <SectionHeading align="left">Wild Kumaon — An Eco-Resort at Sattal</SectionHeading>
            <p className="mt-6 text-body leading-body">
              It is one of the purely dedicated Wildlife Lodges in Uttarakhand, Himalayas, India. The team is
              dedicated to hosting a guest in ethical ways and eco-friendly practices. This place to stay is
              preferred by Nature Lovers and guests who want to accommodate themselves in a fresh environment and
              only between a few people.
            </p>
            <p className="mt-4 text-body leading-body">
              Accommodation is perfect if you are visiting Sattal to enjoy its birds and Nature. Wild Kumaon also
              loves to host on monthly basis, long stays in a Homestay manner for Work from Hills/Work from Home.
            </p>
            <Button href="/about-us" className="mt-8">{site.ctas.more}</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/forest-view-of-the-property-1024x683.jpg" alt="Forest view of the property" className="h-64 w-full rounded object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/open-area-img-1024x683.jpg" alt="Open area at Wild Kumaon" className="mt-8 h-64 w-full rounded object-cover" />
          </div>
        </div>
      </Section>

      {/* amenities */}
      <Section tone="surface">
        <SectionHeading sub={amenities.subtitle}>{amenities.title}</SectionHeading>
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {amenities.items.map((a) => (
            <li
              key={a.label}
              className="flex min-h-24 items-center justify-center rounded border border-rule bg-paper px-4 py-6 text-center font-roboto text-sm text-ink transition-colors hover:border-brand hover:bg-brand/10"
            >
              {a.label}
            </li>
          ))}
        </ul>
      </Section>

      {/* packages */}
      <Section>
        <SectionHeading>Packages</SectionHeading>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((p) => (
            <article key={p.id} className="group flex flex-col overflow-hidden rounded border border-rule bg-paper shadow-card">
              <div className="aspect-[3/2] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img(p.image)}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-h4 text-ink">{p.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-body text-body-muted">{p.blurb}</p>
                <Button href={p.page || '/contact-us'} size="xs" className="mt-6 self-start">
                  {p.cta.label}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* be a free bird */}
      <Section tone="dark">
        <div className="text-center">
          <h2 className="font-display text-h2 text-on-dark">Be a free bird in the Kumaon</h2>
          <p className="mx-auto mt-5 max-w-measure text-on-dark/75">
            further Kumaon visits and tours designed with a decade of experience of Naturalist… call or make an
            enquiry to know more.
          </p>
          <Button href="/contact-us" className="mt-8">{site.ctas.secondary}</Button>
        </div>
      </Section>

      {/* gallery */}
      <Section>
        <SectionHeading>Gallery</SectionHeading>
        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          {gallery.map((g) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={g} src={img(g)} alt="" className="aspect-square w-full rounded object-cover" loading="lazy" />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/gallery">View Gallery</Button>
        </div>
      </Section>

      {/* testimonials */}
      <Section tone="warm">
        <SectionHeading>Testimonials</SectionHeading>
        <TestimonialSlider items={testimonials.slice(0, 6)} />
        <div className="mt-10 text-center">
          <Button href="/guest-book">View More</Button>
        </div>
      </Section>

      {/* enquiry */}
      <Section id="enquiry" tone="surface">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <SectionHeading align="left">{site.forms.queries.title}</SectionHeading>
            <p className="mt-6 text-body leading-body">{site.forms.queries.blurb}</p>
            <p className="mt-6 font-roboto text-sm uppercase tracking-wide text-body-muted">Or</p>
            <Button href="/contact-us" className="mt-4">{site.ctas.primary}</Button>
          </div>
          <EnquiryForm />
        </div>
      </Section>
    </>
  )
}
