/**
 * The origin is server-rendered Astra/Elementor markup styled entirely by
 * wp/site.css plus <style> blocks inside <body>; the thin Next shell in front of
 * it contributes one small Tailwind sheet. Both are served from /wp and linked
 * here in the same order the origin links them, so the cascade resolves
 * identically.
 *
 * This is the root layout for the public site only. Payload's admin panel has
 * its own root layout under (payload), so nothing here reaches /admin.
 */
export const metadata = {
  title: 'Wild Kumaon Sattal',
}

// The class the origin ships on <body> before its own script swaps in the
// per-page one. Rendering it here keeps first paint identical.
const SHELL_BODY_CLASS =
  'ast-desktop ast-hfb-header ast-inherit-site-logo-transparent astra-3.4.0 ehf-footer ehf-header ehf-stylesheet-astra ehf-template-astra elementor-default elementor-kit-6 wp-custom-logo wp-theme-astra'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" dir="ltr">
      <head>
        <link rel="stylesheet" href="/wp/shell.css" />
        <link rel="preload" href="/wp/site.css" as="style" />
        <link rel="stylesheet" href="/wp/site.css" />
        {/* Ours, and last on purpose — it overrides the origin's focus rules. */}
        <link rel="stylesheet" href="/a11y.css" />
        <link rel="icon" href="/favicon.ico" sizes="256x256" type="image/x-icon" />
        <link rel="icon" href="/media/favicon-1.png" />
        <link rel="apple-touch-icon" href="/media/favicon-1.png" />
      </head>
      <body className={SHELL_BODY_CLASS}>{children}</body>
    </html>
  )
}
