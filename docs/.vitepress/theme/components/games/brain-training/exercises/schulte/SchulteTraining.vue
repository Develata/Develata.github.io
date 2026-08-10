<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { saveResult } from '../../persistence';
import { createSeed } from '../../rng';
import { median } from '../../statistics';
import TrainingShell from '../../shared/TrainingShell.vue';
import { createPresentationScheduler } from '../../shared/presentation';
import { createSchulteRound, type SchulteMode } from './core';

interface RoundSummary {
  durationMs: number;
  errors: number;
  medianIntervalMs: number;
  lateDeltaMs: number;
}

type Phase = 'ready' | 'presenting' | 'running' | 'done' | 'aborted';
type TrackedInput = 'none' | 'keyboard' | 'pointer' | 'mixed';

const stageRef = ref<HTMLElement | null>(null);
const size = ref(5);
const mode = ref<SchulteMode>('ascending');
const seed = ref(1);
const round = ref(createSchulteRound(size.value, mode.value, seed.value));
const phase = ref<Phase>('ready');
const nextIndex = ref(0);
const errors = ref(0);
const wrongValue = ref<number | null>(null);
const elapsedMs = ref(0);
const summary = ref<RoundSummary | null>(null);
const inputMode = ref<TrackedInput>('none');
const liveMessage = ref('设置网格和规则后开始。');
const intervals: number[] = [];
const presentation = createPresentationScheduler();
let startedAt = 0;
let lastCorrectAt = 0;
let wrongTimer: number | null = null;

const target = computed(() => round.value.sequence[nextIndex.value] ?? null);
const active = computed(() => phase.value === 'presenting' || phase.value === 'running');
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${round.value.size}, minmax(0, 1fr))` }));
const modeLabel = computed(() => ({ ascending: '正序', descending: '逆序', alternating: '双端交替' })[mode.value]);

function trackInput(next: 'keyboard' | 'pointer') {
  if (inputMode.value === 'none') inputMode.value = next;
  else if (inputMode.value !== next) inputMode.value = 'mixed';
}

function clearWrongTimer() {
  if (wrongTimer === null) return;
  window.clearTimeout(wrongTimer);
  wrongTimer = null;
}

function startRound() {
  clearWrongTimer();
  presentation.cancel();
  seed.value = createSeed();
  round.value = createSchulteRound(size.value, mode.value, seed.value);
  nextIndex.value = 0;
  errors.value = 0;
  elapsedMs.value = 0;
  summary.value = null;
  wrongValue.value = null;
  intervals.length = 0;
  inputMode.value = 'none';
  phase.value = 'presenting';
  liveMessage.value = '正在生成数字网格。';
  presentation.afterNextPaint((timestamp) => {
    if (phase.value !== 'presenting') return;
    phase.value = 'running';
    startedAt = timestamp;
    lastCorrectAt = timestamp;
    liveMessage.value = `本轮开始，下一个数字是 ${target.value}。`;
    stageRef.value?.focus();
  });
}

function selectCell(value: number, event: MouseEvent) {
  if (phase.value !== 'running') return;
  trackInput(event.detail === 0 ? 'keyboard' : 'pointer');
  const now = performance.now();
  elapsedMs.value = now - startedAt;

  if (value !== target.value) {
    errors.value++;
    wrongValue.value = value;
    clearWrongTimer();
    wrongTimer = window.setTimeout(() => {
      wrongValue.value = null;
      wrongTimer = null;
    }, 260);
    liveMessage.value = `错误，仍需寻找数字 ${target.value}。`;
    return;
  }

  intervals.push(now - lastCorrectAt);
  lastCorrectAt = now;
  nextIndex.value++;

  if (nextIndex.value === round.value.sequence.length) finishRound(now);
  else liveMessage.value = `正确，下一个数字是 ${target.value}。`;
}

function finishRound(now: number) {
  clearWrongTimer();
  wrongValue.value = null;
  phase.value = 'done';
  const half = Math.ceil(intervals.length / 2);
  const first = median(intervals.slice(0, half));
  const second = median(intervals.slice(half));
  const all = median(intervals);
  if (first === null || second === null || all === null) {
    phase.value = 'aborted';
    liveMessage.value = '本轮数据不完整，结果已作废。';
    return;
  }
  const nextSummary = {
    durationMs: now - startedAt,
    errors: errors.value,
    medianIntervalMs: all,
    lateDeltaMs: second - first,
  };
  elapsedMs.value = nextSummary.durationMs;
  summary.value = nextSummary;
  liveMessage.value = `本轮完成，用时 ${(nextSummary.durationMs / 1000).toFixed(2)} 秒，错误 ${nextSummary.errors} 次。`;
  nextTick(() => stageRef.value?.focus());
  saveResult({
    schemaVersion: 1,
    taskId: 'schulte',
    completedAt: new Date().toISOString(),
    durationMs: nextSummary.durationMs,
    seed: seed.value,
    variant: mode.value,
    inputMode: inputMode.value,
    metrics: {
      errors: nextSummary.errors,
      medianIntervalMs: nextSummary.medianIntervalMs,
      lateDeltaMs: nextSummary.lateDeltaMs,
    },
    parameters: { size: size.value, mode: mode.value },
  });
}

function abortIfHidden() {
  if (document.hidden && active.value) {
    presentation.cancel();
    clearWrongTimer();
    wrongValue.value = null;
    phase.value = 'aborted';
    summary.value = null;
    liveMessage.value = '页面失去可见性，本轮已作废；请重新开始。';
  }
}

watch([size, mode], ([nextSize, nextMode]) => {
  if (active.value) return;
  seed.value = 1;
  round.value = createSchulteRound(nextSize, nextMode, seed.value);
  nextIndex.value = 0;
  errors.value = 0;
  elapsedMs.value = 0;
  summary.value = null;
  wrongValue.value = null;
  phase.value = 'ready';
  liveMessage.value = `预览已更新为 ${nextSize} 乘 ${nextSize}，${modeLabel.value}。`;
});

onMounted(() => document.addEventListener('visibilitychange', abortIfHidden));
onUnmounted(() => {
  presentation.cancel();
  clearWrongTimer();
  document.removeEventListener('visibilitychange', abortIfHidden);
});
</script>

<template>
  <TrainingShell
    title="数字顺序搜索"
    en-title="Schulte Grid"
    description="在随机网格中按规则寻找数字。经典舒尔特表在这里被准确地描述为顺序视觉搜索，而不是“前额叶训练”。"
    accent="#0f766e"
    dark-accent="#5eead4"
  >
    <section ref="stageRef" class="exercise-stage" tabindex="0" aria-label="数字顺序搜索训练区">
      <div class="control-row">
        <div class="control-group">
          <label class="control-field">网格
            <select v-model.number="size" :disabled="active">
              <option v-for="value in [3, 4, 5, 6]" :key="value" :value="value">{{ value }} × {{ value }}</option>
            </select>
          </label>
          <label class="control-field">规则
            <select v-model="mode" :disabled="active">
              <option value="ascending">1 → N</option>
              <option value="descending">N → 1</option>
              <option value="alternating">1 → N → 2 → N−1</option>
            </select>
          </label>
        </div>
        <button class="primary-button" type="button" @click="startRound">
          {{ active ? '重新生成' : phase === 'done' ? '再来一局' : '开始' }}
        </button>
      </div>

      <p class="status-line">
        <span>规则 <strong>{{ modeLabel }}</strong></span>
        <span>下一个 <strong>{{ target ?? '完成' }}</strong></span>
        <span>错误 <strong>{{ errors }}</strong></span>
        <span>用时 <strong>{{ (elapsedMs / 1000).toFixed(2) }} s</strong></span>
      </p>

      <div class="schulte-grid" :style="gridStyle" :aria-label="`${round.size} 乘 ${round.size} 数字网格`">
        <button
          v-for="value in round.cells"
          :key="value"
          class="schulte-cell"
          :class="{ 'is-wrong': wrongValue === value }"
          :disabled="phase !== 'running'"
          type="button"
          :aria-label="`数字 ${value}`"
          @click="selectCell(value, $event)"
        >{{ value }}</button>
      </div>

      <p class="sr-only" role="status" aria-atomic="true">{{ liveMessage }}</p>
      <p class="task-instructions schulte-note">先求准确，再求速度。中心注视只能由眼动仪验证，因此这里不声称训练或测量“周边视野”。</p>
      <p v-if="phase === 'aborted'" class="feedback is-error">页面失去可见性，本轮已作废；请重新开始。</p>

      <div v-if="summary" class="metric-grid" aria-live="polite">
        <div class="metric"><span>完成时间</span><strong>{{ (summary.durationMs / 1000).toFixed(2) }} s</strong></div>
        <div class="metric"><span>错误点击</span><strong>{{ summary.errors }}</strong></div>
        <div class="metric"><span>中位间隔</span><strong>{{ Math.round(summary.medianIntervalMs) }} ms</strong></div>
        <div class="metric"><span>后半程变化</span><strong>{{ summary.lateDeltaMs >= 0 ? '+' : '' }}{{ Math.round(summary.lateDeltaMs) }} ms</strong></div>
      </div>
    </section>
  </TrainingShell>
</template>

<style scoped src="../../shared/TrainingExercise.css"></style>
<style scoped>
.schulte-grid {
  display: grid;
  width: min(100%, 560px);
  margin: 0 auto;
  gap: clamp(4px, 1vw, 9px);
  aspect-ratio: 1;
}

.schulte-cell {
  min-width: 0;
  min-height: 44px;
  padding: 0;
  border-radius: 9px;
  font: 680 clamp(1rem, 4vw, 1.6rem)/1 ui-monospace, SFMono-Regular, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

.schulte-cell.is-wrong {
  border-color: var(--vp-c-danger-1);
  color: var(--vp-c-danger-1);
}

.schulte-note {
  max-width: 68ch;
  margin: 20px auto 0;
  font-size: 0.8rem;
}
</style>
