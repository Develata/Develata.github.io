<template>
  <div class="game-container">
    <div ref="canvasContainer" class="canvas-wrapper"></div>

    <div class="ui-overlay" v-if="started">
      <header class="hud-top">
        <div class="hud-title-group">
          <div>
            <h1>收敛战线 · 梯度之战</h1>
            <p>{{ systemStatus }}</p>
            <small>{{ roomLabel }} ｜ {{ topologyLabel }}</small>
          </div>
          <button class="help-btn" @click="showHelp = true" title="操作说明">?</button>
        </div>
        <div class="turn-chip">第 {{ turnCount }} 回合</div>
      </header>

      <div class="rail rail-left">
        <div class="rail-section rail-section--top">
          <MiniMap :heatmap="heatmap" :player="entities.player" :enemies="entities.enemies" :grid-size="gridSize" />
        </div>
        <div class="rail-section rail-section--center">
          <ActionLog :entries="actionLog" :collapsed="actionLogCollapsed" @toggle="handleActionLogToggle" />
        </div>
        <div class="rail-section rail-section--bottom">
          <HUD v-if="interactionState.playerSelected" :stats="playerStats" :capacity="ammoCapacity"
            :strategy="activeStrategyLabel" :loss-value="lossValue" :turn="turnCount" mode="player" title="作战状态"
            :show-close="true" @close="handleClosePanel" />
          <HUD v-else-if="selectedEnemyStats" :stats="{ hp: selectedEnemyStats.hp, maxHp: selectedEnemyStats.maxHp }"
            :title="selectedEnemyStats.name" :traits="selectedEnemyStats.traits" mode="enemy" :show-close="true"
            @close="handleClosePanel" />
        </div>
      </div>

      <div class="rail rail-right">
        <div class="rail-section rail-section--top">
          <NetworkMap />
        </div>
        <div class="rail-section rail-section--center">
          <UpgradePanel v-if="pendingBuffs.length > 0" :buffs="pendingBuffs" @select="handleBuffSelect" />
        </div>
        <div class="rail-section rail-section--bottom">
          <div class="strategy-toggle">
            <span>武器流派</span>
            <button v-for="strategy in strategyOptions" :key="strategy" :class="{ active: strategy === activeStrategy }"
              @click="handleStrategySelect(strategy)">
              {{ formatStrategy(strategy) }}
            </button>
          </div>

          <div class="action-panel">
            <p>{{ selectionHint }}</p>
            <div class="action-buttons">
              <button :disabled="!interactionState.playerSelected"
                :class="{ active: interactionState.plannedAction === 'move' }" @click="planAction('move')">
                移动一格
              </button>
              <button :disabled="!interactionState.playerSelected"
                :class="{ active: interactionState.plannedAction === 'attack' }" @click="planAction('attack')">
                {{ interactionState.plannedAction === 'attack' ? '取消攻击' : '锁定攻击' }}
              </button>
            </div>
          </div>

          <div class="turn-control">
            <button :class="{ ready: actionReady }" @click="triggerNextTurn">
              <span class="label">下一回合</span>
              <span class="hint">Space / Enter</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="start-overlay">
      <div class="start-card">
        <button class="start-button" @click="startGame">START</button>
      </div>
    </div>

    <!-- Help Modal -->
    <div v-if="showHelp" class="help-overlay" @click.self="showHelp = false">
      <div class="help-card">
        <header>
          <h2>操作指引</h2>
          <button class="close-btn" @click="showHelp = false">×</button>
        </header>
        <div class="help-content">
          <ul>
            <li><strong>开始游戏</strong>：点击画面中的 START 按钮进入战场。</li>
            <li><strong>选择机体</strong>：用鼠标点击场景中的我方机体（蓝色立方体），左侧日志会记录你的每一步操作。</li>
            <li><strong>规划行动</strong>：
              <ul>
                <li>在右下角“行动面板”中选择 <strong>「移动一格」</strong> 或 <strong>「锁定攻击」</strong>。</li>
                <li>选择后，在地面点击一个网格：
                  <ul>
                    <li>移动模式：点击要前进的方向格子，下一回合会朝该方向迈出一格。</li>
                    <li>攻击模式：点击目标方向一次，出现霓虹预瞄准线，代表子弹的优化迭代轨迹。</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li><strong>执行回合</strong>：按右下角的 <strong>「下一回合」</strong> 按钮，或键盘 Space / Enter，执行目前选定的行动。</li>
            <li><strong>视角操作</strong>：拖拽鼠标旋转视角，滚轮缩放远近，仅影响观察，不改变机体位置。</li>
            <li><strong>小地图与场函数</strong>：
              <ul>
                <li>左上角小地图以伪彩热力展示场函数分布，同时标记玩家与敌人位置。</li>
                <li>场函数只影响数值与子弹行为，机体始终在平坦网格上运动。</li>
              </ul>
            </li>
            <li><strong>Buff 选择</strong>：击败敌人后会在右侧中部弹出 <strong>3 选 1 Buff</strong> 面板，点击其中一个即可获取对应增益，其等级取决于该敌人所在 ER
              节点的度数。</li>
          </ul>
        </div>
      </div>
    </div>
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
import HUD from './ui/HUD.vue';
import MiniMap from './ui/MiniMap.vue';
import NetworkMap from './ui/NetworkMap.vue';
import UpgradePanel from './ui/UpgradePanel.vue';
import ActionLog from './ui/ActionLog.vue';
import { SceneManager } from './renderer/SceneManager';
import { GRID_SIZE } from './config';
import { WeaponArchetype } from './core/types';
import type { InteractionState, EntitySnapshot, PlayerAction } from './application/types';
import type { PlayerStats, ActionLogEntry, BuffDefinition, BuffId, EnemyProfile } from './core/types';

const canvasContainer = ref<HTMLDivElement | null>(null);
let sceneManager: SceneManager | null = null;
const started = ref(false);
const systemStatus = ref('系统：初始化演算...');
const lossValue = ref(0);
const playerStats = ref<PlayerStats>({ hp: 0, maxHp: 0, ammo: 0, potions: 0 });
const selectedEnemyStats = ref<EnemyProfile | null>(null);
const ammoCapacity = ref(0);
const actionLog = ref<ActionLogEntry[]>([]);
const pendingBuffs = ref<BuffDefinition[]>([]);
const interactionState = ref<InteractionState>({
  playerSelected: false,
  selectedEnemyId: null,
  plannedAction: null,
  targetX: null,
  targetY: null,
});
const heatmap = ref<number[][]>([]);
const entities = ref<EntitySnapshot>({ player: { x: 0, y: 0 }, enemies: [] });
const activeStrategy = ref<WeaponArchetype>(WeaponArchetype.Gradient);
const strategyOptions = Object.values(WeaponArchetype) as WeaponArchetype[];
const topologyLabel = ref('拓扑加载中');
const roomLabel = ref('空间生成中');
const turnCount = ref(0);
const gridSize = GRID_SIZE;
const showHelp = ref(false);
const actionLogCollapsed = ref(true);

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

const activeStrategyLabel = computed(() => formatStrategy(activeStrategy.value));
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

let hudLoopId: number | null = null;

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  sceneManager?.dispose();
  sceneManager = null;
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeydown);
  if (hudLoopId !== null) {
    cancelAnimationFrame(hudLoopId);
    hudLoopId = null;
  }
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
  systemStatus.value = '';
  roomLabel.value = sceneManager.getRoomDescription();
  topologyLabel.value = sceneManager.getTopologyLabel();
  started.value = true;
  startHudLoop();
};

const startHudLoop = () => {
  const tick = () => {
    if (!sceneManager) return;
    lossValue.value = sceneManager.getPlayerLoss();
    activeStrategy.value = sceneManager.getActiveStrategy();
    turnCount.value = sceneManager.getTurnCount();
    topologyLabel.value = sceneManager.getTopologyLabel();
    roomLabel.value = sceneManager.getRoomDescription();
    playerStats.value = sceneManager.getPlayerStats();
    selectedEnemyStats.value = sceneManager.getSelectedEnemyStats();
    ammoCapacity.value = sceneManager.getAmmoCapacity();
    actionLog.value = sceneManager.getActionLog();
    pendingBuffs.value = sceneManager.getPendingBuffs();
    interactionState.value = sceneManager.getInteractionState();
    heatmap.value = sceneManager.getFieldHeatmap(36);
    entities.value = sceneManager.getEntitySnapshot();
    hudLoopId = requestAnimationFrame(tick);
  };

  hudLoopId = requestAnimationFrame(tick);
};

const handleStrategySelect = (strategy: WeaponArchetype) => {
  if (!sceneManager) return;
  sceneManager.setStrategy(strategy);
  activeStrategy.value = sceneManager.getActiveStrategy();
};

const planAction = (action: PlayerAction) => {
  if (!sceneManager) return;
  if (interactionState.value.plannedAction === action) {
    sceneManager.planAction(null);
  } else {
    sceneManager.planAction(action);
  }
  interactionState.value = sceneManager.getInteractionState();
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
  interactionState.value = sceneManager.getInteractionState();
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
  /* 确保不阻挡下方点击，但子元素需要 auto */
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

.rail-section--center>* {
  flex: 1;
}

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
  .game-container {
    aspect-ratio: 9 / 16;
    max-height: 85vh;
  }

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
    /* HUD 移动到底部，脱离左侧栏流 */
    position: fixed;
    bottom: 180px;
    left: 12px;
    right: 12px;
    width: auto;
    z-index: 20;
    pointer-events: none;
    /* 容器本身不阻挡点击 */
  }

  .rail-left .rail-section--bottom>* {
    pointer-events: auto;
    /* 内部内容可点击 */
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

  /* 优化移动端控件布局 */
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

  /* 升级面板在移动端全屏居中 */
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

.help-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.help-card {
  background: rgba(8, 12, 25, 0.95);
  border: 1px solid #00ffcc;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
  color: #d8fff3;
}

.help-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
}

.help-card h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #00ffcc;
}

.close-btn {
  background: none;
  border: none;
  color: #d8fff3;
  font-size: 24px;
  cursor: pointer;
  padding: 0 8px;
  line-height: 1;
}

.close-btn:hover {
  color: #fff;
}

.help-content {
  padding: 24px;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.6;
}

.help-content ul {
  margin: 0;
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 8px;
}

.help-content strong {
  color: #00ffcc;
}
</style>

