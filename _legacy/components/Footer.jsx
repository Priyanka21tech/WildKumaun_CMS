import Link from 'next/link'
import { site } from '@/lib/content'

export default function Footer() {
  return (
    <footer className="bg-surface-black text-on-dark">
      <div className="mx-auto grid max-w-container gap-10 px-5 py-16 md:grid-cols-3 md:px-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.logo.replace(/^assets\//, '/assets/')}
            alt={`${site.name} logo`}
            className="h-20 w-auto brightness-0 invert"
          />
          <p className="mt-5 max-w-sm text-sm leading-body text-on-dark/70">{site.intro}</p>
        </div>

        <div>
          <h2 className="font-sans text-h6 font-heading text-brand">Contact</h2>
          <p className="mt-4 text-sm">
            Mob.{' '}
            {site.contact.footerPhones.map((p, i) => (
              <span key={p}>
                <a href={`tel:${p}`} className="transition-colors hover:text-brand-bright">{p}</a>
                {i < site.contact.footerPhones.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
          <p className="mt-2 text-sm">
            Email.{' '}
            <a href={`mailto:${site.contact.email}`} className="transition-colors hover:text-brand-bright">
              {site.contact.email}
            </a>
          </p>
          <p className="mt-2 text-sm text-on-dark/70">{site.address.full}</p>
          <div className="mt-4 flex gap-4">
            {site.social.map((s) => (
              <span key={s.network} className="text-sm text-on-dark/70">{s.label}</span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-sans text-h6 font-heading text-brand">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {site.nav.filter((n) => n.href !== '#').map((n) => (
              <li key={n.label}>
                <Link href={n.href} className="text-on-dark/80 transition-colors hover:text-brand-bright">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-container px-5 py-5 text-center text-xs text-on-dark/50 md:px-8">
          © {new Date().getFullYear()} {site.legalName}, {site.address.locality}.
        </div>
      </div>
    </footer>
  )
}
