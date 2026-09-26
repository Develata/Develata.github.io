<template>
  <div class="strategy-toggle">
    <span>武器流派</span>
    <button
      v-for="strategy in strategyOptions"
      :key="strategy"
      :class="{ active: strategy === activeStrategy }"
      @click="$emit('select-strategy', strategy)"
    >
      {{ formatStrategy(strategy) }}
    </button>
  </div>

  <div class="action-panel">
    <p>{{ selectionHint }}</p>
    <div class="action-buttons">
      <button
        :disabled="!interactionState.playerSelected"
        :class="{ active: interactionState.plannedAction === 'move' }"
        @click="$emit('plan-action', 'move')"
      >
        移动一格
      </button>
      <button
        :disabled="!interactionState.playerSelected"
        :class="{ active: interactionState.plannedAction === 'attack' }"
        @click="$emit('plan-action', 'attack')"
      >
        {{ attackButtonLabel }}
      </button>
    </div>
  </div>

  <div class="turn-control">
    <button :class="{ ready: actionReady }" @click="$emit('next-turn')">
      <span class="label">下一回合</span>
      <span class="hint">Space / Enter</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { WeaponArchetype } from '../core/types';
import type { InteractionState, PlayerAction } from '../application/types';

const props = defineProps<{
  activeStrategy: WeaponArchetype;
  strategyOptions: WeaponArchetype[];
  interactionState: InteractionState;
  selectionHint: string;
  actionReady: boolean;
}>();

defineEmits<{
  (e: 'select-strategy', strategy: WeaponArchetype): void;
  (e: 'plan-action', action: PlayerAction): void;
  (e: 'next-turn'): void;
}>();

const formatStrategy = (strategy: WeaponArchetype): string => {
  switch (strategy) {
    case WeaponArchetype.Euclidean:
      return '欧氏火线';
    case WeaponArchetype.Distributed:
      return '分布蜂群';
    case WeaponArchetype.Gradient:
    default:
      return '梯度枪刃';
  }
};

const attackButtonLabel = computed(() =>
  props.interactionState.plannedAction === 'attack' ? '取消攻击' : '锁定攻击'
);
</script>

<style scoped>
.strategy-toggle {
  display: flex;
  gap: 8px;
  align-items: center;
  pointer-events: auto;
  flex-wrap: wrap;
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.strategy-toggle button {
  background: rgba(0, 255, 204, 0.1);
  border: 1px solid rgba(0, 255, 204, 0.3);
  color: #d8fff3;
  padding: 6px 12px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.strategy-toggle button.active {
  background: rgba(0, 255, 204, 0.35);
  border-color: #00ffcc;
}

.action-panel {
  background: rgba(4, 8, 18, 0.85);
  border: 1px solid rgba(0, 255, 204, 0.25);
  padding: 10px;
  pointer-events: auto;
}

.action-panel p {
  margin: 0 0 8px;
  font-size: 0.82rem;
  color: rgba(216, 255, 243, 0.8);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons button {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #d8fff3;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.action-buttons button.active {
  border-color: #00ffcc;
  background: rgba(0, 255, 204, 0.15);
}

.action-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.turn-control {
  pointer-events: auto;
}

.turn-control button {
  width: 100%;
  padding: 12px 20px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(0, 255, 204, 0.7), rgba(0, 102, 255, 0.8));
  color: #021010;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.turn-control button.ready {
  border-color: #00ffcc;
}

.turn-control button:hover {
  transform: translateY(-3px);
}

.turn-control .hint {
  font-size: 0.75rem;
  color: rgba(2, 16, 16, 0.8);
}

@media (max-width: 960px) {
  .strategy-toggle {
    justify-content: center;
    margin-bottom: 8px;
  }

  .action-buttons button {
    padding: 14px;
    font-size: 1rem;
  }

  .turn-control button {
    padding: 16px;
    font-size: 1.1rem;
  }
}
</style>
