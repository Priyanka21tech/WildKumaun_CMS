'use client'

import Link from 'next/link'
import { useState } from 'react'
import nav from '@/lib/nav'

export default function Header({ }) {
  const [open, setOpen] = useState(false)
  const [openSub, setOpenSub] = useState(null)

  return (
    <>
      {/* phone strip */}
      <div className="bg-surface-black text-on-dark">
        <div className="mx-auto flex max-w-container flex-wrap items-center justify-end gap-x-6 gap-y-1 px-5 py-2 text-[0.8125rem] md:px-8">
          {nav.phones.map((p) => (
            <a key={p} href={`tel:${p}`} className="font-roboto transition-colors hover:text-brand-bright">
              {p}
            </a>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-container items-center justify-between gap-6 px-5 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nav.logo} alt={`${nav.name} logo`} className="h-14 w-auto" />
            <span className="sr-only">{nav.name}</span>
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
            {nav.items.map((item) => (
              <div key={item.label} className="group relative">
                <Link
                  href={item.href}
                  className="font-roboto text-[0.8125rem] font-medium tracking-wide text-ink uppercase transition-colors hover:text-brand"
                >
                  {item.label}
                </Link>
                {item.children ? (
                  <div className="invisible absolute left-0 top-full z-50 min-w-56 border border-rule bg-paper py-2 opacity-0 shadow-card transition-all group-hover:visible group-hover:opacity-100">
                    {item.children.map((c) => (
                      <Link
                        key={c.label}
                        href={c.href}
                        target={c.external ? '_blank' : undefined}
                        rel={c.external ? 'noopener noreferrer' : undefined}
                        className="block px-4 py-2 font-roboto text-[0.8125rem] tracking-wide text-body uppercase transition-colors hover:bg-surface hover:text-brand"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded border border-rule px-3 py-2 font-roboto text-sm uppercase lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            Menu
          </button>
        </div>

        {/* mobile nav */}
        {open ? (
          <nav id="mobile-nav" className="border-t border-rule bg-paper lg:hidden" aria-label="Main">
            <ul className="mx-auto max-w-container px-5 py-2">
              {nav.items.map((item) => (
                <li key={item.label} className="border-b border-rule last:border-0">
                  <div className="flex items-center justify-between">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block flex-1 py-3 font-roboto text-sm uppercase text-ink"
                    >
                      {item.label}
                    </Link>
                    {item.children ? (
                      <button
                        type="button"
                        aria-label={`Toggle ${item.label} submenu`}
                        aria-expanded={openSub === item.label}
                        onClick={() => setOpenSub((v) => (v === item.label ? null : item.label))}
                        className="px-3 py-3 text-body-muted"
                      >
                        {openSub === item.label ? '−' : '+'}
                      </button>
                    ) : null}
                  </div>
                  {item.children && openSub === item.label ? (
                    <ul className="pb-2 pl-4">
                      {item.children.map((c) => (
                        <li key={c.label}>
                          <Link
                            href={c.href}
                            target={c.external ? '_blank' : undefined}
                            rel={c.external ? 'noopener noreferrer' : undefined}
                            onClick={() => setOpen(false)}
                            className="block py-2 font-roboto text-[0.8125rem] uppercase text-body"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>
    </>
  )
}
