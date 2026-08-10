<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { saveResult } from '../../persistence';
import { createSeed } from '../../rng';
import { median } from '../../statistics';
import TrainingShell from '../../shared/TrainingShell.vue';
import { createPresentationScheduler } from '../../shared/presentation';
import { createSwitchingTrials, ruleLabel, type BinaryChoice, type SwitchingTrial } from './core';

type Phase = 'ready' | 'countdown' | 'presenting' | 'stimulus' | 'feedback' | 'done' | 'aborted';
type TrackedInput = 'none' | 'keyboard' | 'pointer' | 'mixed';
interface Response { switched: boolean; comparable: boolean; correct: boolean; omitted: boolean; responseMs: number | null }
interface Summary { accuracy: number; repeatMs: number | null; switchMs: number | null; switchCostMs: number | null; omissions: number }

const stageRef = ref<HTMLElement | null>(null);
const assistNextRef = ref<HTMLButtonElement | null>(null);
const trialCount = ref(32);
const phase = ref<Phase>('ready');
const countdown = ref(3);
const index = ref(0);
const feedback = ref('');
const inputMode = ref<TrackedInput>('none');
const accessibleMode = ref(false);
const liveMessage = ref('设置试次数后开始。');
const summary = ref<Summary | null>(null);
const seed = ref(createSeed());
const trials = ref<SwitchingTrial[]>([]);
const responses: Response[] = [];
const timers = new Set<number>();
const presentation = createPresentationScheduler();
let shownAt = 0;
let roundStartedAt = 0;

const current = computed(() => trials.value[index.value] ?? null);
const active = computed(() => ['countdown', 'presenting', 'stimulus', 'feedback'].includes(phase.value));

function schedule(callback: () => void, delay: number) { const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay); timers.add(id); }
function clearTimers() { for (const id of timers) window.clearTimeout(id); timers.clear(); }
function trackInput(next: 'keyboard' | 'pointer') { if (inputMode.value === 'none') inputMode.value = next; else if (inputMode.value !== next) inputMode.value = 'mixed'; }

function startRound() {
  clearTimers();
  presentation.cancel();
  seed.value = createSeed();
  trials.value = createSwitchingTrials(trialCount.value, seed.value);
  responses.length = 0;
  summary.value = null;
  inputMode.value = 'none';
  index.value = 0;
  countdown.value = 3;
  feedback.value = '先看规则，再看数字。';
  liveMessage.value = accessibleMode.value
    ? '无时限辅助模式已开启。每题作答后使用下一题按钮继续。'
    : '倒计时开始，先看规则，再看数字。';
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
  feedback.value = '';
  presentation.afterNextPaint((timestamp) => {
    if (phase.value !== 'presenting' || !current.value) return;
    shownAt = timestamp;
    if (index.value === 0) roundStartedAt = timestamp;
    phase.value = 'stimulus';
    liveMessage.value = `第 ${index.value + 1} 题，${ruleLabel(current.value.rule)}，数字 ${current.value.digit}。${current.value.rule === 0 ? 'F 是奇数，J 是偶数。' : 'F 是小于五，J 是大于五。'}`;
    if (accessibleMode.value) stageRef.value?.focus();
    if (!accessibleMode.value) schedule(() => respond(null), 2_200);
  });
}
function respond(answer: BinaryChoice | null, source?: 'keyboard' | 'pointer') {
  if (phase.value !== 'stimulus' || !current.value) return;
  clearTimers();
  if (source) trackInput(source);
  const responseMs = answer === null || accessibleMode.value ? null : performance.now() - shownAt;
  const correct = answer !== null && answer === current.value.answer;
  responses.push({ switched: current.value.switched, comparable: index.value > 0, correct, omitted: answer === null, responseMs });
  phase.value = 'feedback';
  feedback.value = answer === null ? '超时' : correct ? '正确' : '规则或按键错误';
  liveMessage.value = `${feedback.value}。${accessibleMode.value ? '使用下一题按钮继续。' : ''}`;
  if (accessibleMode.value) nextTick(() => assistNextRef.value?.focus());
  else schedule(advance, 240);
}
function advance() { if (index.value + 1 >= trials.value.length) finishRound(); else { index.value++; showTrial(); } }
function finishRound() {
  clearTimers();
  phase.value = 'done';
  const repeat = responses.filter((item) => item.comparable && !item.switched && item.correct && item.responseMs !== null).map((item) => item.responseMs!);
  const switched = responses.filter((item) => item.switched && item.correct && item.responseMs !== null).map((item) => item.responseMs!);
  const repeatMs = repeat.length > 0 ? median(repeat) : null;
  const switchMs = switched.length > 0 ? median(switched) : null;
  const switchCostMs = repeatMs === null || switchMs === null ? null : switchMs - repeatMs;
  summary.value = { accuracy: responses.filter((item) => item.correct).length / responses.length, repeatMs, switchMs, switchCostMs, omissions: responses.filter((item) => item.omitted).length };
  feedback.value = accessibleMode.value
    ? '本轮完成。屏幕阅读器模式无时限，本轮不计算切换反应时成本。'
    : switchCostMs === null
      ? '正确试次不足，本轮不计算切换成本。'
      : '本轮完成。切换成本同时受规则保持、线索识别和反应映射影响。';
  saveResult({
    schemaVersion: 1, taskId: 'task-switching', completedAt: new Date().toISOString(), durationMs: performance.now() - roundStartedAt,
    seed: seed.value, variant: 'parity-magnitude', inputMode: inputMode.value,
    metrics: {
      accuracy: summary.value.accuracy,
      ...(repeatMs === null ? {} : { repeatMs }),
      ...(switchMs === null ? {} : { switchMs }),
      ...(switchCostMs === null ? {} : { switchCostMs }),
      omissions: summary.value.omissions,
    },
    parameters: { trialCount: trialCount.value, timeoutMs: accessibleMode.value ? 0 : 2200, accessibleMode: accessibleMode.value },
  });
  liveMessage.value = `本轮完成，准确率 ${(summary.value.accuracy * 100).toFixed(1)}%。`;
  if (accessibleMode.value) nextTick(() => stageRef.value?.focus());
}
function handleKey(event: KeyboardEvent) {
  if (phase.value !== 'stimulus') return;
  if (['f', 'F', 'ArrowLeft'].includes(event.key)) { event.preventDefault(); respond(0, 'keyboard'); }
  else if (['j', 'J', 'ArrowRight'].includes(event.key)) { event.preventDefault(); respond(1, 'keyboard'); }
}
function pointerResponse(answer: BinaryChoice) { respond(answer, 'pointer'); }
function abortIfHidden() { if (document.hidden && active.value) { clearTimers(); presentation.cancel(); phase.value = 'aborted'; feedback.value = '页面失去可见性，本轮已作废；请重新开始。'; liveMessage.value = feedback.value; } }
onMounted(() => document.addEventListener('visibilitychange', abortIfHidden));
onUnmounted(() => { clearTimers(); presentation.cancel(); document.removeEventListener('visibilitychange', abortIfHidden); });
</script>

<template>
  <TrainingShell title="规则切换" en-title="Task Switching" description="根据线索在奇偶与大小判断之间切换。显示的是任务切换成本，不把差值包装成稳定的“思维灵活度”。" accent="#b45309" dark-accent="#fdba74">
    <section ref="stageRef" class="exercise-stage" tabindex="0" aria-label="规则切换训练区" @keydown="handleKey">
      <div class="control-row">
        <div class="control-group">
          <label class="control-field">试次数<select v-model.number="trialCount" :disabled="active"><option :value="24">24</option><option :value="32">32</option><option :value="48">48</option></select></label>
          <label class="assist-field"><input v-model="accessibleMode" type="checkbox" :disabled="active">屏幕阅读器模式 · 无时限</label>
        </div>
        <button class="primary-button" type="button" @click="startRound">{{ active ? '重新开始' : phase === 'done' ? '再测一轮' : '开始' }}</button>
      </div>

      <p class="status-line"><span>进度 <strong>{{ active || phase === 'done' ? Math.min(index + 1, trialCount) : 0 }} / {{ trialCount }}</strong></span><span>固定映射 <strong>F / J</strong></span></p>

      <div class="switch-display" :class="{ 'is-muted': !['presenting', 'stimulus'].includes(phase) }" aria-hidden="true">
        <template v-if="phase === 'countdown'"><span class="switch-countdown">{{ countdown }}</span></template>
        <template v-else-if="current"><span class="rule-cue">{{ ruleLabel(current.rule) }}</span><strong>{{ current.digit }}</strong><span class="trial-kind">{{ index === 0 ? '起始' : current.switched ? '切换' : '重复' }}</span></template>
        <template v-else><span class="rule-cue">等待开始</span><strong>·</strong></template>
      </div>

      <p class="task-instructions"><strong>奇偶：</strong>F=奇数，J=偶数。<strong>大小：</strong>F=&lt;5，J=&gt;5。数字 5 不出现。</p>
      <div class="choice-row">
        <button class="choice-button" type="button" :disabled="phase !== 'stimulus'" @click="pointerResponse(0)">F / ← 奇数 · &lt;5</button>
        <button class="choice-button" type="button" :disabled="phase !== 'stimulus'" @click="pointerResponse(1)">J / → 偶数 · &gt;5</button>
      </div>
      <button v-if="accessibleMode && phase === 'feedback'" ref="assistNextRef" class="assist-next" type="button" @click="advance">{{ index + 1 >= trials.length ? '查看结果' : '下一题' }}</button>
      <p class="feedback" :class="{ 'is-correct': feedback === '正确', 'is-error': feedback === '规则或按键错误' || feedback === '超时' }">{{ feedback }}</p>
      <p class="sr-only" role="status" aria-atomic="true">{{ liveMessage }}</p>

      <div v-if="summary" class="metric-grid" aria-live="polite">
        <div class="metric"><span>准确率</span><strong>{{ (summary.accuracy * 100).toFixed(1) }}%</strong></div>
        <div class="metric"><span>重复试次</span><strong>{{ summary.repeatMs === null ? '—' : `${Math.round(summary.repeatMs)} ms` }}</strong></div>
        <div class="metric"><span>切换试次</span><strong>{{ summary.switchMs === null ? '—' : `${Math.round(summary.switchMs)} ms` }}</strong></div>
        <div class="metric"><span>切换成本</span><strong>{{ summary.switchCostMs === null ? '—' : `${summary.switchCostMs >= 0 ? '+' : ''}${Math.round(summary.switchCostMs)} ms` }}</strong></div>
      </div>
    </section>
  </TrainingShell>
</template>

<style scoped src="../../shared/TrainingExercise.css"></style>
<style scoped>
.switch-display { display: grid; min-height: 240px; place-items: center; align-content: center; gap: 8px; color: var(--vp-c-text-1); }
.switch-display strong { font: 760 clamp(4.8rem, 18vw, 9rem)/0.9 ui-monospace, monospace; }
.switch-display.is-muted { color: var(--vp-c-text-3); }
.rule-cue { color: var(--training-accent); font-size: 0.82rem; font-weight: 760; letter-spacing: 0.08em; text-transform: uppercase; }
.trial-kind { color: var(--vp-c-text-3); font-size: 0.72rem; }
.switch-countdown { color: var(--training-accent); font: 720 5rem/1 ui-monospace, monospace; }
</style>
