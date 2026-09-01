// Generates lib/nav.js (client-safe) from ../content/site-settings.json.
import { readFileSync, writeFileSync } from 'node:fs'
const s = JSON.parse(readFileSync('../content/site-settings.json', 'utf8'))
const data = {
  name: s.name,
  logo: s.logo.replace(/^assets\//, '/assets/'),
  phones: s.contact.headerPhones,
  items: s.nav.map((i) => ({
    label: i.label,
    href: i.href,
    ...(i.children ? { children: i.children.map((c) => ({ label: c.label, href: c.href, ...(c.external ? { external: true } : {}) })) } : {}),
  })),
}
writeFileSync('lib/nav.js', `// GENERATED from content/site-settings.json by _tools-gen-nav.mjs — do not edit by hand.\nconst nav = ${JSON.stringify(data, null, 2)}\n\nexport default nav\n`)
console.log('lib/nav.js written')
