<template>
  <div class="ui-overlay">
    <header class="hud-top">
      <div class="hud-title-group">
        <div>
          <h1>收敛战线 · 梯度之战</h1>
          <p>{{ systemStatus }}</p>
          <small>{{ roomLabel }} ｜ {{ topologyLabel }}</small>
        </div>
        <button class="help-btn" @click="$emit('show-help')" title="操作说明">?</button>
      </div>
      <div class="turn-chip">第 {{ turnCount }} 回合</div>
    </header>

    <div class="rail rail-left">
      <div class="rail-section rail-section--top">
        <MiniMap :heatmap="heatmap" :player="entities.player" :enemies="entities.enemies" :grid-size="gridSize" />
      </div>
      <div class="rail-section rail-section--center">
        <ActionLog :entries="actionLog" :collapsed="actionLogCollapsed" @toggle="$emit('toggle-action-log')" />
      </div>
      <div class="rail-section rail-section--bottom">
        <HUD
          v-if="interactionState.playerSelected"
          :stats="playerStats"
          :capacity="ammoCapacity"
          :strategy="activeStrategyLabel"
          :loss-value="lossValue"
          :turn="turnCount"
          mode="player"
          title="作战状态"
          :show-close="true"
          @close="$emit('close-panel')"
        />
        <HUD
          v-else-if="selectedEnemyStats"
          :stats="{ hp: selectedEnemyStats.hp, maxHp: selectedEnemyStats.maxHp }"
          :title="selectedEnemyStats.name"
          :traits="selectedEnemyStats.traits"
          mode="enemy"
          :show-close="true"
          @close="$emit('close-panel')"
        />
      </div>
    </div>

    <div class="rail rail-right">
      <div class="rail-section rail-section--top">
        <NetworkMap />
      </div>
      <div class="rail-section rail-section--center">
        <UpgradePanel v-if="pendingBuffs.length > 0" :buffs="pendingBuffs" @select="$emit('select-buff', $event)" />
      </div>
      <div class="rail-section rail-section--bottom">
        <CommandPanel
          :active-strategy="activeStrategy"
          :strategy-options="strategyOptions"
          :interaction-state="interactionState"
          :selection-hint="selectionHint"
          :action-ready="actionReady"
          @select-strategy="$emit('select-strategy', $event)"
          @plan-action="$emit('plan-action', $event)"
          @next-turn="$emit('next-turn')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HUD from './HUD.vue';
import MiniMap from './MiniMap.vue';
import NetworkMap from './NetworkMap.vue';
import UpgradePanel from './UpgradePanel.vue';
import ActionLog from './ActionLog.vue';
import CommandPanel from './CommandPanel.vue';
import { WeaponArchetype } from '../core/types';
import type { ActionLogEntry, BuffDefinition, BuffId, EnemyProfile, PlayerStats } from '../core/types';
import type { EntitySnapshot, InteractionState, PlayerAction } from '../application/types';

defineProps<{
  systemStatus: string;
  roomLabel: string;
  topologyLabel: string;
  turnCount: number;
  gridSize: number;
  heatmap: number[][];
  entities: EntitySnapshot;
  actionLog: ActionLogEntry[];
  actionLogCollapsed: boolean;
  interactionState: InteractionState;
  playerStats: PlayerStats;
  ammoCapacity: number;
  activeStrategyLabel: string;
  lossValue: number;
  selectedEnemyStats: EnemyProfile | null;
  pendingBuffs: BuffDefinition[];
  strategyOptions: WeaponArchetype[];
  activeStrategy: WeaponArchetype;
  selectionHint: string;
  actionReady: boolean;
}>();

defineEmits<{
  (e: 'show-help'): void;
  (e: 'toggle-action-log'): void;
  (e: 'close-panel'): void;
  (e: 'select-buff', buffId: BuffId): void;
  (e: 'select-strategy', strategy: WeaponArchetype): void;
  (e: 'plan-action', action: PlayerAction): void;
  (e: 'next-turn'): void;
}>();
</script>

<style scoped>
.ui-overlay {
  position: absolute;
  inset: 0;
  padding: 16px;
  pointer-events: none;
  color: #d8fff3;
  font-family: 'Space Mono', 'Courier New', monospace;
}

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}

.hud-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
}

.help-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(0, 255, 204, 0.5);
  background: rgba(0, 255, 204, 0.1);
  color: #00ffcc;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.help-btn:hover {
  background: rgba(0, 255, 204, 0.3);
  transform: scale(1.1);
}

.hud-top h1 {
  margin: 0;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.hud-top small {
  display: block;
  color: rgba(216, 255, 243, 0.8);
  margin-top: 4px;
}

.turn-chip {
  background: rgba(0, 255, 204, 0.15);
  border: 1px solid rgba(0, 255, 204, 0.4);
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.85rem;
  letter-spacing: 1px;
}

.rail {
  position: absolute;
  top: 64px;
  bottom: 12px;
  width: clamp(240px, 25vw, 360px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rail-left {
  left: 24px;
}

.rail-right {
  right: 24px;
}

.rail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
}

.rail-section--center {
  flex: 1;
}

.rail-section--center > * {
  flex: 1;
}

@media (max-width: 960px) {
  .ui-overlay {
    display: block;
  }

  .rail {
    position: absolute;
    width: auto;
    pointer-events: none;
  }

  .rail-left {
    top: 60px;
    left: 12px;
    width: 140px;
    bottom: auto;
    z-index: 10;
  }

  .rail-left .rail-section--bottom {
    position: fixed;
    bottom: 180px;
    left: 12px;
    right: 12px;
    width: auto;
    z-index: 20;
    pointer-events: none;
  }

  .rail-left .rail-section--bottom > * {
    pointer-events: auto;
  }

  .rail-right {
    top: auto;
    bottom: 12px;
    left: 12px;
    right: 12px;
    z-index: 30;
  }

  .rail-right .rail-section--top {
    display: none;
  }

  .rail-right .rail-section--center {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 320px;
    z-index: 100;
  }
}
</style>
