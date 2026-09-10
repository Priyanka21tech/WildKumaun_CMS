import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // The mirrored WordPress markup references /media/* directly with plain <img>
  // tags, so those never go through the optimizer. Payload uploads served from
  // /api/media/file/** still do.
  images: {
    unoptimized: true,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  async redirects() {
    return [
      // The blog posts link to their WordPress category and author archives.
      // Those pages are not part of the site's nav and the origin does not
      // serve them, so send them to the blog listing rather than 404.
      { source: '/category/:slug*', destination: '/blog', permanent: false },
      { source: '/author/:slug*', destination: '/blog', permanent: false },

      /**
       * Pages nothing on the site links to, sent somewhere that answers the same
       * question — WCAG 2.4.4, and plain navigability.
       *
       * These were made in WordPress and left out of the menu. A reader can only
       * arrive from a search result, and what they find is a page with no way
       * onward that the rest of the site does not know exists.
       *
       * Redirected rather than deleted. They are in the origin's sitemap and may
       * be indexed, and a 404 turns a stale search result into a dead end where a
       * redirect turns it into the right page. Each target answers what the old
       * page was for: the vision statement and the birding pitch belong with the
       * story of the place, the enquiry form and the address with contact.
       *
       * /facilities and /birds-found-at-wild-kumaon are deliberately absent —
       * they carry real content (11 and 6 photographs) and are being linked into
       * the Services menu instead of retired.
       */
      { source: '/vision', destination: '/about-us', permanent: true },
      { source: '/birders-paradise', destination: '/bird-watching-in-sattal', permanent: true },
      { source: '/enquiry', destination: '/contact-us', permanent: true },
      { source: '/location', destination: '/contact-us', permanent: true },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    // Named explicitly so Next does not infer a root from the two lockfiles.
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
