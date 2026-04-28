<!--
  @file ZeroPlayerExperiment.vue
  @description Math Lab 零参与模拟实验通用外壳。
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { ExperimentSpec, RuntimeConfig, SimulationRuntime, StatItem } from './types';

const props = defineProps<{ spec: ExperimentSpec }>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const panelRef = ref<HTMLDivElement | null>(null);
const running = ref(false);
const generation = ref(0);
const speed = ref(1);
const seed = ref(20260428);
const preset = ref(props.spec.presets[0]?.id ?? 'default');
const pointerActive = ref(false);
const stats = ref<StatItem[]>([]);

const configValues = reactive<Record<string, number>>({});
for (const item of props.spec.controls ?? []) configValues[item.id] = item.value;

let runtime: SimulationRuntime = props.spec.create();
let ctx: CanvasRenderingContext2D | null = null;
let frameId: number | null = null;
let lastTime = 0;
let canvasWidth = 0;
let canvasHeight = props.spec.canvasHeight ?? 360;

const locked = computed(() => running.value || generation.value > 0);
const interval = computed(() => 160 / speed.value);
const speedOptions = [0.5, 1, 2, 4, 8];

function buildConfig(): RuntimeConfig {
  return {
    preset: preset.value,
    seed: seed.value,
    values: { ...configValues },
  };
}

function resizeCanvas() {
  if (!canvasRef.value || !panelRef.value) return;
  const dpr = window.devicePixelRatio || 1;
  canvasWidth = Math.max(280, Math.floor(panelRef.value.clientWidth));
  canvasHeight = props.spec.canvasHeight ?? 360;
  canvasRef.value.width = canvasWidth * dpr;
  canvasRef.value.height = canvasHeight * dpr;
  canvasRef.value.style.width = `${canvasWidth}px`;
  canvasRef.value.style.height = `${canvasHeight}px`;
  ctx = canvasRef.value.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!running.value && generation.value === 0) {
    reset(false);
  } else {
    runtime.resize?.(canvasWidth, canvasHeight);
    refresh();
  }
}

function refresh() {
  if (!ctx) return;
  runtime.draw(ctx, canvasWidth, canvasHeight);
  stats.value = runtime.stats();
}

function reset(stop = true) {
  if (stop) stopRun();
  generation.value = 0;
  runtime.reset(canvasWidth, canvasHeight, buildConfig());
  refresh();
}

function randomize() {
  if (running.value) return;
  seed.value = Math.floor(Math.random() * 2 ** 31);
  if (props.spec.presets.some((item) => item.id === 'random')) {
    preset.value = 'random';
  }
  reset();
}

function stepOnce() {
  const count = props.spec.stepsPerFrame ?? 1;
  for (let i = 0; i < count; i++) runtime.step();
  generation.value++;
  refresh();
}

function loop(timestamp: number) {
  if (!running.value) return;
  if (timestamp - lastTime >= interval.value) {
    stepOnce();
    lastTime = timestamp;
  }
  frameId = requestAnimationFrame(loop);
}

function startRun() {
  if (running.value) return;
  running.value = true;
  lastTime = performance.now();
  frameId = requestAnimationFrame(loop);
}

function stopRun() {
  running.value = false;
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
}

function toggleRun() {
  if (running.value) stopRun();
  else startRun();
}

function canvasPoint(event: PointerEvent) {
  if (!canvasRef.value) return null;
  const rect = canvasRef.value.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvasWidth,
    y: ((event.clientY - rect.top) / rect.height) * canvasHeight,
  };
}

function onPointerDown(event: PointerEvent) {
  if (locked.value || !runtime.pointerDown) return;
  const point = canvasPoint(event);
  if (!point) return;
  pointerActive.value = true;
  canvasRef.value?.setPointerCapture(event.pointerId);
  runtime.pointerDown(point.x, point.y);
  refresh();
}

function onPointerMove(event: PointerEvent) {
  if (!pointerActive.value || locked.value || !runtime.pointerMove) return;
  const point = canvasPoint(event);
  if (!point) return;
  runtime.pointerMove(point.x, point.y);
  refresh();
}

function onPointerUp(event: PointerEvent) {
  pointerActive.value = false;
  if (canvasRef.value?.hasPointerCapture(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId);
  }
}

watch([preset, seed, () => ({ ...configValues })], () => {
  if (!locked.value) reset(false);
});

onMounted(() => {
  nextTick(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  });
});

onUnmounted(() => {
  stopRun();
  window.removeEventListener('resize', resizeCanvas);
});
</script>

<template>
  <section class="sim">
    <div class="sim-head">
      <div>
        <h2>{{ spec.title }}</h2>
        <p>{{ spec.subtitle }}</p>
      </div>
      <div class="sim-stats">
        <span>步数 <strong>{{ generation }}</strong></span>
        <span v-for="item in stats" :key="item.label">{{ item.label }} <strong>{{ item.value }}</strong></span>
      </div>
    </div>

    <div class="sim-controls">
      <button class="primary" @click="toggleRun">{{ running ? '暂停' : '开始' }}</button>
      <button :disabled="running" @click="stepOnce">单步</button>
      <button @click="reset()">重置</button>
      <button :disabled="running" @click="randomize">随机初态</button>
      <label>
        速度
        <select v-model.number="speed">
          <option v-for="item in speedOptions" :key="item" :value="item">{{ item }}x</option>
        </select>
      </label>
    </div>

    <div class="sim-config">
      <label>
        预设
        <select v-model="preset" :disabled="locked">
          <option v-for="item in spec.presets" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </label>
      <label>
        种子
        <input v-model.number="seed" :disabled="locked" type="number" />
      </label>
      <label v-for="item in spec.controls ?? []" :key="item.id">
        {{ item.label }}
        <input
          v-model.number="configValues[item.id]"
          :disabled="locked"
          :max="item.max"
          :min="item.min"
          :step="item.step"
          type="number"
        />
      </label>
    </div>

    <div ref="panelRef" class="sim-canvas">
      <canvas
        ref="canvasRef"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
      ></canvas>
    </div>
  </section>
</template>

<style scoped src="./ZeroPlayerExperiment.css"></style>
