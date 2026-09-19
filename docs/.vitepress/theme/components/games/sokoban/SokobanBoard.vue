<!--
  @file SokobanBoard.vue
  @description 推箱子棋盘视图；只渲染派生单元格，不包含规则判断。
-->
<script setup lang="ts">
import { computed } from 'vue';
import type { BoardCell } from './types';

const props = defineProps<{
  cells: BoardCell[];
  rows: number;
  cols: number;
  won: boolean;
}>();

const boardStyle = computed(() => ({
  '--sokoban-cols': props.cols,
  '--sokoban-rows': props.rows,
  aspectRatio: `${props.cols}/${props.rows}`,
}));

function cellLabel(cell: BoardCell): string {
  if (cell.terrain === 'wall') return '墙';
  if (cell.terrain === 'void') return '空白';
  if (cell.hasPlayer) return cell.terrain === 'goal' ? '玩家在目标点' : '玩家';
  if (cell.hasBox) return cell.boxOnGoal ? '已归位箱子' : '箱子';
  if (cell.terrain === 'goal') return '目标点';
  return '地板';
}
</script>

<template>
  <div
    class="sokoban-board"
    :class="{ solved: won }"
    :style="boardStyle"
    role="grid"
    aria-label="推箱子棋盘"
  >
    <div
      v-for="cell in cells"
      :key="cell.key"
      class="sokoban-cell"
      :class="[
        `terrain-${cell.terrain}`,
        {
          goal: cell.terrain === 'goal',
          occupied: cell.hasPlayer || cell.hasBox,
          'box-on-goal': cell.boxOnGoal,
        },
      ]"
      role="gridcell"
      :aria-label="cellLabel(cell)"
    >
      <span v-if="cell.terrain === 'goal'" class="goal-marker" aria-hidden="true"></span>
      <span v-if="cell.hasBox" class="box-token" aria-hidden="true"></span>
      <span v-if="cell.hasPlayer" class="player-token" aria-hidden="true"></span>
    </div>
  </div>
</template>

<style scoped>
.sokoban-board {
  display: grid;
  grid-template-columns: repeat(var(--sokoban-cols), minmax(0, 1fr));
  grid-template-rows: repeat(var(--sokoban-rows), minmax(0, 1fr));
  width: min(100%, 520px);
  max-height: min(72vh, 560px);
  margin: 0 auto;
  padding: 8px;
  gap: 3px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: #111827;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
}

.sokoban-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  border-radius: 4px;
  overflow: hidden;
}

.terrain-void {
  visibility: hidden;
}

.terrain-wall {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.10), transparent 45%),
    #334155;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.28);
}

.terrain-floor,
.terrain-goal {
  background: #f8fafc;
  border: 1px solid #d8dee9;
}

.goal-marker {
  position: absolute;
  width: 42%;
  height: 42%;
  border: 2px dashed #2563eb;
  border-radius: 50%;
  opacity: 0.72;
}

.box-token {
  position: relative;
  z-index: 2;
  width: 68%;
  height: 68%;
  border-radius: 5px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.36), transparent 38%),
    #b45309;
  border: 2px solid #78350f;
  box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.22);
}

.box-token::after {
  content: '';
  position: absolute;
  inset: 24%;
  border: 2px solid rgba(120, 53, 15, 0.42);
  border-radius: 2px;
}

.box-on-goal .box-token {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.38), transparent 38%),
    #059669;
  border-color: #065f46;
}

.player-token {
  position: relative;
  z-index: 3;
  width: 56%;
  height: 56%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, #fef3c7 0 18%, transparent 19%),
    #2563eb;
  border: 2px solid #1e3a8a;
  box-shadow: 0 2px 5px rgba(30, 58, 138, 0.34);
}

.solved .player-token {
  background:
    radial-gradient(circle at 35% 30%, #dcfce7 0 18%, transparent 19%),
    #16a34a;
  border-color: #166534;
}

@media (max-width: 640px) {
  .sokoban-board {
    width: min(100%, 94vw);
    padding: 6px;
    gap: 2px;
  }

  .goal-marker {
    border-width: 1.5px;
  }

  .box-token,
  .player-token {
    border-width: 1.5px;
  }
}
</style>
