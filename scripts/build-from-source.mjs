/**
 * Clean-source production build: a fresh checkout plus installed dependencies in,
 * the complete deployable site out. Used by Cloudflare Pages; GitHub Actions uses
 * the same package scripts but keeps its own WASM cache and conditional steps.
 *
 * DAG (the three branches run concurrently as child processes):
 *   brain tests | game node tests | rust -> cargo-binstall -> wasm-bindgen -> rust wasm build
 *   -> verify public -> vitepress -> verify dist
 * Invariants: VitePress starts only after every branch exited 0 and the public
 * assets verified; dist verification only after VitePress exited 0. On a branch
 * failure the siblings run to completion (complete logs), then the build exits 1.
 * A whole-build deadline (BUILD_SOURCE_TIMEOUT_MIN, default 18 < Cloudflare's 20)
 * and SIGINT/SIGTERM kill every live child tree, print timings and exit non-zero.
 * Run through the package manager (`bun run build:source`) so npm_execpath is set.
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

const root = fileURLToPath(new URL('..', import.meta.url))
const tooling = 'docs/.vitepress/theme/components/games/qin-polar-run/tooling.mjs'
const timeoutMin = Number(process.env.BUILD_SOURCE_TIMEOUT_MIN || 18)
const windows = process.platform === 'win32'
const timings = []
const live = new Set()

/** Children run in their own process group (Unix) so the whole tree can be killed. */
function killAll() {
  for (const child of live) {
    if (windows) spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
    else try { process.kill(-child.pid, 'SIGKILL') } catch { /* already gone */ }
  }
}

function abort(reason, code) {
  killAll()
  report(performance.now() - start)
  console.error('[build] FAILED: ' + reason)
  process.exit(code)
}

/** Command for `<package manager> run <name>`; npm's execpath is a JS file. */
function script(name) {
  const pm = process.env.npm_execpath
  if (!pm) throw new Error('npm_execpath is unset; run this via `bun run build:source`')
  return /\.[cm]?js$/.test(pm) ? [process.execPath, [pm, 'run', name]] : [pm, ['run', name]]
}

function step(label, [command, args]) {
  const timing = { label, ms: undefined }
  timings.push(timing)
  const start = performance.now()
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', detached: !windows })
    live.add(child)
    child.on('error', reject)
    child.on('close', (code, signal) => {
      live.delete(child)
      timing.ms = performance.now() - start
      if (code === 0) resolve()
      else reject(new Error(label + ' failed (' + (signal ?? 'exit ' + code) + ')'))
    })
  })
}

async function wasm() {
  await step('rust toolchain', [process.execPath, [tooling, 'rust']])
  await step('cargo-binstall setup', [process.execPath, [tooling, 'binstall']])
  await step('wasm-bindgen install', [process.execPath, [tooling, 'bindgen']])
  await step('rust wasm build', script('game:qin-polar-run:wasm'))
}

function report(total) {
  const width = Math.max(...timings.map(t => t.label.length), 'total'.length) + 2
  for (const { label, ms } of timings) {
    console.log('[build] ' + label.padEnd(width) + (ms === undefined ? 'not finished' : (ms / 1000).toFixed(1) + 's'))
  }
  console.log('[build] ' + 'total'.padEnd(width) + (total / 1000).toFixed(1) + 's')
}

const start = performance.now()
// Detached children no longer receive the terminal's Ctrl-C; forward it explicitly.
process.on('SIGINT', () => abort('interrupted (SIGINT)', 130))
process.on('SIGTERM', () => abort('terminated (SIGTERM)', 143))
setTimeout(() => abort('deadline of ' + timeoutMin + ' min exceeded', 1), timeoutMin * 60_000).unref()
try {
  console.log('[build] node ' + process.version)
  const branches = await Promise.allSettled([
    step('brain tests', script('brain-training:test')),
    step('game node tests', script('game:qin-polar-run:test')),
    wasm(),
  ])
  const failures = branches.filter(result => result.status === 'rejected').map(result => result.reason)
  if (failures.length) throw new AggregateError(failures, failures.map(error => error.message).join('; '))
  await step('verify public', script('verify:assets:public'))
  await step('vitepress', script('build'))
  await step('verify dist', script('verify:assets:dist'))
  report(performance.now() - start)
} catch (error) {
  report(performance.now() - start)
  console.error('[build] FAILED: ' + (error instanceof Error ? error.message : String(error)))
  process.exit(1)
}
