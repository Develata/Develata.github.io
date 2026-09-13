<script setup lang="ts">
import type { Cell } from './types';

const props = defineProps<{
  grid: Cell[];
  getCellClass: (index: number) => string[];
}>();

const emit = defineEmits<{
  select: [index: number];
}>();

function getGlobalIndex(boxIndex: number, cellIndex: number): number {
  const boxRow = Math.floor(boxIndex / 3);
  const boxCol = boxIndex % 3;
  const cellRow = Math.floor(cellIndex / 3);
  const cellCol = cellIndex % 3;
  return (boxRow * 3 + cellRow) * 9 + (boxCol * 3 + cellCol);
}

function selectCell(index: number) {
  emit('select', index);
}
</script>

<template>
  <div class="board-container" v-if="props.grid.length === 81">
    <div class="sudoku-grid">
      <div v-for="boxIndex in 9" :key="boxIndex" class="big-box">
        <div
          v-for="cellIndex in 9"
          :key="cellIndex"
          class="cell"
          :class="props.getCellClass(getGlobalIndex(boxIndex - 1, cellIndex - 1))"
          @click="selectCell(getGlobalIndex(boxIndex - 1, cellIndex - 1))"
        >
          <template v-if="props.grid[getGlobalIndex(boxIndex - 1, cellIndex - 1)]">
            <span v-if="props.grid[getGlobalIndex(boxIndex - 1, cellIndex - 1)].val !== 0">
              {{ props.grid[getGlobalIndex(boxIndex - 1, cellIndex - 1)].val }}
            </span>
            <div v-else class="notes-grid">
              <span v-for="n in 9" :key="n" class="note-num">
                {{ props.grid[getGlobalIndex(boxIndex - 1, cellIndex - 1)].notes.has(n) ? n : '' }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="loading-placeholder">Loading...</div>
</template>

<style scoped>
.board-container {
  width: 100%;
  max-width: 360px;
  background: var(--vp-c-text-1);
  padding: 2px;
  border-radius: 4px;
}

.sudoku-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
  background-color: var(--vp-c-text-1);
}

.big-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 1px;
  background-color: var(--vp-c-text-3);
}

.cell {
  background-color: var(--vp-c-bg);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  position: relative;
}

.cell.fixed {
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.cell:not(.fixed) {
  color: var(--vp-c-brand);
}

.cell.error {
  background: #fecaca !important;
  color: #ef4444 !important;
}

.dark .cell.error {
  background: #7f1d1d !important;
}

.cell.related {
  background: var(--vp-c-bg-soft);
}

.cell.same-num {
  background: #b1d2f9;
}

.dark .cell.same-num {
  background: #1e3a8a;
}

.cell.selected {
  background: #60a5fa !important;
  color: white !important;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.note-num {
  font-size: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2);
  line-height: 1;
}

.loading-placeholder {
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 450px) {
  .board-container {
    max-width: 95vw;
  }

  .cell {
    font-size: 1.2rem;
  }
}
</style>
