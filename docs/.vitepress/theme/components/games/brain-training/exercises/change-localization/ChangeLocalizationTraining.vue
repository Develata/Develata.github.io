<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { saveResult } from '../../persistence';
import { createSeed } from '../../rng';
import { median } from '../../statistics';
import TrainingShell from '../../shared/TrainingShell.vue';
import { createPresentationScheduler } from '../../shared/presentation';
import { COLOR_LABELS, COLOR_VALUES, SHAPE_GLYPHS, SHAPE_LABELS, createChangeTrials, describeChangeArray, itemIndexAtSlot, type ChangeTrial } from './core';

type Phase = 'ready' | 'presenting-sample' | 'sample' | 'retention' | 'presenting-probe' | 'probe' | 'feedback' | 'done' | 'aborted';
type TrackedInput = 'none' | 'keyboard' | 'pointer' | 'mixed';
interface Response { correct: boolean; responseMs: number | null }
interface Summary { accuracy: number; errors: number; medianMs: number | null }

const SAMPLE_MS = 900;
const RETENTION_MS = 450;
const stageRef = ref<HTMLElement | null>(null);
const assistNextRef = ref<HTMLButtonElement | null>(null);
const setSize = ref(6);
const trialCount = ref(12);
const accessibleMode = ref(false);
const phase = ref<Phase>('ready');
const index = ref(0);
const selectedSlot = ref<number | null>(null);
const feedback = ref('');
const liveMessage = ref('设置项目数和试次数后开始。');
const inputMode = ref<TrackedInput>('none');
const summary = ref<Summary | null>(null);
const seed = ref(1);
const trials = ref<ChangeTrial[]>([]);
const responses: Response[] = [];
const timers = new Set<number>();
const presentation = createPresentationScheduler();
let shownAt = 0;
let roundStartedAt = 0;

const current = computed(() => trials.value[index.value] ?? null);
const active = computed(() => !['ready', 'done', 'aborted'].includes(phase.value));
const sampleVisible = computed(() => ['presenting-sample', 'sample'].includes(phase.value));
const probeVisible = computed(() => ['presenting-probe', 'probe', 'feedback'].includes(phase.value));

function schedule(callback: () => void, delay: number) {
  const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay);
  timers.add(id);
}
function clearRuntime() {
  for (const id of timers) window.clearTimeout(id);
  timers.clear();
  presentation.cancel();
}
function itemAt(slot: number): number {
  return current.value ? itemIndexAtSlot(current.value, slot) : -1;
}
function itemColor(slot: number): string {
  const item = itemAt(slot);
  if (!current.value || item < 0) return 'transparent';
  const colors = probeVisible.value ? current.value.probeColors : current.value.sampleColors;
  return COLOR_VALUES[colors[item]];
}
function itemGlyph(slot: number): string {
  const item = itemAt(slot);
  if (!current.value || item < 0) return '';
  const shapes = probeVisible.value ? current.value.probeShapes : current.value.sampleShapes;
  return SHAPE_GLYPHS[shapes[item]];
}
function itemLabel(slot: number): string {
  const item = itemAt(slot);
  if (!current.value || item < 0) return '';
  const row = Math.floor(slot / 3) + 1;
  const column = slot % 3 + 1;
  return `第 ${row} 行第 ${column} 列，${COLOR_LABELS[current.value.probeColors[item]]}${SHAPE_LABELS[current.value.probeShapes[item]]}`;
}
function trackInput(event: MouseEvent) {
  const next: 'keyboard' | 'pointer' = event.detail === 0 ? 'keyboard' : 'pointer';
  if (inputMode.value === 'none') inputMode.value = next;
  else if (inputMode.value !== next) inputMode.value = 'mixed';
}

function startRound() {
  clearRuntime();
  seed.value = createSeed();
  trials.value = createChangeTrials(setSize.value, trialCount.value, seed.value);
  responses.length = 0;
  index.value = 0;
  summary.value = null;
  inputMode.value = 'none';
  feedback.value = '';
  showSample();
}

function showSample() {
  phase.value = 'presenting-sample';
  selectedSlot.value = null;
  feedback.value = '';
  presentation.afterNextPaint((timestamp) => {
    if (phase.value !== 'presenting-sample' || !current.value) return;
    if (index.value === 0) roundStartedAt = timestamp;
    phase.value = 'sample';
    liveMessage.value = accessibleMode.value
      ? `第 ${index.value + 1} 题样本。${describeChangeArray(current.value, false)}。记住后使用查看变化按钮。`
      : `第 ${index.value + 1} 题，记住颜色与形状的位置。`;
    if (accessibleMode.value) nextTick(() => assistNextRef.value?.focus());
    else schedule(beginRetention, SAMPLE_MS);
  });
}

function beginRetention() {
  if (phase.value !== 'sample') return;
  for (const id of timers) window.clearTimeout(id);
  timers.clear();
  phase.value = 'retention';
  liveMessage.value = '保持。';
  if (accessibleMode.value) showProbe();
  else schedule(showProbe, RETENTION_MS);
}

function showProbe() {
  phase.value = 'presenting-probe';
  presentation.afterNextPaint((timestamp) => {
    if (phase.value !== 'presenting-probe' || !current.value) return;
    shownAt = timestamp;
    phase.value = 'probe';
    liveMessage.value = accessibleMode.value
      ? `变化后。${describeChangeArray(current.value, true)}。请选择发生变化的位置。`
      : '请选择颜色和形状发生变化的位置。';
    nextTick(() => stageRef.value?.querySelector<HTMLButtonElement>('button.change-cell')?.focus());
  });
}

function selectSlot(slot: number, event: MouseEvent) {
  if (phase.value !== 'probe' || !current.value) return;
  trackInput(event);
  selectedSlot.value = slot;
  const correct = slot === current.value.changedSlot;
  responses.push({ correct, responseMs: accessibleMode.value ? null : performance.now() - shownAt });
  phase.value = 'feedback';
  feedback.value = correct ? '正确' : `变化位于第 ${Math.floor(current.value.changedSlot / 3) + 1} 行第 ${current.value.changedSlot % 3 + 1} 列`;
  liveMessage.value = `${feedback.value}。${accessibleMode.value ? '使用下一题按钮继续。' : ''}`;
  if (accessibleMode.value) nextTick(() => assistNextRef.value?.focus());
  else schedule(advance, 360);
}

function advance() {
  if (index.value + 1 >= trials.value.length) finishRound();
  else { index.value++; showSample(); }
}

function finishRound() {
  clearRuntime();
  phase.value = 'done';
  const responseTimes = responses.filter((item) => item.correct && item.responseMs !== null).map((item) => item.responseMs!);
  const medianMs = median(responseTimes);
  const correct = responses.filter((item) => item.correct).length;
  summary.value = { accuracy: correct / responses.length, errors: responses.length - correct, medianMs };
  feedback.value = accessibleMode.value
    ? '本轮完成。屏幕阅读器模式无时限，本轮不报告反应时。'
    : '本轮完成。结果只描述当前颜色、形状和项目数条件下的变化定位。';
  liveMessage.value = `本轮完成，准确率 ${(summary.value.accuracy * 100).toFixed(1)}%。`;
  saveResult({
    schemaVersion: 1, taskId: 'change-localization', completedAt: new Date().toISOString(), durationMs: performance.now() - roundStartedAt,
    seed: seed.value, variant: 'color-shape', inputMode: inputMode.value,
    metrics: { accuracy: summary.value.accuracy, errors: summary.value.errors, ...(medianMs === null ? {} : { medianMs }) },
    parameters: { setSize: setSize.value, trialCount: trialCount.value, sampleMs: accessibleMode.value ? 0 : SAMPLE_MS, retentionMs: accessibleMode.value ? 0 : RETENTION_MS, accessibleMode: accessibleMode.value },
  });
  if (accessibleMode.value) nextTick(() => stageRef.value?.focus());
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
  <TrainingShell title="变化定位" en-title="Change Localization" description="记住由颜色与形状共同编码的项目，并指出保持间隔后发生变化的位置。" accent="#0e7490" dark-accent="#67e8f9">
    <section ref="stageRef" class="exercise-stage" tabindex="0" aria-label="变化定位训练区">
      <div class="control-row">
        <div class="control-group">
          <label class="control-field">项目数<select v-model.number="setSize" :disabled="active"><option :value="4">4</option><option :value="6">6</option><option :value="8">8</option></select></label>
          <label class="control-field">试次数<select v-model.number="trialCount" :disabled="active"><option :value="12">12</option><option :value="18">18</option><option :value="24">24</option></select></label>
          <label class="assist-field"><input v-model="accessibleMode" type="checkbox" :disabled="active">屏幕阅读器模式 · 无时限</label>
        </div>
        <button :class="{ 'primary-button': !active }" type="button" @click="startRound">{{ active ? '重新开始' : phase === 'done' ? '再测一轮' : '开始' }}</button>
      </div>

      <p class="status-line"><span>进度 <strong>{{ active || phase === 'done' ? Math.min(index + 1, trialCount) : 0 }} / {{ trialCount }}</strong></span><span>阶段 <strong>{{ sampleVisible ? '记忆' : phase === 'retention' ? '保持' : probeVisible ? '定位' : phase === 'done' ? '完成' : '等待' }}</strong></span></p>

      <div class="change-grid" :class="{ 'is-blank': phase === 'retention' }" role="group" aria-label="颜色与形状位置阵列">
        <template v-for="slot in 9" :key="slot">
          <button v-if="phase === 'probe' && itemAt(slot - 1) >= 0" class="change-cell" type="button" :aria-label="itemLabel(slot - 1)" @click="selectSlot(slot - 1, $event)"><span :style="{ color: itemColor(slot - 1) }">{{ itemGlyph(slot - 1) }}</span></button>
          <div
            v-else
            class="change-cell"
            :class="{
              'is-changed': phase === 'feedback' && current?.changedSlot === slot - 1,
              'is-wrong-selection': phase === 'feedback' && selectedSlot === slot - 1 && current?.changedSlot !== slot - 1,
            }"
          ><span v-if="(sampleVisible || probeVisible) && itemAt(slot - 1) >= 0" :style="{ color: itemColor(slot - 1) }">{{ itemGlyph(slot - 1) }}</span></div>
        </template>
      </div>

      <p class="task-instructions">变化始终同时包含颜色与形状，避免只依赖单一色觉线索。视觉模式中先记忆、短暂保持，再点击变化位置。</p>
      <button v-if="accessibleMode && phase === 'sample'" ref="assistNextRef" class="assist-next" type="button" @click="beginRetention">查看变化</button>
      <button v-if="accessibleMode && phase === 'feedback'" ref="assistNextRef" class="assist-next" type="button" @click="advance">{{ index + 1 >= trials.length ? '查看结果' : '下一题' }}</button>
      <p class="feedback" :class="{ 'is-correct': feedback === '正确', 'is-error': feedback.startsWith('变化位于') }">{{ feedback }}</p>
      <p class="sr-only" role="status" aria-atomic="true">{{ liveMessage }}</p>

      <div v-if="summary" class="metric-grid">
        <div class="metric"><span>定位准确率</span><strong>{{ (summary.accuracy * 100).toFixed(1) }}%</strong></div>
        <div class="metric"><span>错误定位</span><strong>{{ summary.errors }}</strong></div>
        <div class="metric"><span>正确反应中位数</span><strong>{{ summary.medianMs === null ? '—' : `${Math.round(summary.medianMs)} ms` }}</strong></div>
      </div>
    </section>
  </TrainingShell>
</template>

<style scoped src="../../shared/TrainingExercise.css"></style>
<style scoped>
.change-grid { display: grid; width: min(76vw, 300px); margin: 8px auto 18px; grid-template-columns: repeat(3, 1fr); gap: 9px; aspect-ratio: 1; }
.change-cell { display: grid; min-width: 0; padding: 0; place-items: center; border: 1px solid color-mix(in srgb, var(--vp-c-text-2) 58%, var(--vp-c-divider)); border-radius: 12px; background: var(--vp-c-bg); }
.change-cell span { font: 750 clamp(1.8rem, 8vw, 3.1rem)/1 system-ui, sans-serif; filter: saturate(0.86); }
.change-grid.is-blank .change-cell { border-style: dashed; opacity: 0.46; }
button.change-cell:focus-visible { outline-width: 4px; }
.change-cell.is-changed { border-color: var(--vp-c-success-1); box-shadow: 0 0 0 3px color-mix(in srgb, var(--vp-c-success-1) 28%, transparent); }
.change-cell.is-wrong-selection { border-color: var(--vp-c-danger-1); box-shadow: 0 0 0 3px color-mix(in srgb, var(--vp-c-danger-1) 24%, transparent); }
</style>
