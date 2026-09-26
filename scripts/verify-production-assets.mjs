/**
 * Deployable-asset contract for files that are generated in CI, never committed.
 *   node scripts/verify-production-assets.mjs public   before VitePress (docs/public)
 *   node scripts/verify-production-assets.mjs dist     final output (docs/.vitepress/dist)
 * Each asset must exist and be non-empty; `.wasm` must start with the WebAssembly
 * magic 00 61 73 6d and `.js` must not be an HTML page, so a saved 404 page fails.
 */
import { closeSync, openSync, readSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const STAGES = { public: 'docs/public', dist: 'docs/.vitepress/dist' }
const ASSETS = [
  'game-assets/qin-polar-run/wasm/qin_polar_run.js',
  'game-assets/qin-polar-run/wasm/qin_polar_run_bg.wasm',
]
const WASM_MAGIC = Buffer.from([0x00, 0x61, 0x73, 0x6d])

function head(file, length) {
  const fd = openSync(file, 'r')
  try {
    const buffer = Buffer.alloc(length)
    return buffer.subarray(0, readSync(fd, buffer, 0, length, 0))
  } finally {
    closeSync(fd)
  }
}

/** Returns a problem description, or undefined when the asset is valid. */
function check(file) {
  let size
  try {
    size = statSync(file).size
  } catch {
    return 'missing'
  }
  if (size === 0) return 'empty'
  if (file.endsWith('.wasm') && !head(file, 4).equals(WASM_MAGIC)) return 'not WebAssembly (bad magic bytes)'
  if (file.endsWith('.js') && head(file, 64).toString('utf8').trimStart().startsWith('<')) return 'looks like HTML, not JavaScript'
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
