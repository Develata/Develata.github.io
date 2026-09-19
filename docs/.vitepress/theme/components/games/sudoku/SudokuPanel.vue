<script setup lang="ts">
import type { Difficulty, SudokuGameState } from './types';

defineProps<{
  difficulty: Difficulty;
  gameState: SudokuGameState;
  isNoteMode: boolean;
  mistakes: number;
  numberCounts: number[];
  timerText: string;
}>();

const emit = defineEmits<{
  changeDifficulty: [difficulty: Difficulty];
  deleteNumber: [];
  newGame: [];
  toggleNoteMode: [];
  undo: [];
  visualizeSolve: [];
  inputNumber: [value: number];
}>();
</script>

<template>
  <div class="header">
    <div class="info-group">
      <div class="difficulty-select">
        <span
          v-for="diff in ['Easy', 'Medium', 'Hard']"
          :key="diff"
          :class="{ active: difficulty === diff }"
          @click="emit('changeDifficulty', diff as Difficulty)"
        >
          {{ diff }}
        </span>
      </div>
      <div class="stats">
        <span :class="{ danger: mistakes >= 2 }">Mistakes: {{ mistakes }}/3</span>
        <span>{{ timerText }}</span>
      </div>
    </div>
  </div>

  <div class="controls">
    <div v-if="gameState === 'won' || gameState === 'lost'" class="game-over-panel">
      <template v-if="gameState === 'won'">
        <h2>🎉 Solved!</h2>
        <p>Time: {{ timerText }}</p>
      </template>
      <template v-else>
        <h2>💀 Game Over</h2>
        <p>Too many mistakes!</p>
      </template>
      <button class="btn-primary" @click="emit('newGame')">New Game</button>
    </div>

    <template v-else>
      <div class="action-row">
        <button class="action-btn" @click="emit('undo')">↩️ Undo</button>
        <button class="action-btn" @click="emit('deleteNumber')">⌫ Erase</button>
        <button class="action-btn" :class="{ active: isNoteMode }" @click="emit('toggleNoteMode')">
          ✏️ Notes
        </button>
        <button class="action-btn special" @click="emit('visualizeSolve')">🤖 Solve</button>
      </div>
      <div class="numpad">
        <button
          v-for="n in 9"
          :key="n"
          class="num-btn"
          :class="{ completed: numberCounts[n] >= 9 }"
          @click="emit('inputNumber', n)"
        >
          {{ n }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.header,
.controls {
  width: 100%;
  max-width: 360px;
}

.info-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.difficulty-select {
  display: flex;
  gap: 4px;
  background: var(--vp-c-bg-soft);
  padding: 4px;
  border-radius: 8px;
}

.difficulty-select span {
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}

.difficulty-select span.active {
  background: var(--vp-c-brand);
  color: white;
  font-weight: bold;
}

.stats .danger {
  color: #ef4444;
  font-weight: bold;
}

.action-row {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.action-btn.special {
  color: #f59e0b;
  border-color: #f59e0b;
}

.numpad {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
}

.num-btn {
  aspect-ratio: 1;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand);
  font-weight: bold;
  cursor: pointer;
  font-size: 1.2rem;
}

.num-btn.completed {
  opacity: 0.2;
  pointer-events: none;
}

.game-over-panel {
  text-align: center;
  padding: 20px;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-primary {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  margin-top: 15px;
  cursor: pointer;
}

@media (max-width: 450px) {
  .header,
  .controls {
    max-width: 95vw;
  }

  .num-btn {
    font-size: 1rem;
  }

  .action-btn {
    padding: 8px;
    font-size: 0.8rem;
  }
}
</style>
