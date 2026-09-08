import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  /**
   * The accessibility plugin is a workspace folder, not a published package, so
   * it ships TypeScript rather than a built dist. Listing it here lets Next
   * compile it the same way it compiles src/, which is what makes editing the
   * plugin and seeing the change immediately possible.
   */
  transpilePackages: ['@webuters/payload-plugin-a11y'],

  /**
   * Left as real packages on disk rather than bundled into the server.
   *
   * @axe-core/playwright works by reading axe-core's source and injecting it into
   * the page under test. Bundled, that source arrives wrapped in the bundler's
   * CommonJS shim, so the moment it runs in the browser it throws
   * `ReferenceError: module is not defined` — which is exactly what every route
   * reported until this was added. Playwright is here for the same reason: it
   * spawns browser binaries by path and cannot survive being packed.
   *
   * The plugin itself stays in transpilePackages above; only what it reaches for
   * at scan time is external.
   */
  serverExternalPackages: [
    '@playwright/test',
    'playwright',
    'playwright-core',
    '@axe-core/playwright',
    'axe-core',
  ],
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
    /**
     * The repo root, not the app directory.
     *
     * Turbopack will not resolve a module whose real path lies outside this
     * root, and packages/payload-plugin-a11y is a sibling of the app rather than
     * a child of it. Node resolved the symlink fine; Turbopack refused it, so
     * every page 500'd on an import that plainly existed on disk.
     *
     * It was set to the app directory to stop Next inferring a root from the two
     * lockfiles in the tree. Naming the repo root answers that question just as
     * definitely, and answers it correctly for a workspace with packages beside
     * the app.
     */
    root: path.resolve(dirname, '..'),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
