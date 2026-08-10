<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { saveResult } from '../../persistence';
import { createSeed } from '../../rng';
import { dPrime, median } from '../../statistics';
import TrainingShell from '../../shared/TrainingShell.vue';
import { createPresentationScheduler } from '../../shared/presentation';
import { createNBackSequence, type NBackSequence } from './core';

type Phase = 'ready' | 'countdown' | 'presenting' | 'stimulus' | 'feedback' | 'done' | 'aborted';
type TrackedInput = 'none' | 'keyboard' | 'pointer' | 'mixed';
interface Response { target: boolean; answer: boolean | null; correct: boolean; responseMs: number | null }
interface Summary { accuracy: number; dPrime: number | null; medianMs: number | null; hits: number; falseAlarms: number; omissions: number }

const stageRef = ref<HTMLElement | null>(null);
const assistNextRef = ref<HTMLButtonElement | null>(null);
const n = ref(2);
const trialCount = ref(28);
const phase = ref<Phase>('ready');
const countdown = ref(3);
const index = ref(0);
const feedback = ref('');
const inputMode = ref<TrackedInput>('none');
const accessibleMode = ref(false);
const liveMessage = ref('设置规则和序列长度后开始。');
const summary = ref<Summary | null>(null);
const seed = ref(1);
const sequence = ref<NBackSequence>(createNBackSequence(n.value, trialCount.value, seed.value));
const responses: Response[] = [];
const timers = new Set<number>();
const presentation = createPresentationScheduler();
let shownAt = 0;
let roundStartedAt = 0;

const active = computed(() => ['countdown', 'presenting', 'stimulus', 'feedback'].includes(phase.value));
const position = computed(() => ['presenting', 'stimulus'].includes(phase.value) ? sequence.value.positions[index.value] : -1);
const target = computed(() => sequence.value.targets[index.value] === 1);
const isWarmup = computed(() => index.value < n.value);

function schedule(callback: () => void, delay: number) { const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay); timers.add(id); }
function clearTimers() { for (const id of timers) window.clearTimeout(id); timers.clear(); }
function trackInput(next: 'keyboard' | 'pointer') { if (inputMode.value === 'none') inputMode.value = next; else if (inputMode.value !== next) inputMode.value = 'mixed'; }

function startRound() {
  clearTimers();
  presentation.cancel();
  seed.value = createSeed();
  sequence.value = createNBackSequence(n.value, trialCount.value, seed.value);
  responses.length = 0;
  summary.value = null;
  inputMode.value = 'none';
  index.value = 0;
  countdown.value = 3;
  feedback.value = '记住出现的位置。';
  liveMessage.value = accessibleMode.value
    ? '无时限辅助模式已开启。观察项和作答后都使用下一项按钮继续。'
    : '倒计时开始，记住出现的位置。';
  phase.value = 'countdown';
  nextTick(() => stageRef.value?.focus());
  countdownTick();
}
function countdownTick() {
  if (countdown.value > 1) schedule(() => { countdown.value--; countdownTick(); }, 650);
  else schedule(() => { countdown.value = 0; showTrial(); }, 650);
}
function showTrial() {
  presentation.cancel();
  phase.value = 'presenting';
  feedback.value = isWarmup.value ? `观察：还需 ${n.value - index.value} 个位置` : '';
  presentation.afterNextPaint((timestamp) => {
    if (phase.value !== 'presenting') return;
    shownAt = timestamp;
    if (index.value === 0) roundStartedAt = timestamp;
    phase.value = 'stimulus';
    const row = Math.floor(position.value / 3) + 1;
    const column = position.value % 3 + 1;
    liveMessage.value = isWarmup.value
      ? `观察项 ${index.value + 1}，第 ${row} 行第 ${column} 列。`
      : `第 ${index.value + 1} 项，第 ${row} 行第 ${column} 列。请选择匹配或不匹配。`;
    if (accessibleMode.value) {
      if (isWarmup.value) nextTick(() => assistNextRef.value?.focus());
      else stageRef.value?.focus();
    }
    if (!accessibleMode.value) {
      if (isWarmup.value) schedule(advance, 900);
      else schedule(() => respond(null), 1_800);
    }
  });
}
function respond(answer: boolean | null, source?: 'keyboard' | 'pointer') {
  if (phase.value !== 'stimulus' || isWarmup.value) return;
  clearTimers();
  if (source) trackInput(source);
  const responseMs = answer === null || accessibleMode.value ? null : performance.now() - shownAt;
  const correct = answer !== null && answer === target.value;
  responses.push({ target: target.value, answer, correct, responseMs });
  phase.value = 'feedback';
  feedback.value = answer === null ? '超时' : correct ? '正确' : target.value ? '漏报匹配' : '误报匹配';
  liveMessage.value = `${feedback.value}。${accessibleMode.value ? '使用下一项按钮继续。' : ''}`;
  if (accessibleMode.value) nextTick(() => assistNextRef.value?.focus());
  else schedule(advance, 250);
}
function advance() {
  if (index.value + 1 >= sequence.value.positions.length) finishRound();
  else { index.value++; showTrial(); }
}
function finishRound() {
  clearTimers();
  phase.value = 'done';
  const answered = responses.filter((item) => item.answer !== null);
  const hits = answered.filter((item) => item.target && item.answer === true).length;
  const targets = answered.filter((item) => item.target).length;
  const falseAlarms = answered.filter((item) => !item.target && item.answer === true).length;
  const nonTargets = answered.length - targets;
  const omissions = responses.length - answered.length;
  const responseTimes = responses.filter((item) => item.correct && item.responseMs !== null).map((item) => item.responseMs!);
  const dPrimeValue = omissions === 0 ? dPrime(hits, targets, falseAlarms, nonTargets) : null;
  const medianMs = median(responseTimes);
  summary.value = { accuracy: responses.filter((item) => item.correct).length / responses.length, dPrime: dPrimeValue, medianMs, hits, falseAlarms, omissions };
  feedback.value = omissions === 0
    ? '本轮完成。d′ 同时考虑命中与误报，但不等于记忆容量或 IQ。'
    : '本轮有超时；为避免选择性漏答夸大结果，本轮不计算 d′。';
  saveResult({
    schemaVersion: 1, taskId: 'n-back', completedAt: new Date().toISOString(), durationMs: performance.now() - roundStartedAt,
    seed: seed.value, variant: `${n.value}-back`, inputMode: inputMode.value,
    metrics: { accuracy: summary.value.accuracy, ...(dPrimeValue === null ? {} : { dPrime: dPrimeValue }), ...(medianMs === null ? {} : { medianMs }), hits, falseAlarms, omissions },
    parameters: { n: n.value, trialCount: trialCount.value, targetRate: 0.3, timeoutMs: accessibleMode.value ? 0 : 1800, accessibleMode: accessibleMode.value },
  });
  liveMessage.value = `本轮完成，准确率 ${(summary.value.accuracy * 100).toFixed(1)}%。`;
  if (accessibleMode.value) nextTick(() => stageRef.value?.focus());
}
function handleKey(event: KeyboardEvent) {
  if (phase.value !== 'stimulus' || isWarmup.value) return;
  if (['f', 'F', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); respond(false, 'keyboard'); }
  else if (['j', 'J', 'ArrowRight', ' '].includes(event.key)) { event.preventDefault(); respond(true, 'keyboard'); }
}
function pointerResponse(answer: boolean) { respond(answer, 'pointer'); }
function abortIfHidden() { if (document.hidden && active.value) { clearTimers(); presentation.cancel(); phase.value = 'aborted'; feedback.value = '页面失去可见性，本轮已作废；请重新开始。'; liveMessage.value = feedback.value; } }
onMounted(() => document.addEventListener('visibilitychange', abortIfHidden));
onUnmounted(() => { clearTimers(); presentation.cancel(); document.removeEventListener('visibilitychange', abortIfHidden); });
</script>

<template>
  <TrainingShell title="位置更新" en-title="Spatial N-back" description="判断当前亮起的位置是否与前第 n 个刺激相同。练习主要改善本任务及结构相近任务，不承诺一般记忆或智力迁移。" accent="#7c3aed" dark-accent="#c4b5fd">
    <section ref="stageRef" class="exercise-stage" tabindex="0" aria-label="位置 n-back 训练区" @keydown="handleKey">
      <div class="control-row">
        <div class="control-group">
          <label class="control-field">难度<select v-model.number="n" :disabled="active"><option :value="1">1-back</option><option :value="2">2-back</option><option :value="3">3-back</option></select></label>
          <label class="control-field">序列长度<select v-model.number="trialCount" :disabled="active"><option :value="24">24</option><option :value="28">28</option><option :value="36">36</option></select></label>
          <label class="assist-field"><input v-model="accessibleMode" type="checkbox" :disabled="active">屏幕阅读器模式 · 无时限</label>
        </div>
        <button class="primary-button" type="button" @click="startRound">{{ active ? '重新开始' : phase === 'done' ? '再测一轮' : '开始' }}</button>
      </div>

      <p class="status-line"><span>进度 <strong>{{ active || phase === 'done' ? Math.min(index + 1, trialCount) : 0 }} / {{ trialCount }}</strong></span><span>当前规则 <strong>{{ n }}-back</strong></span></p>

      <div v-if="phase === 'countdown'" class="nback-countdown">{{ countdown }}</div>
      <div v-else class="nback-grid" aria-hidden="true">
        <span v-for="cell in 9" :key="cell" :class="{ 'is-active': position === cell - 1 }"></span>
      </div>

      <p class="task-instructions">前 {{ n }} 个位置用于观察；之后每次都必须回答。F/左表示“不匹配”，J/右/空格表示“匹配”。</p>
      <div class="choice-row">
        <button class="choice-button" type="button" :disabled="phase !== 'stimulus' || isWarmup" @click="pointerResponse(false)">F / ← 不匹配</button>
        <button class="choice-button" type="button" :disabled="phase !== 'stimulus' || isWarmup" @click="pointerResponse(true)">J / → 匹配</button>
      </div>
      <button v-if="accessibleMode && ((phase === 'stimulus' && isWarmup) || phase === 'feedback')" ref="assistNextRef" class="assist-next" type="button" @click="advance">{{ phase === 'feedback' && index + 1 >= sequence.positions.length ? '查看结果' : '下一项' }}</button>
      <p class="feedback" :class="{ 'is-correct': feedback === '正确', 'is-error': ['超时', '漏报匹配', '误报匹配'].includes(feedback) }">{{ feedback }}</p>
      <p class="sr-only" role="status" aria-atomic="true">{{ liveMessage }}</p>

      <div v-if="summary" class="metric-grid" aria-live="polite">
        <div class="metric"><span>准确率</span><strong>{{ (summary.accuracy * 100).toFixed(1) }}%</strong></div>
        <div class="metric"><span>d′</span><strong>{{ summary.dPrime === null ? '—' : summary.dPrime.toFixed(2) }}</strong></div>
        <div class="metric"><span>正确反应中位数</span><strong>{{ summary.medianMs === null ? '—' : `${Math.round(summary.medianMs)} ms` }}</strong></div>
        <div class="metric"><span>误报 / 超时</span><strong>{{ summary.falseAlarms }} / {{ summary.omissions }}</strong></div>
      </div>
    </section>
  </TrainingShell>
</template>

<style scoped src="../../shared/TrainingExercise.css"></style>
<style scoped>
.nback-grid { display: grid; width: min(72vw, 330px); margin: 20px auto 26px; grid-template-columns: repeat(3, 1fr); gap: 10px; aspect-ratio: 1; }
.nback-grid span { border: 1px solid color-mix(in srgb, var(--vp-c-text-2) 38%, var(--vp-c-divider)); border-radius: 12px; background: var(--vp-c-bg); }
.nback-grid span.is-active { border-color: var(--training-accent); background: var(--training-accent); box-shadow: 0 0 0 6px color-mix(in srgb, var(--training-accent) 12%, transparent); }
.nback-countdown { display: grid; min-height: 360px; place-items: center; color: var(--training-accent); font: 720 5rem/1 ui-monospace, monospace; }
@media (prefers-reduced-motion: no-preference) { .nback-grid span.is-active { animation: stimulus-in 120ms ease-out; } }
@keyframes stimulus-in { from { transform: scale(0.9); opacity: 0.4; } }
</style>
