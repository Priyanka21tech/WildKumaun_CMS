import type { Config, Plugin } from 'payload'

import { A11yReports } from './collections/A11yReports'
import { runScanEndpoint } from './endpoints/runScan'
import type { A11yPluginOptions } from './types'

export type { A11yPluginOptions, Check, CheckResult } from './types'
export { CHECKS } from './checks'
export { runScan } from './runner'

/**
 * Accessibility scanning, reported inside the admin panel.
 *
 * The site's Definition of Done is seventeen checkpoints. axe covers four of
 * them; the rest are this package's own checks, driven through a real browser,
 * and two need a person and are recorded as such rather than assumed.
 *
 * That split is the reason this exists at all. An axe-only report says "0
 * violations" on a site whose menu cannot be opened with a keyboard and whose
 * photographs are described to nobody — both true of this site a week ago, and
 * both invisible to every automated scan that ran clean.
 *
 * Follows the plugin shape from Payload's own guide: options in, config out,
 * arrays spread rather than replaced.
 */
export const a11yPlugin =
  (pluginOptions: A11yPluginOptions): Plugin =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    /**
     * Disabled means absent, not present-and-idle.
     *
     * Returning the config untouched leaves no collection and no endpoint, so a
     * build that has the plugin switched off is the same build as one without
     * it — which is what makes the switch safe to use on a machine that cannot
     * run a browser.
     */
    if (pluginOptions.enabled === false) return config

    const group = pluginOptions.group ?? 'Accessibility'

    config.collections = [...(config.collections ?? []), A11yReports(group)]
    config.endpoints = [...(config.endpoints ?? []), runScanEndpoint(pluginOptions)]

    return config
  }

export default a11yPlugin
