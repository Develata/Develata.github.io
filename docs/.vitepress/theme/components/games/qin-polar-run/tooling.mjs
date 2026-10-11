/**
 * Northern Run build tooling: resolve, and on request install, the pinned tools
 * that build-wasm.mjs needs. Each version has exactly one authority:
 *   Rust channel/target  -> rust/rust-toolchain.toml (read by rustup)
 *   wasm-bindgen CLI     -> rust/Cargo.lock (the CLI must equal the linked crate)
 *   cargo-binstall       -> BINSTALL_VERSION below
 * Tools live outside the repository (CARGO_HOME, NORTHERN_RUN_TOOLS); none of
 * them is a build output, so this file is not part of the WASM cache key.
 *
 * Usage: node tooling.mjs [rust] [binstall] [bindgen]   (no argument = all, in order)
 * Automatic bootstrap of a missing rustup / cargo-binstall is Unix-only (CI);
 * on Windows install them once by hand.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const rustDir = fileURLToPath(new URL('./rust/', import.meta.url))
export const BINSTALL_VERSION = '1.23.0'
export const BINDGEN_VERSION = lockedVersion('wasm-bindgen')

const cargoBin = join(process.env.CARGO_HOME || join(homedir(), '.cargo'), 'bin')
// Versioned and outside CARGO_HOME: never replaces a developer's global wasm-bindgen.
const bindgenBin = join(process.env.NORTHERN_RUN_TOOLS || join(homedir(), '.cache', 'northern-run-tools'),
  'wasm-bindgen-' + BINDGEN_VERSION, 'bin')
const unix = process.platform !== 'win32'

function lockedVersion(name) {
  const lock = readFileSync(join(rustDir, 'Cargo.lock'), 'utf8')
  // Exact `name = "…"` line, so wasm-bindgen-macro/-shared cannot match.
  const match = lock.match(new RegExp('\\[\\[package\\]\\]\\r?\\nname = "' + name + '"\\r?\\nversion = "([^"]+)"'))
  if (!match) throw new Error(name + ' is missing from ' + join(rustDir, 'Cargo.lock'))
  return match[1]
}

/** Environment whose PATH puts the pinned wasm-bindgen, then CARGO_HOME/bin, first. */
export function toolEnv(env = process.env) {
  const key = Object.keys(env).find(name => name.toUpperCase() === 'PATH') ?? 'PATH'
  return { ...env, [key]: [bindgenBin, cargoBin, env[key]].filter(Boolean).join(delimiter) }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', env: toolEnv(), ...options })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(command + ' ' + args.join(' ') + ' failed (' + (result.signal ?? 'exit ' + result.status) + ')')
}

/** Trimmed stdout, or undefined when the command is missing or fails. */
function probe(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', env: toolEnv(), ...options })
  return result.status === 0 ? result.stdout.trim() : undefined
}

function shell(script, env) {
  if (!unix) throw new Error('Automatic bootstrap is Unix-only; install the tool manually on Windows.')
  run('sh', ['-c', script], { env: toolEnv({ ...process.env, ...env }) })
}

const steps = {
  rust() {
    if (!probe('rustup', ['--version'])) {
      // Official installer; the channel itself comes from rust-toolchain.toml below.
      shell("curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain none --no-modify-path")
    }
    const [major, minor] = (probe('rustup', ['--version'])?.match(/^rustup (\d+)\.(\d+)/) ?? []).slice(1).map(Number)
    if (major === undefined) throw new Error('rustup is unavailable (expected ' + join(cargoBin, 'rustup') + ')')
    // Both forms install the toolchain named by rust-toolchain.toml: rustup >= 1.28
    // needs the explicit argument-less install; older rustup does it in `show`.
    run('rustup', major > 1 || minor >= 28 ? ['toolchain', 'install'] : ['show'], { cwd: rustDir })
    run('rustc', ['--version'], { cwd: rustDir })
    // Host `cargo test` and proc-macro build scripts need a system linker.
    if (unix && !probe('cc', ['--version'])) throw new Error('No C linker (cc) on PATH; host cargo test cannot link.')
  },
  binstall() {
    // `cargo-binstall -V` prints the bare version.
    const version = () => probe('cargo-binstall', ['-V'])
    if (version() !== BINSTALL_VERSION) {
      // Official prebuilt installer, script and release both pinned to the tag. Its
      // fallback (`cargo-binstall --force cargo-binstall`) is kept prebuilt-only too.
      shell('curl --proto \'=https\' --tlsv1.2 -sSfL https://raw.githubusercontent.com/cargo-bins/cargo-binstall/v' +
        BINSTALL_VERSION + '/install-from-binstall-release.sh | sh', { BINSTALL_VERSION, BINSTALL_STRATEGIES: 'crate-meta-data' })
    }
    // The installer's fallback path installs the latest release; refuse any drift.
    const found = version()
    if (found !== BINSTALL_VERSION) throw new Error('Expected cargo-binstall ' + BINSTALL_VERSION + ', found ' + (found ?? 'none'))
    console.log('cargo-binstall ' + found)
  },
  bindgen() {
    const expected = 'wasm-bindgen ' + BINDGEN_VERSION
    if (probe('wasm-bindgen', ['--version']) !== expected) {
      // crate-meta-data only: the crate's upstream release binaries. No third-party
      // quick-install mirror, no compile fallback: a missing binary is a hard failure.
      run('cargo-binstall', ['wasm-bindgen-cli@' + BINDGEN_VERSION, '--no-confirm', '--strategies', 'crate-meta-data',
        '--install-path', bindgenBin, '--disable-telemetry', '--no-discover-github-token'])
    }
    const found = probe('wasm-bindgen', ['--version'])
    if (found !== expected) throw new Error('Expected ' + expected + ', found ' + (found ?? 'none'))
    console.log(found + ' <- ' + bindgenBin)
  },
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const names = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(steps)
  for (const name of names) {
    if (!Object.hasOwn(steps, name)) throw new Error('Unknown step ' + name + '; expected ' + Object.keys(steps).join('|'))
    steps[name]()
  }
}
