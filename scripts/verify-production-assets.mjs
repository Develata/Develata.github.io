/**
 * Deployable-asset contract for files that are generated in CI, never committed.
 *   node scripts/verify-production-assets.mjs public   before VitePress (docs/public)
 *   node scripts/verify-production-assets.mjs dist     final output (docs/.vitepress/dist)
 * Each asset must exist and be non-empty; `.wasm` must start with the WebAssembly
 * magic 00 61 73 6d and pass WebAssembly.validate (so a truncated module fails);
 * `.js` must not start with `<`, so a saved 404 HTML page fails.
 */
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const STAGES = { public: 'docs/public', dist: 'docs/.vitepress/dist' }
const ASSETS = [
  'game-assets/qin-polar-run/wasm/qin_polar_run.js',
  'game-assets/qin-polar-run/wasm/qin_polar_run_bg.wasm',
]
const WASM_MAGIC = Buffer.from([0x00, 0x61, 0x73, 0x6d])

/** Returns a problem description, or undefined when the asset is valid. */
function check(file) {
  let size
  try {
    size = statSync(file).size
  } catch {
    return 'missing'
  }
  if (size === 0) return 'empty'
  // Assets are tens of KiB, so whole-file reads are cheap.
  const bytes = readFileSync(file)
  if (file.endsWith('.wasm')) {
    if (!bytes.subarray(0, 4).equals(WASM_MAGIC)) return 'not WebAssembly (bad magic bytes)'
    if (!WebAssembly.validate(bytes)) return 'invalid WebAssembly module'
  }
  if (file.endsWith('.js') && bytes.toString('utf8').trimStart().startsWith('<')) return 'looks like HTML, not JavaScript'
  return undefined
}

const stage = process.argv[2]
if (!Object.hasOwn(STAGES, stage)) {
  console.error('Usage: node scripts/verify-production-assets.mjs <' + Object.keys(STAGES).join('|') + '>')
  process.exit(2)
}
let failed = false
for (const asset of ASSETS) {
  const file = join(root, STAGES[stage], asset)
  const problem = check(file)
  if (problem) failed = true
  console.log((problem ? 'FAIL ' : 'ok   ') + STAGES[stage] + '/' + asset + (problem ? ': ' + problem : ' (' + statSync(file).size + ' bytes)'))
}
if (failed) process.exit(1)
