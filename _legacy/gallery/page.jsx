import { imagesFor } from '@/lib/content'
import { Section, PageHero } from '@/components/ui'

export const metadata = { title: 'Gallery' }

export default function GalleryPage() {
  // Pool every photograph the mirror captured across the photo-led pages.
  const pool = [
    ...imagesFor('/gallery'),
    ...imagesFor('/property-photographs'),
    ...imagesFor('/birds-of-sattal-and-around'),
    ...imagesFor('/facilities'),
  ]
  const images = [...new Set(pool)].filter((i) => !i.includes('logo') && !i.includes('favicon'))

  return (
    <>
      <PageHero title="Gallery" image="/assets/images/wild-kumaon-an-eco-resort-1024x683.jpg" />
      <Section>
        <p className="mb-10 text-center text-body-muted">{images.length} photographs</p>
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {images.map((im) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={im}
              src={`/${im}`}
              alt=""
              loading="lazy"
              className="mb-4 w-full break-inside-avoid rounded object-cover shadow-card"
            />
          ))}
        </div>
      </Section>
    </>
  )
}
