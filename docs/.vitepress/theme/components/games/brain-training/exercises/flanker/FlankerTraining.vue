<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { saveResult } from '../../persistence';
import { createSeed } from '../../rng';
import { median } from '../../statistics';
import TrainingShell from '../../shared/TrainingShell.vue';
import { createPresentationScheduler } from '../../shared/presentation';
import { createFlankerTrials, flankerGlyph, type BinaryDirection, type FlankerTrial } from './core';

type Phase = 'ready' | 'countdown' | 'presenting' | 'stimulus' | 'feedback' | 'done' | 'aborted';
type TrackedInput = 'none' | 'keyboard' | 'pointer' | 'mixed';
interface Response { congruent: boolean; correct: boolean; omitted: boolean; responseMs: number | null }
interface Summary { accuracy: number; congruentMs: number | null; incongruentMs: number | null; conflictMs: number | null; omissions: number }

const stageRef = ref<HTMLElement | null>(null);
const assistNextRef = ref<HTMLButtonElement | null>(null);
const trialCount = ref(24);
const phase = ref<Phase>('ready');
const countdown = ref(3);
const index = ref(0);
const feedback = ref('');
const inputMode = ref<TrackedInput>('none');
const accessibleMode = ref(false);
const liveMessage = ref('设置试次数后开始。');
const summary = ref<Summary | null>(null);
const seed = ref(createSeed());
const trials = ref<FlankerTrial[]>([]);
const responses: Response[] = [];
const timers = new Set<number>();
const presentation = createPresentationScheduler();
let shownAt = 0;
let roundStartedAt = 0;

const current = computed(() => trials.value[index.value] ?? null);
const glyph = computed(() => (current.value ? flankerGlyph(current.value) : '•••••'));
const active = computed(() => ['countdown', 'presenting', 'stimulus', 'feedback'].includes(phase.value));

function schedule(callback: () => void, delay: number) {
  const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay);
  timers.add(id);
}
function clearTimers() { for (const id of timers) window.clearTimeout(id); timers.clear(); }
function trackInput(next: 'keyboard' | 'pointer') {
  if (inputMode.value === 'none') inputMode.value = next;
  else if (inputMode.value !== next) inputMode.value = 'mixed';
}

function startRound() {
  clearTimers();
  presentation.cancel();
  seed.value = createSeed();
  trials.value = createFlankerTrials(trialCount.value, seed.value);
  responses.length = 0;
  summary.value = null;
  inputMode.value = 'none';
  index.value = 0;
  countdown.value = 3;
  feedback.value = '把注意放在正中央。';
  liveMessage.value = accessibleMode.value
    ? '无时限辅助模式已开启。每题作答后使用下一题按钮继续。'
    : '倒计时开始，把注意放在正中央。';
  phase.value = 'countdown';
  nextTick(() => stageRef.value?.focus());
  countdownTick();
}

function countdownTick() {
  if (countdown.value > 1) {
    schedule(() => { countdown.value--; countdownTick(); }, 650);
  } else {
    schedule(() => { countdown.value = 0; showTrial(); }, 650);
  }
}

function showTrial() {
  presentation.cancel();
  phase.value = 'presenting';
  feedback.value = '';
  presentation.afterNextPaint((timestamp) => {
    if (phase.value !== 'presenting' || !current.value) return;
    shownAt = timestamp;
    if (index.value === 0) roundStartedAt = timestamp;
    phase.value = 'stimulus';
    liveMessage.value = `第 ${index.value + 1} 题，中央箭头向${current.value.target === 0 ? '左' : '右'}。`;
    if (accessibleMode.value) stageRef.value?.focus();
    if (!accessibleMode.value) schedule(() => respond(null), 1_800);
  });
}

function respond(answer: BinaryDirection | null, source?: 'keyboard' | 'pointer') {
  if (phase.value !== 'stimulus' || !current.value) return;
  clearTimers();
  if (source) trackInput(source);
  const responseMs = answer === null || accessibleMode.value ? null : performance.now() - shownAt;
  const correct = answer !== null && answer === current.value.target;
  responses.push({ congruent: current.value.congruent, correct, omitted: answer === null, responseMs });
  phase.value = 'feedback';
  feedback.value = answer === null ? '超时' : correct ? '正确' : '方向错误';
  liveMessage.value = `${feedback.value}。${accessibleMode.value ? '使用下一题按钮继续。' : ''}`;
  if (accessibleMode.value) nextTick(() => assistNextRef.value?.focus());
  else schedule(advance, 230);
}

function advance() {
  if (index.value + 1 >= trials.value.length) finishRound();
  else { index.value++; showTrial(); }
}

function finishRound() {
  clearTimers();
  phase.value = 'done';
  const congruent = responses.filter((item) => item.congruent && item.correct && item.responseMs !== null).map((item) => item.responseMs!);
  const incongruent = responses.filter((item) => !item.congruent && item.correct && item.responseMs !== null).map((item) => item.responseMs!);
  const congruentMs = congruent.length > 0 ? median(congruent) : null;
  const incongruentMs = incongruent.length > 0 ? median(incongruent) : null;
  const conflictMs = congruentMs === null || incongruentMs === null ? null : incongruentMs - congruentMs;
  summary.value = {
    accuracy: responses.filter((item) => item.correct).length / responses.length,
    congruentMs,
    incongruentMs,
    conflictMs,
    omissions: responses.filter((item) => item.omitted).length,
  };
  feedback.value = accessibleMode.value
    ? '本轮完成。屏幕阅读器模式无时限，本轮不计算冲突反应时差值。'
    : conflictMs === null
      ? '正确试次不足，本轮不计算冲突差值。'
      : '本轮完成。冲突差值需与准确率一起解释。';
  saveResult({
    schemaVersion: 1,
    taskId: 'flanker',
    completedAt: new Date().toISOString(),
    durationMs: performance.now() - roundStartedAt,
    seed: seed.value,
    variant: 'arrow-flanker',
    inputMode: inputMode.value,
    metrics: {
      accuracy: summary.value.accuracy,
      ...(congruentMs === null ? {} : { congruentMs }),
      ...(incongruentMs === null ? {} : { incongruentMs }),
      ...(conflictMs === null ? {} : { conflictMs }),
      omissions: summary.value.omissions,
    },
    parameters: { trialCount: trialCount.value, timeoutMs: accessibleMode.value ? 0 : 1800, accessibleMode: accessibleMode.value },
  });
  liveMessage.value = `本轮完成，准确率 ${(summary.value.accuracy * 100).toFixed(1)}%。`;
  if (accessibleMode.value) nextTick(() => stageRef.value?.focus());
}

function handleKey(event: KeyboardEvent) {
  if (phase.value !== 'stimulus') return;
  if (['ArrowLeft', 'f', 'F'].includes(event.key)) { event.preventDefault(); respond(0, 'keyboard'); }
  else if (['ArrowRight', 'j', 'J'].includes(event.key)) { event.preventDefault(); respond(1, 'keyboard'); }
}
function pointerResponse(answer: BinaryDirection) { respond(answer, 'pointer'); }
function abortIfHidden() {
  if (document.hidden && active.value) {
    clearTimers();
    presentation.cancel();
    phase.value = 'aborted';
    feedback.value = '页面失去可见性，本轮已作废；请重新开始。';
    liveMessage.value = feedback.value;
  }
}
onMounted(() => document.addEventListener('visibilitychange', abortIfHidden));
onUnmounted(() => { clearTimers(); presentation.cancel(); document.removeEventListener('visibilitychange', abortIfHidden); });
</script>

<template>
  <TrainingShell title="箭头冲突" en-title="Flanker Task" description="判断中央箭头指向，忽略两侧箭头。稳定的是任务中的冲突效应，而不是一个可诊断个人的“抑制力指数”。" accent="#2563eb" dark-accent="#93c5fd">
    <section ref="stageRef" class="exercise-stage" tabindex="0" aria-label="箭头冲突训练区" @keydown="handleKey">
      <div class="control-row">
        <div class="control-group">
          <label class="control-field">试次数
            <select v-model.number="trialCount" :disabled="active"><option :value="24">24</option><option :value="40">40</option><option :value="60">60</option></select>
          </label>
          <label class="assist-field"><input v-model="accessibleMode" type="checkbox" :disabled="active">屏幕阅读器模式 · 无时限</label>
        </div>
        <button class="primary-button" type="button" @click="startRound">{{ active ? '重新开始' : phase === 'done' ? '再测一轮' : '开始' }}</button>
      </div>

      <p class="status-line"><span>进度 <strong>{{ active || phase === 'done' ? Math.min(index + 1, trialCount) : 0 }} / {{ trialCount }}</strong></span><span>按键 <strong>F / J 或 ← / →</strong></span></p>

      <div class="flanker-display" :class="{ 'is-muted': !['presenting', 'stimulus'].includes(phase) }" aria-hidden="true">
        <span v-if="phase === 'countdown'" class="countdown">{{ countdown }}</span><span v-else>{{ glyph }}</span>
      </div>

      <p class="task-instructions">只看中间一支箭头；左右按钮分别对应中央箭头的方向。速度和准确率同等重要。</p>
      <div class="choice-row">
        <button class="choice-button" type="button" :disabled="phase !== 'stimulus'" @click="pointerResponse(0)">F / ← 向左</button>
        <button class="choice-button" type="button" :disabled="phase !== 'stimulus'" @click="pointerResponse(1)">J / → 向右</button>
      </div>
      <button v-if="accessibleMode && phase === 'feedback'" ref="assistNextRef" class="assist-next" type="button" @click="advance">{{ index + 1 >= trials.length ? '查看结果' : '下一题' }}</button>
      <p class="feedback" :class="{ 'is-correct': feedback === '正确', 'is-error': feedback === '方向错误' || feedback === '超时' }">{{ feedback }}</p>
      <p class="sr-only" role="status" aria-atomic="true">{{ liveMessage }}</p>

      <div v-if="summary" class="metric-grid" aria-live="polite">
        <div class="metric"><span>准确率</span><strong>{{ (summary.accuracy * 100).toFixed(1) }}%</strong></div>
        <div class="metric"><span>一致条件</span><strong>{{ summary.congruentMs === null ? '—' : `${Math.round(summary.congruentMs)} ms` }}</strong></div>
        <div class="metric"><span>冲突条件</span><strong>{{ summary.incongruentMs === null ? '—' : `${Math.round(summary.incongruentMs)} ms` }}</strong></div>
        <div class="metric"><span>冲突差值</span><strong>{{ summary.conflictMs === null ? '—' : `${summary.conflictMs >= 0 ? '+' : ''}${Math.round(summary.conflictMs)} ms` }}</strong></div>
      </div>
    </section>
  </TrainingShell>
</template>

<style scoped src="../../shared/TrainingExercise.css"></style>
<style scoped>
.flanker-display { display: grid; min-height: 190px; place-items: center; color: var(--vp-c-text-1); font: 720 clamp(2.8rem, 13vw, 7.2rem)/1 ui-monospace, monospace; letter-spacing: 0.02em; white-space: nowrap; }
.flanker-display.is-muted { color: var(--vp-c-text-3); }
.countdown { color: var(--training-accent); font-size: 0.72em; }
</style>
