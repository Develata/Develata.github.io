/** Game-local, reproducible build. Output cache is disposable; Rust is truth. */
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { BINDGEN_VERSION, rustDir as rust, toolEnv } from './tooling.mjs'
const here = fileURLToPath(new URL('.', import.meta.url))
const output = resolve(here, '../../../../../public/game-assets/qin-polar-run/wasm')
// Finds the pinned wasm-bindgen installed by tooling.mjs before any global one.
const env = toolEnv()
function run(command, args) {
  const result = spawnSync(command, args, { cwd: rust, stdio: 'inherit', env })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
const version = spawnSync('wasm-bindgen', ['--version'], { encoding: 'utf8', env })
if (version.stdout?.trim() !== 'wasm-bindgen ' + BINDGEN_VERSION) {
  throw new Error('Install pinned tooling (wasm-bindgen ' + BINDGEN_VERSION + '): bun run game:qin-polar-run:tools')
}
run('cargo', ['test', '--locked'])
run('cargo', ['build', '--locked', '--target', 'wasm32-unknown-unknown', '--release', '--target-dir', join(rust, 'target')])
mkdirSync(output, { recursive: true })
run('wasm-bindgen', ['--target', 'web', '--out-dir', output, '--out-name', 'qin_polar_run',
  join(rust, 'target/wasm32-unknown-unknown/release/qin_polar_run.wasm')])
console.log('Northern Run WASM: ' + output)
