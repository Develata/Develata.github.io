<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { FIELD as F, EVENT, ABI_VERSION, FRAME_LENGTH, type Phase, type WasmRunner } from './config'
import { GameAudio } from './audio/GameAudio'
import { InputController } from './input/InputController'
import { loadWasm } from './loadWasm'
import type { RunnerScene } from './render/RunnerScene'
import './game.css'
import './phase2.css'
const surface = ref<HTMLElement>()
const canvas = ref<HTMLElement>()
const overlay = ref<HTMLElement>()
const phase = ref<Phase>('loading')
const score = ref(0)
const charge = ref(0)
const boosting = ref(false)
const muted = ref(false)
const boostHint = ref(false)
const music = new GameAudio()
const feedback = ref('')
const errorText = ref('')
const formattedScore = computed(() => Math.round(score.value).toLocaleString('en-US').padStart(6, '0'))
let core: WasmRunner | undefined
let scene: RunnerScene | undefined
let input: InputController | undefined
let raf = 0, previous = 0, generation = 0, feedbackUntil = 0
let alive = true, boostHintShown = false, boostHintUntil = 0
const frame = new Float32Array(FRAME_LENGTH)
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0]
function stopLoop() { cancelAnimationFrame(raf); raf = 0; previous = 0 }
function disposeRuntime() {
  stopLoop(); music.dispose(); input?.dispose(); input = undefined
  scene?.dispose(); scene = undefined; core?.free(); core = undefined
}
async function focusOverlay() {
  await nextTick(); if (alive) overlay.value?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
}
function fail(message: string) {
  generation++; disposeRuntime(); errorText.value = message; phase.value = 'error'; void focusOverlay()
}
async function boot() {
  const token = ++generation
  disposeRuntime(); phase.value = 'loading'; errorText.value = ''
  try {
    // Neither the module initializer nor Three.js construction runs during SSR.
    const [wasm, view] = await Promise.all([loadWasm(), import('./render/RunnerScene')])
    if (!alive || token !== generation) return
    core = new wasm.Runner(seed())
    core.advance(0, 0, frame)
    if (frame[0] !== ABI_VERSION) throw new Error('Unsupported runner ABI')
    scene = new view.RunnerScene(canvas.value!, () => fail('画面连接已中断。请重新加载游戏。'))
    input = new InputController(surface.value!, () => phase.value === 'running', togglePause)
    phase.value = 'ready'; scene.draw(frame, 0)
  } catch (error) {
    if (alive && token === generation) {
      console.error('[Northern Run]', error)
      fail('游戏暂时未能加载。请检查网络或浏览器的图形支持后重试。')
    }
  }
}
function tick(now: number) {
  raf = 0
  if (!core || !scene || phase.value !== 'running' || document.hidden) return
  const dt = previous ? Math.min((now - previous) / 1000, 0.1) : 0
  previous = now
  core.advance(dt, input?.read() ?? 0, frame)
  score.value = frame[F.score]
  charge.value = frame[F.charge]; boosting.value = frame[F.boost] > 0
  if (charge.value === 10 && !boostHintShown) {
    boostHintShown = true; boostHintUntil = frame[F.time] + 3; boostHint.value = true
  }
  if (frame[F.time] > boostHintUntil || boosting.value) boostHint.value = false
  if (frame[F.events] & EVENT.hit) { feedback.value = '稳住，继续前进'; feedbackUntil = frame[F.time] + 1.8 }
  else if (frame[F.events] & EVENT.coin && frame[F.time] > feedbackUntil) { feedback.value = '+50'; feedbackUntil = frame[F.time] + 0.6 }
  if (frame[F.time] > feedbackUntil) feedback.value = ''
  scene.draw(frame, dt)
  if (frame[F.phase] === 3) {
    music.stop(); phase.value = 'over'; feedback.value = ''; boostHint.value = false; input?.clear(); previous = 0; void focusOverlay()
  } else raf = requestAnimationFrame(tick)
}
function start() {
  if (!core || !scene) return
  stopLoop(); core.reset(seed()); input?.clear(); core.advance(0, 0, frame)
  score.value = 0; charge.value = 0; boosting.value = false; boostHint.value = false
  boostHintShown = false; boostHintUntil = 0; feedbackUntil = 0; feedback.value = ''; phase.value = 'running'
  music.start()
  surface.value?.focus({ preventScroll: true }); scene.draw(frame, 0)
  raf = requestAnimationFrame(tick)
}
function pause() {
  if (phase.value !== 'running' || !core) return
  stopLoop(); music.pause(); core.pause(true); input?.clear(); phase.value = 'paused'; feedback.value = ''; void focusOverlay()
}
function togglePause() {
  if (phase.value === 'running') pause()
  else if (phase.value === 'paused' && core && !document.hidden) {
    core.pause(false); input?.clear(); phase.value = 'running'; previous = 0; music.resume()
    surface.value?.focus({ preventScroll: true }); raf = requestAnimationFrame(tick)
  }
}
function toggleMute() {
  muted.value = !muted.value; music.setMuted(muted.value); input?.clear()
  surface.value?.focus({ preventScroll: true })
}
function visibility() { if (document.hidden) pause() }
function focusOut(event: FocusEvent) { if (!surface.value?.contains(event.relatedTarget as Node)) pause() }
onMounted(() => {
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('blur', pause)
  void boot()
})
onBeforeUnmount(() => {
  alive = false; generation++; disposeRuntime()
  document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', pause)
})
// Read-only diagnostics for browser QA. It creates no loop, listener or gameplay bypass.
defineExpose({ diagnostics: () => ({ phase: phase.value, raf: !!raf,
  frame: Array.from(frame), renderer: scene?.diagnostics() }) })
</script>

<template>
  <section ref="surface" class="northern-run" :class="{ 'is-running': phase === 'running', 'is-boosting': boosting && phase === 'running' }"
    tabindex="0" aria-label="北境狂奔：三道跑酷" @focusout="focusOut">
    <div ref="canvas" class="nr-canvas"></div>
    <div class="nr-vignette" aria-hidden="true"></div>
    <div v-if="phase === 'running' || phase === 'paused'" class="nr-score">
      <span>SCORE</span><strong>{{ formattedScore }}</strong>
      <div class="nr-boost-meter" :class="{ ready: charge === 10, active: boosting }" role="progressbar"
        aria-label="冲刺蓄力" :aria-valuenow="charge" :aria-valuemin="0" :aria-valuemax="10">
        <i :style="{ transform: `scaleX(${boosting ? 1 : charge / 10})` }"></i>
      </div>
    </div>
    <button v-if="phase === 'running'" class="nr-pause" aria-label="暂停" @click="pause">Ⅱ</button>
    <button v-if="phase === 'running'" class="nr-mute" :aria-label="muted ? '开启音乐' : '静音音乐'"
      :aria-pressed="muted" @click="toggleMute">{{ muted ? '🔇' : '🔊' }}</button>
    <p v-if="boostHint && phase === 'running'" class="nr-boost-hint" role="status">
      <span class="nr-touch">双击冲刺</span><span class="nr-keyboard">Shift / E 冲刺</span>
    </p>
    <p v-if="feedback && !boostHint && phase === 'running'" class="nr-feedback" role="status">{{ feedback }}</p>
    <p v-if="phase === 'running' && frame[F.time] < 5" class="nr-onboarding">
      <span class="nr-keyboard">← → 换道 · ↑ / Space 跳跃 · ↓ 俯身</span>
      <span class="nr-touch">左右滑动换道 · 上滑跳跃 · 下滑俯身</span>
    </p>
    <div v-if="phase === 'ready'" class="nr-intro">
      <a :href="withBase('/games/')" class="nr-back">← GAME LAB</a>
      <div class="nr-title"><p class="nr-eyebrow">NORTHERN RUN</p><h1>北境狂奔</h1>
        <p class="nr-premise">秦始皇骑北极熊</p></div>
      <div class="nr-start"><button class="nr-primary" @click="start">开始奔跑 <span>↗</span></button>
        <p class="nr-controls"><span class="nr-keyboard">← → / A D 换道 · ↑ / Space 跳跃 · ↓ 俯身 · Shift / E 冲刺</span>
          <span class="nr-touch">左右滑动换道 · 上滑跳跃 · 下滑俯身 · 满蓄力双击冲刺</span></p></div>
      <span class="nr-seal" aria-hidden="true">北<br>境</span>
    </div>
    <div v-else-if="phase !== 'running'" ref="overlay" class="nr-overlay" :class="{ 'nr-loading': phase === 'loading' }">
      <template v-if="phase === 'loading'"><span class="nr-eyebrow">NORTHERN RUN</span><p role="status">正在准备冰封秦境…</p></template>
      <template v-else-if="phase === 'error'"><h2>暂时无法启程</h2><p role="alert">{{ errorText }}</p>
        <button class="nr-primary" @click="boot">重新加载</button><a :href="withBase('/games/')">返回 Game Lab</a></template>
      <template v-else-if="phase === 'paused'"><p class="nr-eyebrow">NORTHERN RUN</p><h2>已暂停</h2>
        <button class="nr-primary" @click="togglePause">继续奔跑</button><button class="nr-secondary" @click="start">重新开始</button>
        <a :href="withBase('/games/')">返回 Game Lab</a></template>
      <template v-else-if="phase === 'over'"><p class="nr-eyebrow">本局结束</p><h2>风雪未止</h2>
        <div class="nr-final-score"><span>SCORE</span><strong>{{ formattedScore }}</strong></div>
        <button class="nr-primary" @click="start">再来一次 <span>↗</span></button><a :href="withBase('/games/')">返回 Game Lab</a></template>
    </div>
  </section>
</template>
