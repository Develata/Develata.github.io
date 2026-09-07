/** One game-local WASM module per page, including renderer retries and route returns. */
import { withBase } from 'vitepress'
import type { WasmPackage } from './config'
let packageRequest: Promise<WasmPackage> | undefined
let ready: Promise<WasmPackage> | undefined
let attempt = 0

export function loadWasm(): Promise<WasmPackage> {
  if (!ready) {
    ready = initialize().catch(error => {
      ready = undefined
      throw error
    })
  }
  return ready
}

async function initialize(): Promise<WasmPackage> {
  if (!packageRequest) {
    // An absolute URL avoids Vite's public-file transform. Only failed JS fetches
    // need a new URL; graphics retries must not retain another WASM module.
    const asset = new URL(withBase('/game-assets/qin-polar-run/wasm/qin_polar_run.js'), location.href)
    asset.searchParams.set('load', String(++attempt))
    packageRequest = (import(/* @vite-ignore */ asset.href) as Promise<WasmPackage>).catch(error => {
      packageRequest = undefined
      throw error
    })
  }
  const wasm = await packageRequest
  await wasm.default({ module_or_path: withBase('/game-assets/qin-polar-run/wasm/qin_polar_run_bg.wasm') })
  return wasm
}
