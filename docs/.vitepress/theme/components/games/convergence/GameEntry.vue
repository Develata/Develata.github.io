<template>
  <div class="game-container">
    <div ref="canvasContainer" class="canvas-wrapper"></div>

    <GameOverlay
      v-if="started"
      :system-status="systemStatus"
      :room-label="roomLabel"
      :topology-label="topologyLabel"
      :turn-count="turnCount"
      :grid-size="gridSize"
      :heatmap="heatmap"
      :entities="entities"
      :action-log="actionLog"
      :action-log-collapsed="actionLogCollapsed"
      :interaction-state="interactionState"
      :player-stats="playerStats"
      :ammo-capacity="ammoCapacity"
      :active-strategy-label="activeStrategyLabel"
      :loss-value="lossValue"
      :selected-enemy-stats="selectedEnemyStats"
      :pending-buffs="pendingBuffs"
      :strategy-options="strategyOptions"
      :active-strategy="activeStrategy"
      :selection-hint="selectionHint"
      :action-ready="actionReady"
      @show-help="showHelp = true"
      @toggle-action-log="handleActionLogToggle"
      @close-panel="handleClosePanel"
      @select-buff="handleBuffSelect"
      @select-strategy="handleStrategySelect"
      @plan-action="planAction"
      @next-turn="triggerNextTurn"
    />

    <div v-else class="start-overlay">
      <div class="start-card">
        <button class="start-button" @click="startGame">START</button>
      </div>
    </div>

    <HelpModal v-if="showHelp" @close="showHelp = false" />
  </div>
</template>

<!--
  @file GameEntry.vue
  @description 收敛游戏入口 (Convergence Game Entry)
  职责：
  1. 初始化游戏核心 (GameCore) 和渲染器 (SceneManager)。
  2. 管理游戏主循环 (Animation Loop)。
  3. 处理 UI 面板显示与隐藏 (Player HUD, Inventory, etc.)。
-->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import HelpModal from './ui/HelpModal.vue';
import GameOverlay from './ui/GameOverlay.vue';
import { SceneManager } from './renderer/SceneManager';
import { GRID_SIZE } from './config';
import { WeaponArchetype } from './core/types';
import type { BuffId } from './core/types';
import type { PlayerAction } from './application/types';
import { useSceneUiState } from './application/useSceneUiState';

const canvasContainer = ref<HTMLDivElement | null>(null);
let sceneManager: SceneManager | null = null;
let stopUiSubscription: (() => void) | null = null;
const started = ref(false);
const systemStatus = ref('系统：初始化演算...');
const {
  lossValue,
  playerStats,
  selectedEnemyStats,
  ammoCapacity,
  actionLog,
  pendingBuffs,
  interactionState,
  heatmap,
  entities,
  activeStrategy,
  topologyLabel,
  roomLabel,
  turnCount,
  bindSceneManager,
} = useSceneUiState();
const strategyOptions = Object.values(WeaponArchetype) as WeaponArchetype[];
const gridSize = GRID_SIZE;
const showHelp = ref(false);
const actionLogCollapsed = ref(true);

const activeStrategyLabel = computed(() => {
  switch (activeStrategy.value) {
    case WeaponArchetype.Euclidean:
      return '欧氏火线';
    case WeaponArchetype.Distributed:
      return '分布蜂群';
    case WeaponArchetype.Gradient:
    default:
      return '梯度枪刃';
  }
});
const actionReady = computed(
  () => interactionState.value.playerSelected && interactionState.value.plannedAction !== null
);
const selectionHint = computed(() => {
  if (!interactionState.value.playerSelected) {
    return '点击战场中的机体以规划攻击或移动。';
  }
  if (!interactionState.value.plannedAction) {
    return '在右下选择“移动”或“锁定攻击”。';
  }
  if (interactionState.value.plannedAction === 'attack') {
    if (interactionState.value.targetX == null || interactionState.value.targetY == null) {
      return '攻击模式：在地面点击一次以锁定射击方向。';
    }
    return '攻击已锁定，再次点击“锁定攻击”可取消。';
  }
  if (interactionState.value.plannedAction === 'move') {
    if (interactionState.value.targetX == null || interactionState.value.targetY == null) {
      return '移动模式：在地面点击一次以选定目标格。';
    }
    return '目标格已标记，按下下一回合执行移动。';
  }
  return '';
});
onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  stopUiSubscription?.();
  stopUiSubscription = null;
  sceneManager?.dispose();
  sceneManager = null;
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeydown);
});

const handleKeydown = (event: KeyboardEvent) => {
  if (!sceneManager) return;
  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    triggerNextTurn();
    return;
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
  }

  sceneManager.handleInput(event.key);
};

const handleResize = () => {
  sceneManager?.onWindowResize();
};

const startGame = () => {
  if (started.value) return;
  if (!canvasContainer.value) return;
  sceneManager = new SceneManager(canvasContainer.value);
  stopUiSubscription = bindSceneManager(sceneManager);
  systemStatus.value = '';
  started.value = true;
};

const handleStrategySelect = (strategy: WeaponArchetype) => {
  if (!sceneManager) return;
  sceneManager.setStrategy(strategy);
};

const planAction = (action: PlayerAction) => {
  if (!sceneManager) return;
  if (interactionState.value.plannedAction === action) {
    sceneManager.planAction(null);
  } else {
    sceneManager.planAction(action);
  }
};

const triggerNextTurn = () => {
  if (!sceneManager) return;
  sceneManager.executeTurn();
};

const handleBuffSelect = (buffId: BuffId) => {
  if (!sceneManager) return;
  sceneManager.consumeBuff(buffId);
};

const handleClosePanel = () => {
  if (!sceneManager) return;
  sceneManager.deselectAll();
};

const handleActionLogToggle = () => {
  actionLogCollapsed.value = !actionLogCollapsed.value;
  if (!actionLogCollapsed.value) {
    handleClosePanel();
  }
};
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  /* 高度完全由外层 16:9 容器控制，这里不再拉伸 */
  background: #02030b;
  overflow: hidden;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
}

.start-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 20% 20%, rgba(0, 255, 204, 0.2), transparent 55%),
    radial-gradient(circle at 80% 80%, rgba(0, 102, 255, 0.3), transparent 55%),
    #02030b;
}

.start-card {
  padding: 32px 48px;
  border-radius: 18px;
  border: 1px solid rgba(0, 255, 204, 0.6);
  backdrop-filter: blur(18px);
  background: rgba(2, 8, 20, 0.75);
}

.start-button {
  min-width: 200px;
  padding: 16px 32px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.9rem;
  color: #021010;
  background: linear-gradient(120deg, #00ffcc, #00c3ff);
  box-shadow: 0 12px 35px rgba(0, 255, 204, 0.45);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 45px rgba(0, 255, 204, 0.55);
  filter: brightness(1.05);
}

@media (max-width: 960px) {
  .game-container {
    aspect-ratio: 9 / 16;
    max-height: 85vh;
  }
}
</style>

