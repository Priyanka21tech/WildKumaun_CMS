import Link from 'next/link'

/** The site's one CTA style: gold fill, near-black label, 10px radius. */
export function Button({ href = '#', children, size = 'sm', className = '' }) {
  const pad = size === 'lg' ? 'px-10 py-5 text-[1.125rem]' : size === 'xs' ? 'px-5 py-2.5 text-[0.8125rem]' : 'px-6 py-3 text-[0.9rem]'
  return (
    <Link
      href={href}
      className={`inline-block rounded-brand border border-transparent bg-brand font-roboto font-button leading-none text-[#060101] transition-all duration-300 hover:border-brand-bronze hover:bg-brand-bright focus-visible:border-brand-bronze focus-visible:bg-brand-bright ${pad} ${className}`}
    >
      {children}
    </Link>
  )
}

/** Centred section heading with the site's gold underscore rule. */
export function SectionHeading({ children, sub, align = 'center', as: As = 'h2' }) {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      <As className="font-sans text-h2 font-heading tracking-wide text-ink uppercase">{children}</As>
      <span
        className={`mt-4 block h-[3px] w-16 bg-brand ${align === 'center' ? 'mx-auto' : ''}`}
        aria-hidden="true"
      />
      {sub ? <p className="mx-auto mt-5 max-w-measure text-body-muted">{sub}</p> : null}
    </div>
  )
}

export function Section({ children, className = '', tone = 'paper', id }) {
  const bg =
    tone === 'surface' ? 'bg-surface' :
    tone === 'warm' ? 'bg-surface-warm' :
    tone === 'dark' ? 'bg-surface-dark text-on-dark' :
    tone === 'black' ? 'bg-surface-black text-on-dark' : 'bg-paper'
  return (
    <section id={id} className={`${bg} py-16 md:py-24 ${className}`}>
      <div className="mx-auto w-full max-w-container px-5 md:px-8">{children}</div>
    </section>
  )
}

/** Full-bleed photo header with a scrim, used at the top of every inner page. */
export function PageHero({ title, image, kicker }) {
  return (
    <header className="relative flex min-h-[42vh] items-center justify-center overflow-hidden md:min-h-[52vh]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-surface-dark" />
      )}
      <div className="absolute inset-0 bg-scrim" />
      <div className="relative mx-auto w-full max-w-container px-5 text-center">
        {kicker ? <p className="font-script text-h3-alt text-on-dark">{kicker}</p> : null}
        <h1 className="font-sans text-display font-heading uppercase tracking-wide text-on-dark drop-shadow">{title}</h1>
        <span className="mx-auto mt-5 block h-[3px] w-20 bg-brand" aria-hidden="true" />
      </div>
    </header>
  )
}

export function Prose({ children, className = '' }) {
  return (
    <div className={`max-w-measure space-y-5 text-body leading-body ${className}`}>{children}</div>
  )
}
