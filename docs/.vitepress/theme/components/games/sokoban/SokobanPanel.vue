<!--
  @file SokobanPanel.vue
  @description 推箱子状态面板与输入面板；不直接修改规则状态。
-->
<script setup lang="ts">
import type { LevelRecord, SokobanLevel } from './types';

defineProps<{
  level: SokobanLevel;
  levelIndex: number;
  levelCount: number;
  moves: number;
  pushes: number;
  won: boolean;
  bestRecord: LevelRecord | null;
  canUndo: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
}>();

const emit = defineEmits<{
  (event: 'prev'): void;
  (event: 'next'): void;
  (event: 'reset'): void;
  (event: 'undo'): void;
}>();
</script>

<template>
  <section class="sokoban-panel" aria-label="推箱子状态">
    <div class="level-row">
      <div>
        <div class="eyebrow">SOKOBAN</div>
        <h2>{{ level.title }}</h2>
      </div>
      <div class="level-nav" aria-label="关卡导航">
        <button type="button" class="icon-btn" :disabled="!canGoPrev" @click="emit('prev')">‹</button>
        <span class="level-index">{{ levelIndex + 1 }}/{{ levelCount }}</span>
        <button type="button" class="icon-btn" :disabled="!canGoNext" @click="emit('next')">›</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat">
        <span>步数</span>
        <strong>{{ moves }}</strong>
      </div>
      <div class="stat">
        <span>推数</span>
        <strong>{{ pushes }}</strong>
      </div>
      <div class="stat">
        <span>最优推数</span>
        <strong>{{ level.minPushes }}</strong>
      </div>
      <div class="stat">
        <span>记录</span>
        <strong>{{ bestRecord ? `${bestRecord.pushes}/${bestRecord.moves}` : '-' }}</strong>
      </div>
    </div>

    <div class="actions">
      <button type="button" class="action-btn" :disabled="!canUndo" @click="emit('undo')">撤销</button>
      <button type="button" class="action-btn" @click="emit('reset')">重置</button>
      <div class="status" :class="{ won }">{{ won ? '完成' : `${level.boxCount} 箱` }}</div>
    </div>
  </section>
</template>

<style scoped>
.sokoban-panel {
  width: min(100%, 760px);
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.level-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--vp-c-text-3);
}

h2 {
  margin: 2px 0 0;
  font-size: 1.35rem;
  line-height: 1.2;
}

.level-nav {
  display: grid;
  grid-template-columns: 38px minmax(52px, auto) 38px;
  align-items: center;
  gap: 8px;
}

.icon-btn,
.action-btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  font-size: 1.5rem;
  line-height: 1;
}

.icon-btn:disabled,
.action-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.level-index {
  text-align: center;
  font-weight: 700;
  color: var(--vp-c-text-2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.stat {
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.stat span {
  display: block;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
}

.stat strong {
  display: block;
  margin-top: 2px;
  font-size: 1.12rem;
  color: var(--vp-c-brand);
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  min-width: 72px;
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  font-weight: 700;
}

.status {
  margin-left: auto;
  min-width: 70px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 800;
}

.status.won {
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 640px) {
  .sokoban-panel {
    padding: 12px;
  }

  .level-row {
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
