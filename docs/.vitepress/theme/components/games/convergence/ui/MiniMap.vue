<template>
  <div class="minimap">
    <canvas ref="canvas" width="220" height="220" aria-label="field heatmap"></canvas>
    <footer>
      <span>场函数热力</span>
      <small>玩家位置 · {{ enemies.length }} 敌人</small>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

interface Point {
  x: number;
  y: number;
}

const props = defineProps<{
  heatmap: number[][];
  player: Point | null;
  enemies: Point[];
  gridSize: number;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);

const draw = () => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx || props.heatmap.length === 0) return;
  const size = props.heatmap.length;
  const cellW = ctx.canvas.width / size;
  const cellH = ctx.canvas.height / size;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = props.heatmap[y][x];
      ctx.fillStyle = valueToColor(value);
      ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
    }
  }

  if (props.player) {
    drawMarker(ctx, props.player, cellW, cellH, '#00ffcc');
  }

  props.enemies.forEach((enemy) => drawMarker(ctx, enemy, cellW, cellH, '#ff557a'));
};

const drawMarker = (ctx: CanvasRenderingContext2D, point: Point, cellW: number, cellH: number, color: string) => {
  ctx.fillStyle = color;
  const px = (point.x / Math.max(1, props.gridSize)) * ctx.canvas.width;
  const py = (point.y / Math.max(1, props.gridSize)) * ctx.canvas.height;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fill();
};

const valueToColor = (value: number) => {
  // 伽马校正，提亮暗部
  const t = Math.pow(Math.max(0, Math.min(1, value)), 0.8);

  // 定义 5 色阶渐变，提供更丰富的视觉层次
  const stops = [
    { pos: 0.0, color: [2, 2, 10] },       // 0% 深渊黑 (背景)
    { pos: 0.2, color: [20, 40, 120] },    // 20% 深海蓝
    { pos: 0.45, color: [0, 180, 200] },   // 45% 湖水蓝
    { pos: 0.6, color: [0, 255, 204] },    // 60% 能量青 (基准色)
    { pos: 0.8, color: [255, 220, 50] },   // 80% 活跃黄
    { pos: 1.0, color: [255, 60, 60] }     // 100% 奇点红
  ];

  // 寻找当前值所在的颜色区间
  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i];
    const end = stops[i + 1];
    if (t >= start.pos && t <= end.pos) {
      const range = end.pos - start.pos;
      const localT = (t - start.pos) / range;
      
      const r = start.color[0] + (end.color[0] - start.color[0]) * localT;
      const g = start.color[1] + (end.color[1] - start.color[1]) * localT;
      const b = start.color[2] + (end.color[2] - start.color[2]) * localT;
      
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
  }
  
  // 兜底：如果是 1.0 或更高
  const last = stops[stops.length - 1].color;
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`;
};

watch(() => [props.heatmap, props.player, props.enemies, props.gridSize], draw, { deep: true });
onMounted(draw);
</script>

<style scoped>
.minimap {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(0, 255, 204, 0.3);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
}

canvas {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  image-rendering: pixelated;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(216, 255, 243, 0.8);
}
</style>
