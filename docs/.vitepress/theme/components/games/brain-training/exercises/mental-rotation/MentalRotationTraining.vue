<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { saveResult } from '../../persistence';
import { createSeed } from '../../rng';
import { median } from '../../statistics';
import TrainingShell from '../../shared/TrainingShell.vue';
import { createPresentationScheduler } from '../../shared/presentation';
import { createRotationTrials, describeCells, type Cell, type RotationTrial } from './core';

type Phase = 'ready' | 'presenting' | 'stimulus' | 'feedback' | 'done' | 'aborted';
type TrackedInput = 'none' | 'keyboard' | 'pointer' | 'mixed';
type AngleBin = 0 | 45 | 90 | 135 | 180;
interface Response { same: boolean; angleDeg: AngleBin; correct: boolean; responseMs: number | null }
interface Summary {
  accuracy: number;
  sameAccuracy: number;
  mirrorAccuracy: number;
  medianMs: number | null;
  angle0Ms: number | null;
  angle45Ms: number | null;
  angle90Ms: number | null;
  angle135Ms: number | null;
  angle180Ms: number | null;
}

const stageRef = ref<HTMLElement | null>(null);
const assistNextRef = ref<HTMLButtonElement | null>(null);
const trialCount = ref(16);
const accessibleMode = ref(false);
const phase = ref<Phase>('ready');
const index = ref(0);
const feedback = ref('');
const liveMessage = ref('设置试次数后开始。');
const inputMode = ref<TrackedInput>('none');
const summary = ref<Summary | null>(null);
const seed = ref(1);
const trials = ref<RotationTrial[]>([]);
const responses: Response[] = [];
const timers = new Set<number>();
const presentation = createPresentationScheduler();
let shownAt = 0;
let roundStartedAt = 0;

const current = computed(() => trials.value[index.value] ?? null);
const active = computed(() => ['presenting', 'stimulus', 'feedback'].includes(phase.value));

function schedule(callback: () => void, delay: number) {
  const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay);
  timers.add(id);
}
function clearRuntime() {
  for (const id of timers) window.clearTimeout(id);
  timers.clear();
  presentation.cancel();
}
function trackInput(next: 'keyboard' | 'pointer') {
  if (inputMode.value === 'none') inputMode.value = next;
  else if (inputMode.value !== next) inputMode.value = 'mixed';
}
function shapeTransform(cells: readonly Cell[]): string {
  const width = Math.max(...cells.map((cell) => cell.x)) + 1;
  const height = Math.max(...cells.map((cell) => cell.y)) + 1;
  return `translate(${(5 - width) / 2} ${(5 - height) / 2})`;
}

function startRound() {
  clearRuntime();
  seed.value = createSeed();
  trials.value = createRotationTrials(trialCount.value, seed.value);
  responses.length = 0;
  index.value = 0;
  summary.value = null;
  inputMode.value = 'none';
  feedback.value = '';
  showTrial();
}

function showTrial() {
  phase.value = 'presenting';
  feedback.value = '';
  presentation.afterNextPaint((timestamp) => {
    if (phase.value !== 'presenting' || !current.value) return;
    shownAt = timestamp;
    if (index.value === 0) roundStartedAt = timestamp;
    phase.value = 'stimulus';
    liveMessage.value = accessibleMode.value
      ? `第 ${index.value + 1} 题。图形 A 基础格：${describeCells(current.value.left)}，整体旋转 ${current.value.leftAngleDeg} 度。图形 B 基础格：${describeCells(current.value.right)}，整体旋转 ${current.value.rightAngleDeg} 度。判断两者是否只差旋转。`
      : `第 ${index.value + 1} 题。判断两图是否为同一图形经过旋转。`;
    stageRef.value?.focus();
  });
}

function respond(answer: boolean, source: 'keyboard' | 'pointer') {
  if (phase.value !== 'stimulus' || !current.value) return;
  trackInput(source);
  const correct = answer === current.value.same;
  responses.push({ same: current.value.same, angleDeg: current.value.angleDeg, correct, responseMs: accessibleMode.value ? null : performance.now() - shownAt });
  phase.value = 'feedback';
  feedback.value = correct ? '正确' : current.value.same ? '这是同一图形的旋转' : '这是镜像图形';
  liveMessage.value = `${feedback.value}。${accessibleMode.value ? '使用下一题按钮继续。' : ''}`;
  if (accessibleMode.value) nextTick(() => assistNextRef.value?.focus());
  else schedule(advance, 300);
}

function respondFromButton(answer: boolean, event: MouseEvent) {
  respond(answer, event.detail === 0 ? 'keyboard' : 'pointer');
}

function advance() {
  if (index.value + 1 >= trials.value.length) finishRound();
  else { index.value++; showTrial(); }
}

function finishRound() {
  clearRuntime();
  phase.value = 'done';
  const sameResponses = responses.filter((item) => item.same);
  const mirrorResponses = responses.filter((item) => !item.same);
  const responseTimes = responses.filter((item) => item.correct && item.responseMs !== null).map((item) => item.responseMs!);
  const medianMs = median(responseTimes);
  const angleMedian = (angleDeg: AngleBin) => median(responses.filter((item) => item.same && item.correct && item.angleDeg === angleDeg && item.responseMs !== null).map((item) => item.responseMs!));
  summary.value = {
    accuracy: responses.filter((item) => item.correct).length / responses.length,
    sameAccuracy: sameResponses.filter((item) => item.correct).length / sameResponses.length,
    mirrorAccuracy: mirrorResponses.filter((item) => item.correct).length / mirrorResponses.length,
    medianMs,
    angle0Ms: angleMedian(0),
    angle45Ms: angleMedian(45),
    angle90Ms: angleMedian(90),
    angle135Ms: angleMedian(135),
    angle180Ms: angleMedian(180),
  };
  feedback.value = accessibleMode.value
    ? '本轮完成。屏幕阅读器模式无时限，本轮不报告反应时。'
    : '本轮完成。角度、形状和速度—准确权衡都会影响结果。';
  liveMessage.value = `本轮完成，准确率 ${(summary.value.accuracy * 100).toFixed(1)}%。`;
  saveResult({
    schemaVersion: 1, taskId: 'mental-rotation', completedAt: new Date().toISOString(), durationMs: performance.now() - roundStartedAt,
    seed: seed.value, variant: 'chiral-pentomino', inputMode: inputMode.value,
    metrics: {
      accuracy: summary.value.accuracy,
      sameAccuracy: summary.value.sameAccuracy,
      mirrorAccuracy: summary.value.mirrorAccuracy,
      ...(medianMs === null ? {} : { medianMs }),
      ...(summary.value.angle0Ms === null ? {} : { angle0Ms: summary.value.angle0Ms }),
      ...(summary.value.angle45Ms === null ? {} : { angle45Ms: summary.value.angle45Ms }),
      ...(summary.value.angle90Ms === null ? {} : { angle90Ms: summary.value.angle90Ms }),
      ...(summary.value.angle135Ms === null ? {} : { angle135Ms: summary.value.angle135Ms }),
      ...(summary.value.angle180Ms === null ? {} : { angle180Ms: summary.value.angle180Ms }),
    },
    parameters: { trialCount: trialCount.value, accessibleMode: accessibleMode.value },
  });
  if (accessibleMode.value) nextTick(() => stageRef.value?.focus());
}

function handleKey(event: KeyboardEvent) {
  if (phase.value !== 'stimulus') return;
  if (['f', 'F', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); respond(false, 'keyboard'); }
  else if (['j', 'J', 'ArrowRight'].includes(event.key)) { event.preventDefault(); respond(true, 'keyboard'); }
}
function abortIfHidden() {
  if (document.hidden && active.value) {
    clearRuntime();
    phase.value = 'aborted';
    feedback.value = '页面失去可见性，本轮已作废；请重新开始。';
    liveMessage.value = feedback.value;
  }
}
onMounted(() => document.addEventListener('visibilitychange', abortIfHidden));
onUnmounted(() => { clearRuntime(); document.removeEventListener('visibilitychange', abortIfHidden); });
</script>

<template>
  <TrainingShell title="心理旋转" en-title="Mental Rotation" description="判断两个离散几何图形能否只通过旋转重合；镜像试次不会被包装成“空间智商”。" accent="#15803d" dark-accent="#86efac">
    <section ref="stageRef" class="exercise-stage" tabindex="0" aria-label="心理旋转训练区" @keydown="handleKey">
      <div class="control-row">
        <div class="control-group">
          <label class="control-field">试次数<select v-model.number="trialCount" :disabled="active"><option :value="16">16</option><option :value="24">24</option><option :value="32">32</option></select></label>
          <label class="assist-field"><input v-model="accessibleMode" type="checkbox" :disabled="active">屏幕阅读器模式 · 无时限</label>
        </div>
        <button :class="{ 'primary-button': !active }" type="button" @click="startRound">{{ active ? '重新开始' : phase === 'done' ? '再测一轮' : '开始' }}</button>
      </div>

      <p class="status-line"><span>进度 <strong>{{ active || phase === 'done' ? Math.min(index + 1, trialCount) : 0 }} / {{ trialCount }}</strong></span><span>判断 <strong>旋转相同 / 镜像不同</strong></span></p>

      <div class="rotation-pair" aria-hidden="true">
        <svg viewBox="0 0 5 5"><g v-if="current" :transform="`rotate(${current.leftAngleDeg} 2.5 2.5)`"><g :transform="shapeTransform(current.left)"><rect v-for="cell in current.left" :key="`${cell.x}-${cell.y}`" :x="cell.x + 0.08" :y="cell.y + 0.08" width="0.84" height="0.84" rx="0.14" /></g></g></svg>
        <span>?</span>
        <svg viewBox="0 0 5 5"><g v-if="current" :transform="`rotate(${current.rightAngleDeg} 2.5 2.5)`"><g :transform="shapeTransform(current.right)"><rect v-for="cell in current.right" :key="`${cell.x}-${cell.y}`" :x="cell.x + 0.08" :y="cell.y + 0.08" width="0.84" height="0.84" rx="0.14" /></g></g></svg>
      </div>

      <p class="task-instructions">F / ←：镜像或不同；J / →：同一图形经过旋转。坐标文本模式测量的是 adapted task，不与视觉反应时混合。</p>
      <div class="choice-row">
        <button class="choice-button" type="button" :disabled="phase !== 'stimulus'" @click="respondFromButton(false, $event)">F / ← 镜像不同</button>
        <button class="choice-button" type="button" :disabled="phase !== 'stimulus'" @click="respondFromButton(true, $event)">J / → 旋转相同</button>
      </div>
      <button v-if="accessibleMode && phase === 'feedback'" ref="assistNextRef" class="assist-next" type="button" @click="advance">{{ index + 1 >= trials.length ? '查看结果' : '下一题' }}</button>
      <p class="feedback" :class="{ 'is-correct': feedback === '正确', 'is-error': feedback && feedback !== '正确' && phase === 'feedback' }">{{ feedback }}</p>
      <p class="sr-only" role="status" aria-atomic="true">{{ liveMessage }}</p>

      <div v-if="summary" class="metric-grid" aria-live="polite">
        <div class="metric"><span>准确率</span><strong>{{ (summary.accuracy * 100).toFixed(1) }}%</strong></div>
        <div class="metric"><span>旋转相同</span><strong>{{ (summary.sameAccuracy * 100).toFixed(1) }}%</strong></div>
        <div class="metric"><span>镜像不同</span><strong>{{ (summary.mirrorAccuracy * 100).toFixed(1) }}%</strong></div>
        <div class="metric"><span>正确反应中位数</span><strong>{{ summary.medianMs === null ? '—' : `${Math.round(summary.medianMs)} ms` }}</strong></div>
        <div class="metric"><span>同形 0° 中位数</span><strong>{{ summary.angle0Ms === null ? '—' : `${Math.round(summary.angle0Ms)} ms` }}</strong></div>
        <div class="metric"><span>同形 45° 中位数</span><strong>{{ summary.angle45Ms === null ? '—' : `${Math.round(summary.angle45Ms)} ms` }}</strong></div>
        <div class="metric"><span>同形 90° 中位数</span><strong>{{ summary.angle90Ms === null ? '—' : `${Math.round(summary.angle90Ms)} ms` }}</strong></div>
        <div class="metric"><span>同形 135° 中位数</span><strong>{{ summary.angle135Ms === null ? '—' : `${Math.round(summary.angle135Ms)} ms` }}</strong></div>
        <div class="metric"><span>同形 180° 中位数</span><strong>{{ summary.angle180Ms === null ? '—' : `${Math.round(summary.angle180Ms)} ms` }}</strong></div>
      </div>
    </section>
  </TrainingShell>
</template>

<style scoped src="../../shared/TrainingExercise.css"></style>
<style scoped>
.rotation-pair { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: clamp(10px, 3vw, 24px); width: min(100%, 480px); margin: 8px auto 18px; }
.rotation-pair svg { width: 100%; border: 1px solid var(--vp-c-divider); border-radius: 16px; background: var(--vp-c-bg); aspect-ratio: 1; }
.rotation-pair rect { fill: var(--training-accent); }
.rotation-pair > span { color: var(--vp-c-text-3); font: 720 1.6rem/1 ui-monospace, monospace; }
.choice-button:not(:disabled) { border-color: color-mix(in srgb, var(--training-accent) 42%, var(--vp-c-divider)); background: color-mix(in srgb, var(--training-accent) 7%, var(--vp-c-bg)); }
@media (max-width: 520px) { .rotation-pair { gap: 7px; } .rotation-pair svg { border-radius: 12px; } }
</style>
