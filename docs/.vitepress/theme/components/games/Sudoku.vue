<!--
  @file Sudoku.vue
  @description 数独游戏组件 (Sudoku)
  职责：
  1. 组装数独棋盘与控制面板。
  2. 将规则逻辑委托给独立组合式模块。
-->
<script setup lang="ts">
import SudokuBoard from './sudoku/SudokuBoard.vue';
import SudokuPanel from './sudoku/SudokuPanel.vue';
import { useSudokuGame } from './sudoku/useSudokuGame';

const {
  difficulty,
  gameState,
  grid,
  isNoteMode,
  mistakes,
  numberCounts,
  timer,
  deleteNumber,
  formatTime,
  getCellClass,
  initGame,
  inputNumber,
  selectCell,
  undo,
  visualizeSolve,
} = useSudokuGame();
</script>

<template>
  <div class="sudoku-container">
    <SudokuPanel
      :difficulty="difficulty"
      :game-state="gameState"
      :is-note-mode="isNoteMode"
      :mistakes="mistakes"
      :number-counts="numberCounts"
      :timer-text="formatTime(timer)"
      @change-difficulty="initGame($event)"
      @delete-number="deleteNumber"
      @new-game="initGame()"
      @toggle-note-mode="isNoteMode = !isNoteMode"
      @undo="undo"
      @visualize-solve="visualizeSolve"
      @input-number="inputNumber"
    />

    <SudokuBoard :grid="grid" :get-cell-class="getCellClass" @select="selectCell" />
  </div>
</template>

<style scoped>
.sudoku-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  font-family: sans-serif;
  user-select: none;
  touch-action: manipulation;
}
</style>
