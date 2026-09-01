import localFont from 'next/font/local'
import './globals.css'
import { site } from '@/lib/content'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Self-hosted from the woff2 files the live site serves (mirrored under
// _reference/wildkumaon.com/wp/fonts). Local files keep the build offline-safe.
const openSans = localFont({
  src: './fonts/OpenSans-Variable.woff2',
  weight: '300 800',
  variable: '--font-open-sans',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

const roboto = localFont({
  src: './fonts/Roboto-Variable.woff2',
  weight: '100 900',
  variable: '--font-roboto-google',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

const didot = localFont({
  src: './fonts/GFSDidot-Regular.woff2',
  weight: '400',
  variable: '--font-didot',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
})

const sevillana = localFont({
  src: './fonts/Sevillana-Regular.woff2',
  weight: '400',
  variable: '--font-sevillana',
  display: 'swap',
  fallback: ['cursive'],
})

export const metadata = {
  title: {
    default: `${site.name} ${site.address.locality}`,
    template: `%s | ${site.name} ${site.address.locality}`,
  },
  description: site.metaDescription,
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${roboto.variable} ${didot.variable} ${sevillana.variable}`}
    >
      <body className="bg-paper font-sans text-body antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded focus:bg-brand focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
