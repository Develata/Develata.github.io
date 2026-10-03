<script setup lang="ts">
import type { Cell } from './types';

defineProps<{
  board: Cell[][];
  cols: number;
  numColors: string[];
}>();

const emit = defineEmits<{
  click: [row: number, col: number];
  rightClick: [event: MouseEvent, row: number, col: number];
}>();
</script>

<template>
  <div class="board-wrapper">
    <div class="board" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }" @contextmenu.prevent>
      <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row-group" style="display: contents;">
        <div
          v-for="(cell, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          class="cell"
          :class="{
            open: cell.isOpen,
            closed: !cell.isOpen,
            exploded: cell.isExploded,
            flagged: cell.isFlagged,
          }"
          @click="emit('click', rowIndex, colIndex)"
          @contextmenu="emit('rightClick', $event, rowIndex, colIndex)"
        >
          <template v-if="cell.isOpen">
            <span v-if="cell.isMine">💣</span>
            <span v-else-if="cell.count > 0" class="num" :style="{ color: numColors[cell.count] }">
              {{ cell.count }}
            </span>
          </template>
          <template v-else>
            <span v-if="cell.isFlagged" class="flag-icon">🚩</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 10px;
  display: block;
  text-align: center;
}

@media (max-width: 600px) {
  .board-wrapper {
    padding-left: 0;
    padding-right: 0;
    text-align: left;
  }
}

.board {
  display: inline-grid;
  gap: 2px;
  background: var(--vp-c-divider);
  padding: 4px;
  border-radius: 4px;
  margin: 0 auto;
}

.cell {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: 2px;
  transition: background-color 0.1s;
}

.cell.closed {
  background: var(--vp-c-bg-alt);
  border: 1px outset var(--vp-c-divider);
}

.cell.closed:hover {
  filter: brightness(0.95);
}

.cell.open {
  background: var(--vp-c-bg-soft);
  border: 1px solid transparent;
}

.cell.exploded {
  background: #ef4444 !important;
  border: none;
}

.flag-icon {
  font-size: 0.9rem;
}
</style>
