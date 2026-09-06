import type { ActionLogEntry, BuffDefinition, EnemyProfile, PlayerStats, WeaponArchetype } from '../core/types';

export type PlayerAction = 'attack' | 'move';

export interface PathNode {
  x: number;
  y: number;
}

export interface InteractionState {
  playerSelected: boolean;
  selectedEnemyId: string | null;
  plannedAction: PlayerAction | null;
  targetX: number | null;
  targetY: number | null;
  movePath?: PathNode[];
}

export interface EntitySnapshot {
  player: { x: number; y: number };
  enemies: { id: string; x: number; y: number }[];
}

export interface SceneUiSnapshot {
  lossValue: number;
  playerStats: PlayerStats;
  selectedEnemyStats: EnemyProfile | null;
  ammoCapacity: number;
  actionLog: ActionLogEntry[];
  pendingBuffs: BuffDefinition[];
  interactionState: InteractionState;
  heatmap: number[][];
  entities: EntitySnapshot;
  activeStrategy: WeaponArchetype;
  topologyLabel: string;
  roomLabel: string;
  turnCount: number;
}
