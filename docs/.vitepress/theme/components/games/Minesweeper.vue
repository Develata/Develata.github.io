<!--
  @file Minesweeper.vue
  @description 扫雷游戏组件 (Minesweeper)
  职责：
  1. 组装顶部状态栏与棋盘组件。
  2. 将扫雷规则与局面状态委托给独立组合式模块。
-->
<script setup lang="ts">
import MinesweeperBoard from './minesweeper/MinesweeperBoard.vue';
import MinesweeperHeader from './minesweeper/MinesweeperHeader.vue';
import { useMinesweeperGame } from './minesweeper/useMinesweeperGame';

const {
  board,
  estimatedMines,
  gameState,
  mode,
  numColors,
  remainMines,
  showSettings,
  tempConfig,
  timeElapsed,
  applySettings,
  handleClick,
  handleRightClick,
  initGame,
} = useMinesweeperGame();
</script>

<template>
  <div class="minesweeper-container">
    <MinesweeperHeader
      :estimated-mines="estimatedMines"
      :game-state="gameState"
      :mode="mode"
      :remain-mines="remainMines"
      :show-settings="showSettings"
      :temp-config="tempConfig"
      :time-elapsed="timeElapsed"
      @apply-settings="applySettings"
      @reset="initGame"
      @set-mode="mode = $event"
      @toggle-settings="showSettings = !showSettings"
    />

    <MinesweeperBoard
      :board="board"
      :cols="board[0]?.length ?? 0"
      :num-colors="numColors"
      @click="handleClick"
      @right-click="handleRightClick"
    />
  </div>
</template>

<style scoped>
.minesweeper-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  font-family: sans-serif;
  user-select: none;
  touch-action: manipulation;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
}
</style>
