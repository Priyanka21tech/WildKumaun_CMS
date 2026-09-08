/**
 * Client components, on their own entry point.
 *
 * Payload's import map resolves admin components by path, and the file it lands
 * on must contain only things that are safe to send to a browser. Keeping them
 * behind a separate export is what stops the runner — which loads Playwright —
 * from being pulled into that graph.
 */
export { RunScanButton } from '../components/RunScanButton'
