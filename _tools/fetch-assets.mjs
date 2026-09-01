// Throttled asset fetcher. The site sits behind a Vercel Security Checkpoint that
// trips on bursts, so this goes strictly serial with a delay and backs off for
// minutes whenever it sees the challenge page. Resume-safe: existing files are skipped.
import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises'
import { dirname, posix, basename } from 'node:path'

const ORIGIN = 'https://www.wildkumaon.com'
const OUT = '_reference/wildkumaon.com'
const IMGDIR = 'assets/images'
const DELAY = 1500          // ms between successful requests
const COOLDOWN = 5 * 60_000 // ms to wait out a checkpoint block

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': `${ORIGIN}/`,
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const isImg = (p) => /\.(jpe?g|png|gif|webp|svg|avif|ico)$/i.test(p)
const exists = async (p) => { try { await access(p); return true } catch { return false } }

const list = JSON.parse(await readFile('_tools/asset-list.json', 'utf8'))
const state = { ok: 0, skip: 0, fail: 0, blocked: 0 }
const failed = []

console.log(`${list.length} assets queued\n`)

for (let i = 0; i < list.length; i++) {
  const rel = list[i]
  const dest = posix.join(OUT, rel)
  const tag = `[${String(i + 1).padStart(3)}/${list.length}]`

  if (await exists(dest)) {
    state.skip++
    if (isImg(rel)) await stash(dest, rel)
    continue
  }

  let saved = false
  for (let attempt = 1; attempt <= 8 && !saved; attempt++) {
    try {
      const res = await fetch(ORIGIN + '/' + rel, { headers: HEADERS, redirect: 'follow' })
      const ct = res.headers.get('content-type') || ''
      // The checkpoint answers 403 with a full HTML page. A bare 403 with a short
      // text/plain body is just a dead path, not a block — don't wait on those.
      if (ct.includes('text/html') && !/\.svg$/i.test(rel)) {
        state.blocked++
        console.log(`${tag} BLOCKED (checkpoint) — waiting for it to lift — ${rel}`)
        await waitForClear()
        attempt--            // a block is not a failure; don't spend the retry budget
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length === 0) throw new Error('empty body')
      await mkdir(dirname(dest), { recursive: true })
      await writeFile(dest, buf)
      if (isImg(rel)) await stash(dest, rel)
      state.ok++
      saved = true
      console.log(`${tag} ok  ${(buf.length / 1024).toFixed(0).padStart(5)}kb  ${rel}`)
    } catch (e) {
      if (attempt === 8) { state.fail++; failed.push(`${rel} — ${e.message}`); console.log(`${tag} FAIL ${rel} — ${e.message}`) }
      else await sleep(1500 * attempt)
    }
  }
  await sleep(DELAY)
}

/** Poll a known-good URL until the checkpoint lifts (or we give up after ~2h). */
async function waitForClear() {
  for (let i = 0; i < 24; i++) {
    await sleep(COOLDOWN)
    try {
      const r = await fetch(`${ORIGIN}/media/Sattal-Lake.jpg`, { headers: HEADERS, redirect: 'follow' })
      if (r.ok && !(r.headers.get('content-type') || '').includes('text/html')) {
        console.log(`      checkpoint lifted after ${((i + 1) * COOLDOWN) / 60000}min, resuming`)
        return
      }
    } catch {}
    console.log(`      still blocked (${((i + 1) * COOLDOWN) / 60000}min)`)
  }
}

/** Copy an image into assets/images/ keeping its original filename. */
async function stash(src, rel) {
  await mkdir(IMGDIR, { recursive: true })
  const name = decodeURIComponent(basename(rel))
  const target = posix.join(IMGDIR, name)
  if (!(await exists(target))) await copyFile(src, target)
}

await writeFile('_tools/asset-report.json', JSON.stringify({ ...state, failed }, null, 2) + '\n')
console.log(`\nok=${state.ok} skipped=${state.skip} failed=${state.fail} checkpoint-hits=${state.blocked}`)
