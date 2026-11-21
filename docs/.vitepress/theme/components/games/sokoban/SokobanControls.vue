<!--
  @file SokobanControls.vue
  @description 推箱子移动端方向控制；触摸即时响应，click/键盘激活保持可用。
-->
<script setup lang="ts">
import type { Direction } from './types';

const emit = defineEmits<{
  (event: 'move', direction: Direction): void;
}>();

let suppressedClickDirection: Direction | null = null;
let suppressClickUntil = 0;

function press(direction: Direction) {
  emit('move', direction);
}

function onPointerDown(event: PointerEvent, direction: Direction) {
  if (event.pointerType === 'mouse') {
    return;
  }
  event.preventDefault();
  suppressedClickDirection = direction;
  suppressClickUntil = Date.now() + 450;
  press(direction);
}

function onClick(direction: Direction) {
  if (suppressedClickDirection === direction && Date.now() < suppressClickUntil) {
    suppressedClickDirection = null;
    return;
  }
  press(direction);
}
</script>

<template>
  <div class="sokoban-controls" aria-label="移动控制">
    <button type="button" class="dpad-btn up" @pointerdown="onPointerDown($event, 'up')" @click="onClick('up')">
      ▲
    </button>
    <button type="button" class="dpad-btn left" @pointerdown="onPointerDown($event, 'left')" @click="onClick('left')">
      ◀
    </button>
    <button type="button" class="dpad-center" disabled></button>
    <button type="button" class="dpad-btn right" @pointerdown="onPointerDown($event, 'right')" @click="onClick('right')">
      ▶
    </button>
    <button type="button" class="dpad-btn down" @pointerdown="onPointerDown($event, 'down')" @click="onClick('down')">
      ▼
    </button>
  </div>
</template>

<style scoped>
.sokoban-controls {
  display: none;
  width: 192px;
  grid-template-columns: repeat(3, 56px);
  grid-template-rows: repeat(3, 56px);
  gap: 4px;
  user-select: none;
  touch-action: none;
}

.dpad-btn,
.dpad-center {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  font-weight: 800;
}

.dpad-btn {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.dpad-btn:active {
  transform: translateY(1px);
  background: var(--vp-c-brand-soft);
}

.dpad-center {
  background: #cbd5e1;
}

.up {
  grid-column: 2;
  grid-row: 1;
}

.left {
  grid-column: 1;
  grid-row: 2;
}

.dpad-center {
  grid-column: 2;
  grid-row: 2;
}

.right {
  grid-column: 3;
  grid-row: 2;
}

.down {
  grid-column: 2;
  grid-row: 3;
}

@media (max-width: 640px) {
  .sokoban-controls {
    display: grid;
  }
}
</style>
