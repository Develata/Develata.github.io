<script setup lang="ts">
import type { MinesweeperGameState } from './types';

defineProps<{
  estimatedMines: number;
  gameState: MinesweeperGameState;
  mode: 'dig' | 'flag';
  remainMines: number;
  showSettings: boolean;
  tempConfig: { rows: number; cols: number; density: number };
  timeElapsed: number;
}>();

const emit = defineEmits<{
  applySettings: [];
  reset: [];
  setMode: [mode: 'dig' | 'flag'];
  toggleSettings: [];
}>();
</script>

<template>
  <div class="header-card">
    <div class="top-row">
      <button class="settings-btn" :class="{ active: showSettings }" @click="emit('toggleSettings')">⚙️ 设置</button>

      <button class="reset-face" @click="emit('reset')">
        <span v-if="gameState === 'won'">😎</span>
        <span v-else-if="gameState === 'lost'">😵</span>
        <span v-else-if="gameState === 'playing'">🤔</span>
        <span v-else>🙂</span>
      </button>

      <div class="lcd-screen timer">⏱️ {{ timeElapsed }}</div>
    </div>

    <div v-if="showSettings" class="settings-panel">
      <div class="setting-group">
        <label>规模 (行 x 列)</label>
        <div class="inputs">
          <input v-model="tempConfig.rows" type="number" min="5" max="50" />
          <span>x</span>
          <input v-model="tempConfig.cols" type="number" min="5" max="50" />
        </div>
      </div>

      <div class="setting-group">
        <label>雷区密度: {{ tempConfig.density }}%</label>
        <input v-model.number="tempConfig.density" type="range" min="5" max="40" step="1" />
        <div class="preview-text">预计地雷: {{ estimatedMines }}</div>
      </div>

      <button class="apply-btn" @click="emit('applySettings')">✅ 应用并开始</button>
    </div>

    <div v-else class="info-row">
      <div class="lcd-screen mines">💣 {{ remainMines }}</div>

      <div class="mode-toggle">
        <button class="mode-btn" :class="{ active: mode === 'dig' }" @click="emit('setMode', 'dig')">⛏️ 挖开</button>
        <button class="mode-btn" :class="{ active: mode === 'flag' }" @click="emit('setMode', 'flag')">🚩 插旗</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-btn {
  background: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}

.settings-btn:hover,
.settings-btn.active {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
}

.reset-face {
  font-size: 1.8rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.1s;
}

.reset-face:active {
  transform: scale(0.9);
}

.settings-panel {
  background: var(--vp-c-bg-alt);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideDown 0.2s ease-out;
  border: 1px solid var(--vp-c-divider);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-group label {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

.inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inputs input {
  flex: 1;
  padding: 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-align: center;
}

.preview-text {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  text-align: right;
}

.apply-btn {
  background: var(--vp-c-brand);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.apply-btn:hover {
  background: var(--vp-c-brand-dark);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  animation: fadeIn 0.3s;
}

.lcd-screen {
  background: #000;
  color: #f00;
  font-family: monospace;
  font-size: 1.2rem;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 60px;
  text-align: center;
}

.mode-toggle {
  display: flex;
  background: var(--vp-c-bg-alt);
  border-radius: 8px;
  padding: 2px;
  flex: 1;
  justify-content: center;
}

.mode-btn {
  flex: 1;
  padding: 6px 0;
  font-size: 0.9rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.mode-btn.active {
  background: var(--vp-c-brand);
  color: white;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
