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
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
