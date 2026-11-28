<template>
  <section class="player-panel">
    <header>
      <span>{{ title }}</span>
      <div class="header-right">
        <small v-if="mode === 'player'">第 {{ turn }} 回合 · {{ strategy }}</small>
        <button v-if="showClose" class="close-btn" @click="$emit('close')">×</button>
      </div>
    </header>

    <div class="bar" aria-label="生命值">
      <span>HP {{ stats.hp }}/{{ stats.maxHp }}</span>
      <div class="bar-track">
        <div class="bar-fill hp" :style="{ width: `${hpRatio * 100}%` }"></div>
      </div>
    </div>

    <template v-if="mode === 'player'">
      <div class="bar" aria-label="弹药">
        <span>Ammo {{ stats.ammo }}/{{ capacity }}</span>
        <div class="bar-track">
          <div class="bar-fill ammo" :style="{ width: `${ammoRatio * 100}%` }"></div>
        </div>
      </div>

      <div class="inventory">
        <div>
          <label>药剂</label>
          <strong>{{ stats.potions }}</strong>
        </div>
        <div>
          <label>势能损耗</label>
          <strong>{{ lossValue.toFixed(2) }}</strong>
        </div>
      </div>
    </template>
    
    <template v-else>
      <div class="traits" v-if="traits && traits.length > 0">
        <label>特性</label>
        <div class="trait-list">
          <span v-for="trait in traits" :key="trait" class="trait-tag">{{ trait }}</span>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerStats, EnemyTrait } from '../core/types';

const props = withDefaults(defineProps<{
  stats: { hp: number; maxHp: number; ammo?: number; potions?: number };
  capacity?: number;
  strategy?: string;
  lossValue?: number;
  turn?: number;
  title?: string;
  mode?: 'player' | 'enemy';
  showClose?: boolean;
  traits?: EnemyTrait[];
}>(), {
  title: '作战状态',
  mode: 'player',
  showClose: false,
  capacity: 0,
  lossValue: 0,
  turn: 0,
  strategy: '',
  traits: () => []
});

defineEmits<{ (e: 'close'): void }>();

const hpRatio = computed(() => {
  if (props.stats.maxHp === 0) return 0;
  return Math.min(1, Math.max(0, props.stats.hp / props.stats.maxHp));
});

const ammoRatio = computed(() => {
  if (props.mode !== 'player' || !props.stats.ammo) return 0;
  return Math.min(1, Math.max(0, props.stats.ammo / (props.capacity || 1)));
});
</script>

<style scoped>
.player-panel {
  background: rgba(8, 12, 25, 0.9);
  border: 1px solid rgba(0, 255, 204, 0.3);
  padding: 16px;
  color: #d8fff3;
  font-family: 'Space Mono', 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
  padding-bottom: 8px;
  margin-bottom: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

header small {
  color: rgba(216, 255, 243, 0.7);
  font-size: 0.75rem;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(216, 255, 243, 0.6);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: #fff;
}

.bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
}

.bar-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-fill.hp {
  background: linear-gradient(90deg, #ff3366, #ff557a);
}

.bar-fill.ammo {
  background: linear-gradient(90deg, #00ccff, #00ffcc);
}

.inventory {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.inventory > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inventory label {
  font-size: 0.7rem;
  color: rgba(216, 255, 243, 0.6);
  text-transform: uppercase;
}

.inventory strong {
  font-size: 1.1rem;
  color: #00ffcc;
}

.traits {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.traits label {
  font-size: 0.7rem;
  color: rgba(216, 255, 243, 0.6);
  text-transform: uppercase;
}

.trait-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.trait-tag {
  font-size: 0.75rem;
  background: rgba(255, 85, 122, 0.2);
  border: 1px solid rgba(255, 85, 122, 0.4);
  color: #ffb3c1;
  padding: 2px 6px;
  border-radius: 4px;
}

@media (max-width: 960px) {
  .player-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 12px;
    padding: 10px 12px;
    background: rgba(8, 12, 25, 0.95);
  }

  header {
    grid-column: 1 / -1;
    margin: 0;
    padding-bottom: 6px;
    border-bottom-color: rgba(0, 255, 204, 0.15);
  }

  /* 让 HP 和 Ammo 并排显示 */
  .bar {
    grid-column: span 1;
  }
  
  /* 如果只有一个 bar (敌人模式)，让它占满 */
  .bar:nth-of-type(2):last-of-type {
    grid-column: 1 / -1;
  }

  .inventory {
    grid-column: 1 / -1;
    margin-top: 0;
    justify-content: flex-start;
    gap: 24px;
    flex-direction: row;
  }

  .inventory > div {
    flex-direction: row;
    align-items: baseline;
    gap: 6px;
  }

  .inventory label {
    font-size: 0.75rem;
  }

  .inventory strong {
    font-size: 1rem;
  }

  .traits {
    grid-column: 1 / -1;
  }
}
</style>


