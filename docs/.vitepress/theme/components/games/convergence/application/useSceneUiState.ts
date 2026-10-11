import { ref, type Ref } from 'vue';
import { WeaponArchetype } from '../core/types';
import type {
  ActionLogEntry,
  BuffDefinition,
  BuffId,
  EnemyProfile,
  PlayerStats,
} from '../core/types';
import type { EntitySnapshot, InteractionState, SceneUiSnapshot } from './types';
import type { SceneManager } from '../renderer/SceneManager';

export interface SceneUiRefs {
  lossValue: Ref<number>;
  playerStats: Ref<PlayerStats>;
  selectedEnemyStats: Ref<EnemyProfile | null>;
  ammoCapacity: Ref<number>;
  actionLog: Ref<ActionLogEntry[]>;
  pendingBuffs: Ref<BuffDefinition[]>;
  interactionState: Ref<InteractionState>;
  heatmap: Ref<number[][]>;
  entities: Ref<EntitySnapshot>;
  activeStrategy: Ref<WeaponArchetype>;
  topologyLabel: Ref<string>;
  roomLabel: Ref<string>;
  turnCount: Ref<number>;
}

function cloneInteractionState(state: InteractionState): InteractionState {
  return {
    ...state,
    movePath: state.movePath?.map((node) => ({ ...node })),
  };
}

export function useSceneUiState() {
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
  const topologyLabel = ref('拓扑加载中');
  const roomLabel = ref('空间生成中');
  const turnCount = ref(0);

  const applySnapshot = (snapshot: SceneUiSnapshot) => {
    lossValue.value = snapshot.lossValue;
    playerStats.value = snapshot.playerStats;
    selectedEnemyStats.value = snapshot.selectedEnemyStats;
    ammoCapacity.value = snapshot.ammoCapacity;
    actionLog.value = snapshot.actionLog;
    pendingBuffs.value = snapshot.pendingBuffs;
    interactionState.value = cloneInteractionState(snapshot.interactionState);
    heatmap.value = snapshot.heatmap;
    entities.value = snapshot.entities;
    activeStrategy.value = snapshot.activeStrategy;
    topologyLabel.value = snapshot.topologyLabel;
    roomLabel.value = snapshot.roomLabel;
    turnCount.value = snapshot.turnCount;
  };

  const bindSceneManager = (sceneManager: SceneManager) => sceneManager.subscribeUiState(applySnapshot);

  return {
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
  };
}
