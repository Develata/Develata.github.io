<!--
  @file Sokoban.vue
  @description 推箱子游戏入口。组件只组装运行时、棋盘与面板。
-->
<script setup lang="ts">
import SokobanBoard from './sokoban/SokobanBoard.vue';
import SokobanControls from './sokoban/SokobanControls.vue';
import SokobanPanel from './sokoban/SokobanPanel.vue';
import { useSokobanGame } from './sokoban/useSokobanGame';

const {
  boardCells,
  bestRecord,
  canGoNext,
  canGoPrev,
  canUndo,
  currentLevel,
  currentLevelIndex,
  levelCount,
  state,
  move,
  nextLevel,
  prevLevel,
  reset,
  undo,
} = useSokobanGame();
</script>

<template>
  <div class="sokoban-game">
    <SokobanPanel
      :level="currentLevel"
      :level-index="currentLevelIndex"
      :level-count="levelCount"
      :moves="state.moves"
      :pushes="state.pushes"
      :won="state.won"
      :best-record="bestRecord"
      :can-undo="canUndo"
      :can-go-prev="canGoPrev"
      :can-go-next="canGoNext"
      @prev="prevLevel"
      @next="nextLevel"
      @reset="reset"
      @undo="undo"
    />

    <SokobanBoard
      :cells="boardCells"
      :rows="state.height"
      :cols="state.width"
      :won="state.won"
    />

    <SokobanControls @move="move" />
  </div>
</template>

<style scoped>
.sokoban-game {
  width: 100%;
  margin: 20px auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  user-select: none;
}
</style>
