/**
 * What a host site tells the plugin about itself.
 *
 * Everything site-specific lives here, and nothing else in the package knows the
 * name of any particular site. That is the line that decides whether this is
 * reusable: a check may know what a heading is, never which pages have one.
 */
export interface A11yPluginOptions {
  /**
   * Turn the plugin off without uninstalling it.
   *
   * The official Payload guidance asks every plugin for this, and it is worth
   * having: a scan opens a real browser, so a machine that cannot run one needs
   * a way to skip it without editing the config.
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Where the site being scanned is served from.
   *
   * The plugin drives a browser against a running site rather than reading files,
   * because half of what the checklist asks about — focus, keyboard, zoom — only
   * exists once the page is live in a browser.
   *
   * @default process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
   */
  baseUrl?: string

  /**
   * The paths to scan.
   *
   * A function as well as an array, because on a CMS-driven site the list of
   * pages is itself in the database, and hard-coding it means a page added
   * tomorrow is never scanned.
   */
  routes: string[] | (() => Promise<string[]>)

  /**
   * Checkpoints to leave out of the run.
   *
   * Named by id, e.g. `['audio-description']`. Skipped is not the same as passed:
   * a skipped checkpoint is reported as skipped, so nothing quietly disappears
   * from the total.
   */
  skip?: string[]

  /**
   * Where the report collection appears in the admin sidebar.
   *
   * @default 'Accessibility'
   */
  group?: string
}

/** One checkpoint's verdict on one page. */
export interface CheckResult {
  /** Stable id, e.g. `real-buttons`. */
  id: string
  status: 'pass' | 'fail' | 'manual' | 'skipped' | 'error'
  /** One line a person can act on: what was found, and where. */
  detail?: string
  /** How many offending elements, when the check counts things. */
  count?: number
  /** A selector or snippet for the first offender, to start looking from. */
  sample?: string
}

/**
 * A checkpoint.
 *
 * `run` gets a Playwright page already on the route. Anything it cannot decide
 * on its own returns `manual` rather than guessing — a check that reports `pass`
 * when it means "I could not tell" is worse than no check, because it turns an
 * open question into a green tick.
 */
export interface Check {
  id: string
  title: string
  /** The WCAG success criteria this checkpoint stands for, e.g. `['1.3.1']`. */
  wcag: string[]
  run: (page: A11yPage) => Promise<Omit<CheckResult, 'id'>>
}

/**
 * The slice of Playwright's Page the checks are allowed to use.
 *
 * Typed structurally rather than importing Playwright's own type, so a host that
 * has not installed Playwright can still typecheck against this package.
 */
export interface A11yPage {
  url(): string
  evaluate<R>(fn: () => R | Promise<R>): Promise<R>
  evaluate<R, A>(fn: (arg: A) => R | Promise<R>, arg: A): Promise<R>
  /** Real key presses, which is the only way to test what a keyboard can reach. */
  keyboard: { press(key: string): Promise<void> }
  setViewportSize(size: { width: number; height: number }): Promise<void>
  viewportSize(): { width: number; height: number } | null
}
