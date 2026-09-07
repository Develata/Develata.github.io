/** Regression tests execute the real loader with controlled module/network failures. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'
const source = stripTypeScriptTypes(readFileSync(new URL('./loadWasm.ts', import.meta.url), 'utf8'))
async function harness({ failImport = false, failInit = false } = {}) {
  const urls = [], counts = { init: 0 }
  const context = createContext({ URL, location: { href: 'https://example.test/games/qin-polar-run' } })
  const packageModule = new SyntheticModule(['default', 'Runner'], function () {
    this.setExport('Runner', class Runner {})
    this.setExport('default', async () => {
      counts.init++
      if (failInit && counts.init === 1) throw new Error('WASM unavailable')
    })
  }, { context })
  await packageModule.link(() => {}); await packageModule.evaluate()
  const loader = new SourceTextModule(source, {
    context,
    importModuleDynamically: async url => {
      urls.push(url)
      if (failImport && urls.length === 1) throw new Error('JS unavailable')
      return packageModule
    },
  })
  const host = new SyntheticModule(['withBase'], function () { this.setExport('withBase', path => path) }, { context })
  await loader.link(specifier => { assert.equal(specifier, 'vitepress'); return host })
  await loader.evaluate()
  return { load: loader.namespace.loadWasm, urls, counts }
}
test('graphics retries and route returns reuse one initialized module', async () => {
  const h = await harness(), first = await h.load()
  for (let i = 0; i < 5; i++) assert.equal(await h.load(), first)
  assert.equal(h.urls.length, 1); assert.equal(h.counts.init, 1)
})
test('concurrent mounts share the same initialization', async () => {
  const h = await harness(), a = h.load(), b = h.load()
  assert.equal(a, b)
  await Promise.all([a, b])
  assert.equal(h.urls.length, 1); assert.equal(h.counts.init, 1)
})
test('failed JS fetch gets a fresh URL and can recover', async () => {
  const h = await harness({ failImport: true })
  await assert.rejects(h.load(), /JS unavailable/)
  await h.load(); await h.load()
  assert.equal(h.urls.length, 2); assert.notEqual(h.urls[0], h.urls[1])
  assert.equal(h.counts.init, 1)
})
test('failed WASM initialization retries without importing another JS module', async () => {
  const h = await harness({ failInit: true })
  await assert.rejects(h.load(), /WASM unavailable/)
  await h.load(); await h.load()
  assert.equal(h.urls.length, 1); assert.equal(h.counts.init, 2)
})
