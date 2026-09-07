/** Game-local, reproducible build. Output cache is disposable; Rust is truth. */
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
const here = fileURLToPath(new URL('.', import.meta.url))
const rust = join(here, 'rust')
const output = resolve(here, '../../../../../public/game-assets/qin-polar-run/wasm')
const bindgenVersion = '0.2.126'
function run(command, args) {
  const result = spawnSync(command, args, { cwd: rust, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
const version = spawnSync('wasm-bindgen', ['--version'], { encoding: 'utf8' })
if (version.stdout?.trim() !== 'wasm-bindgen ' + bindgenVersion) {
  throw new Error('Install pinned tooling: cargo install wasm-bindgen-cli --version ' + bindgenVersion + ' --locked')
}
run('cargo', ['test', '--locked'])
run('cargo', ['build', '--locked', '--target', 'wasm32-unknown-unknown', '--release', '--target-dir', join(rust, 'target')])
mkdirSync(output, { recursive: true })
run('wasm-bindgen', ['--target', 'web', '--out-dir', output, '--out-name', 'qin_polar_run',
  join(rust, 'target/wasm32-unknown-unknown/release/qin_polar_run.wasm')])
console.log('Northern Run WASM: ' + output)
