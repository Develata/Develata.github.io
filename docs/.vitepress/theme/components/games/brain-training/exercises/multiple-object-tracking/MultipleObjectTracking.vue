<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { saveResult } from '../../persistence';
import { createSeed } from '../../rng';
import TrainingShell from '../../shared/TrainingShell.vue';
import { createPresentationScheduler } from '../../shared/presentation';
import { advanceMotState, createMotRound, scoreMotSelection, type MotRound } from './core';

type Phase = 'ready' | 'cue' | 'tracking' | 'select' | 'feedback' | 'done' | 'aborted';
type TrackedInput = 'none' | 'keyboard' | 'pointer' | 'mixed';
interface Summary { accuracy: number; hits: number; falseSelections: number }

const CUE_MS = 1_500;
const TRACK_MS = 5_200;
const FIXED_STEP = 1 / 120;
const stageRef = ref<HTMLElement | null>(null);
const objectCount = ref(8);
const targetCount = ref(3);
const roundCount = ref(3);
const speed = ref(0.12);
const phase = ref<Phase>('ready');
const roundIndex = ref(0);
const selected = ref<Set<number>>(new Set());
const feedback = ref('');
const liveMessage = ref('设置对象、目标与轮数后开始。');
const inputMode = ref<TrackedInput>('none');
const summary = ref<Summary | null>(null);
const seed = ref(1);
const state = ref<MotRound>(createMotRound(objectCount.value, targetCount.value, speed.value, seed.value));
const objectRefs: HTMLButtonElement[] = [];
const timers = new Set<number>();
const presentation = createPresentationScheduler();
let animationId: number | null = null;
let lastFrame = 0;
let accumulator = 0;
let trackingStartedAt = 0;
let roundStartedAt = 0;
let totalHits = 0;
let totalFalseSelections = 0;

const active = computed(() => !['ready', 'done', 'aborted'].includes(phase.value));
const selectedCount = computed(() => selected.value.size);
const canSubmit = computed(() => phase.value === 'select' && selectedCount.value === targetCount.value);

watch(objectCount, (count) => {
  if (targetCount.value >= count) targetCount.value = count - 1;
  if (!active.value) previewRound();
});
watch([targetCount, speed], () => { if (!active.value) previewRound(); });

function setObjectRef(element: unknown, index: number) {
  if (element instanceof HTMLButtonElement) objectRefs[index] = element;
}
function schedule(callback: () => void, delay: number) {
  const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay);
  timers.add(id);
}
function clearRuntime() {
  for (const id of timers) window.clearTimeout(id);
  timers.clear();
  presentation.cancel();
  if (animationId !== null) window.cancelAnimationFrame(animationId);
  animationId = null;
}
function renderPositions() {
  for (let index = 0; index < state.value.count; index++) {
    const element = objectRefs[index];
    if (!element) continue;
    element.style.left = `${state.value.positions[index * 2] * 100}%`;
    element.style.top = `${state.value.positions[index * 2 + 1] * 100}%`;
  }
}
function previewRound() {
  state.value = createMotRound(objectCount.value, targetCount.value, speed.value, 1);
  selected.value = new Set();
  nextTick(renderPositions);
}
function trackInput(event: MouseEvent) {
  const next: 'keyboard' | 'pointer' = event.detail === 0 ? 'keyboard' : 'pointer';
  if (inputMode.value === 'none') inputMode.value = next;
  else if (inputMode.value !== next) inputMode.value = 'mixed';
}

function startSession() {
  clearRuntime();
  seed.value = createSeed();
  roundIndex.value = 0;
  roundStartedAt = performance.now();
  totalHits = 0;
  totalFalseSelections = 0;
  summary.value = null;
  inputMode.value = 'none';
  prepareRound();
}

function prepareRound() {
  clearRuntime();
  const roundSeed = (seed.value + Math.imul(roundIndex.value + 1, 0x9e3779b1)) >>> 0;
  state.value = createMotRound(objectCount.value, targetCount.value, speed.value, roundSeed);
  selected.value = new Set();
  feedback.value = '';
  phase.value = 'cue';
  liveMessage.value = `第 ${roundIndex.value + 1} 轮。高亮的 ${targetCount.value} 个物体是目标。`;
  nextTick(renderPositions);
  presentation.afterNextPaint(() => schedule(startTracking, CUE_MS));
}

function startTracking() {
  if (phase.value !== 'cue') return;
  phase.value = 'tracking';
  liveMessage.value = '目标高亮已隐藏，追踪开始。';
  presentation.afterNextPaint((timestamp) => {
    if (phase.value !== 'tracking') return;
    trackingStartedAt = timestamp;
    lastFrame = timestamp;
    accumulator = 0;
    animationId = window.requestAnimationFrame(frame);
  });
}

function frame(timestamp: number) {
  if (phase.value !== 'tracking') return;
  // Preserve visible elapsed time through ordinary main-thread jank. The cap
  // bounds catch-up work; hidden tabs are invalidated separately.
  const delta = Math.min((timestamp - lastFrame) / 1_000, 0.25);
  lastFrame = timestamp;
  accumulator += delta;
  while (accumulator >= FIXED_STEP) {
    advanceMotState(state.value, FIXED_STEP);
    accumulator -= FIXED_STEP;
  }
  renderPositions();
  if (timestamp - trackingStartedAt >= TRACK_MS) finishTracking();
  else animationId = window.requestAnimationFrame(frame);
}

function finishTracking() {
  if (animationId !== null) window.cancelAnimationFrame(animationId);
  animationId = null;
  phase.value = 'select';
  liveMessage.value = `运动结束。请选择你追踪的 ${targetCount.value} 个目标。`;
  nextTick(() => objectRefs[0]?.focus());
}

function toggleSelection(index: number, event: MouseEvent) {
  if (phase.value !== 'select') return;
  trackInput(event);
  const next = new Set(selected.value);
  if (next.has(index)) next.delete(index);
  else if (next.size < targetCount.value) next.add(index);
  selected.value = next;
  liveMessage.value = `已选择 ${next.size} / ${targetCount.value} 个物体。`;
}

function submitSelection() {
  if (!canSubmit.value) return;
  const score = scoreMotSelection(state.value, selected.value);
  totalHits += score.hits;
  totalFalseSelections += score.falseSelections;
  phase.value = 'feedback';
  feedback.value = `命中 ${score.hits} / ${targetCount.value}，误选 ${score.falseSelections}`;
  liveMessage.value = `${feedback.value}。${roundIndex.value + 1 >= roundCount.value ? '查看本次结果。' : '进入下一轮。'}`;
}

function continueSession() {
  if (roundIndex.value + 1 >= roundCount.value) finishSession();
  else { roundIndex.value++; prepareRound(); }
}

function finishSession() {
  clearRuntime();
  phase.value = 'done';
  const possible = roundCount.value * targetCount.value;
  summary.value = { accuracy: totalHits / possible, hits: totalHits, falseSelections: totalFalseSelections };
  feedback.value = '本次完成。结果只描述当前对象数、速度与运动时长下的目标选择。';
  liveMessage.value = `本次完成，目标命中率 ${(summary.value.accuracy * 100).toFixed(1)}%。`;
  saveResult({
    schemaVersion: 1, taskId: 'multiple-object-tracking', completedAt: new Date().toISOString(), durationMs: performance.now() - roundStartedAt,
    seed: seed.value, variant: 'bounded-collisions', inputMode: inputMode.value,
    metrics: { accuracy: summary.value.accuracy, hits: summary.value.hits, falseSelections: summary.value.falseSelections },
    parameters: { objectCount: objectCount.value, targetCount: targetCount.value, roundCount: roundCount.value, speed: speed.value, cueMs: CUE_MS, trackingMs: TRACK_MS },
  });
  nextTick(() => stageRef.value?.focus());
}

function abortIfHidden() {
  if (document.hidden && active.value) {
    clearRuntime();
    phase.value = 'aborted';
    feedback.value = '页面失去可见性，本次已作废；请重新开始。';
    liveMessage.value = feedback.value;
  }
}
onMounted(() => {
  document.addEventListener('visibilitychange', abortIfHidden);
  nextTick(renderPositions);
});
onUnmounted(() => { clearRuntime(); document.removeEventListener('visibilitychange', abortIfHidden); });
</script>

<template>
  <TrainingShell title="多目标追踪" en-title="Multiple Object Tracking" description="短暂标记若干目标，在所有物体移动后重新识别它们；不把表现解释成一般“动态注意力”。" accent="#be185d" dark-accent="#f9a8d4">
    <section ref="stageRef" class="exercise-stage" tabindex="0" aria-label="多目标追踪训练区" aria-describedby="mot-accessibility-boundary">
      <div class="control-row">
        <div class="control-group">
          <label class="control-field">物体数<select v-model.number="objectCount" :disabled="active"><option :value="8">8</option><option :value="10">10</option><option :value="12">12</option></select></label>
          <label class="control-field">目标数<select v-model.number="targetCount" :disabled="active"><option v-for="value in [2, 3, 4]" :key="value" :value="value" :disabled="value >= objectCount">{{ value }}</option></select></label>
          <label class="control-field">速度<select v-model.number="speed" :disabled="active"><option :value="0.09">慢</option><option :value="0.12">中</option><option :value="0.16">快</option></select></label>
          <label class="control-field">轮数<select v-model.number="roundCount" :disabled="active"><option :value="3">3</option><option :value="5">5</option></select></label>
        </div>
        <button :class="{ 'primary-button': !active }" type="button" @click="startSession">{{ active ? '重新开始' : phase === 'done' ? '再测一次' : '开始' }}</button>
      </div>

      <p class="status-line"><span>轮次 <strong>{{ active || phase === 'done' ? Math.min(roundIndex + 1, roundCount) : 0 }} / {{ roundCount }}</strong></span><span>阶段 <strong>{{ phase === 'cue' ? '标记目标' : phase === 'tracking' ? '持续追踪' : phase === 'select' ? '选择目标' : phase === 'feedback' ? '核对' : phase === 'done' ? '完成' : '等待' }}</strong></span></p>

      <div class="mot-arena" role="group" aria-label="移动物体区域">
        <button
          v-for="(_, objectIndex) in state.count"
          :key="objectIndex"
          :ref="(element) => setObjectRef(element, objectIndex)"
          class="mot-object"
          :class="{
            'is-cued': phase === 'cue' && state.targets[objectIndex] === 1,
            'is-selected': selected.has(objectIndex),
            'is-target': ['feedback', 'done'].includes(phase) && state.targets[objectIndex] === 1,
            'is-false': ['feedback', 'done'].includes(phase) && selected.has(objectIndex) && state.targets[objectIndex] === 0,
          }"
          type="button"
          :disabled="phase !== 'select'"
          :aria-pressed="phase === 'select' ? selected.has(objectIndex) : undefined"
          :aria-label="`候选物体 ${objectIndex + 1}`"
          @click="toggleSelection(objectIndex, $event)"
        ><span aria-hidden="true"></span></button>
      </div>

      <p id="mot-accessibility-boundary" class="task-instructions mot-note">运动结束后，逐个点击候选物体，或用 Tab 定位并按 Enter 选择，再确认答案。运动是本任务的必要刺激，只在点击开始后播放；系统启用 reduced motion 时也不自动播放。DOM 候选与状态可访问，但本页不伪造等价的非视觉追踪分数。</p>
      <p v-if="phase === 'select'" class="selection-count">选择 {{ selectedCount }} / {{ targetCount }}</p>
      <button v-if="phase === 'select'" class="assist-next" type="button" :disabled="!canSubmit" @click="submitSelection">确认选择</button>
      <button v-if="phase === 'feedback'" class="assist-next" type="button" @click="continueSession">{{ roundIndex + 1 >= roundCount ? '查看结果' : '下一轮' }}</button>
      <p class="feedback" :class="{ 'is-error': phase === 'aborted' }">{{ feedback }}</p>
      <p class="sr-only" role="status" aria-atomic="true">{{ liveMessage }}</p>

      <div v-if="summary" class="metric-grid">
        <div class="metric"><span>目标命中率</span><strong>{{ (summary.accuracy * 100).toFixed(1) }}%</strong></div>
        <div class="metric"><span>命中目标</span><strong>{{ summary.hits }} / {{ roundCount * targetCount }}</strong></div>
        <div class="metric"><span>误选</span><strong>{{ summary.falseSelections }}</strong></div>
      </div>
    </section>
  </TrainingShell>
</template>

<style scoped src="../../shared/TrainingExercise.css"></style>
<style scoped>
.mot-arena { position: relative; width: min(100%, 600px); margin: 8px auto 20px; overflow: hidden; border: 1px solid var(--vp-c-divider); border-radius: 18px; background: radial-gradient(circle at center, color-mix(in srgb, var(--training-accent) 5%, var(--vp-c-bg)) 0, var(--vp-c-bg) 70%); aspect-ratio: 2 / 1; }
.mot-object { position: absolute; width: 44px; min-height: 44px; padding: 0; border: 0; border-radius: 50%; background: transparent; transform: translate(-50%, -50%); opacity: 1; }
.mot-object span { display: block; width: 22px; height: 22px; margin: auto; border: 2px solid color-mix(in srgb, var(--vp-c-text-1) 72%, transparent); border-radius: 50%; background: var(--vp-c-bg); box-shadow: 0 2px 8px rgba(20, 30, 55, 0.16); }
.mot-object:disabled { cursor: default; opacity: 1; }
.mot-object.is-cued span { border-color: var(--training-accent); background: var(--training-accent); box-shadow: 0 0 0 7px color-mix(in srgb, var(--training-accent) 20%, transparent); }
.mot-object.is-selected span { border-color: var(--training-accent); box-shadow: 0 0 0 5px color-mix(in srgb, var(--training-accent) 24%, transparent); }
.mot-object.is-target span { border-color: var(--vp-c-success-1); background: color-mix(in srgb, var(--vp-c-success-1) 28%, var(--vp-c-bg)); }
.mot-object.is-false span { border-color: var(--vp-c-danger-1); background: color-mix(in srgb, var(--vp-c-danger-1) 22%, var(--vp-c-bg)); }
.mot-note { max-width: 76ch; margin: 0 auto; font-size: 0.8rem; }
.selection-count { margin: 14px 0 0; color: var(--vp-c-text-2); text-align: center; font-variant-numeric: tabular-nums; }
@media (max-width: 520px) { .mot-arena { aspect-ratio: 4 / 3; border-radius: 14px; } }
@media (prefers-reduced-motion: reduce) { .mot-object { transition: none; } }
</style>
