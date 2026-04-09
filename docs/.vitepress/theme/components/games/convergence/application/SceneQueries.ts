import { FieldSystem } from '../core/math/FieldSystem';
import { GameState } from '../core/GameState';
import type { RoomLayoutResult } from '../core/map/RoomLayout';
import type { ActionLogEntry, BuffDefinition, BuffId, EnemyProfile, PlayerStats, RoomTopology } from '../core/types';
import type { EntitySnapshot } from './types';

interface HeatmapCache {
  data: number[][] | null;
  lastFieldVersion: number;
  lastResolution: number;
}

export class SceneQueries {
  private cache: HeatmapCache = { data: null, lastFieldVersion: -1, lastResolution: 0 };

  constructor(
    private readonly fieldSystem: FieldSystem,
    private readonly gameState: GameState,
    private readonly getCurrentRoom: () => RoomLayoutResult | null,
    private readonly getSelectedEnemyId: () => string | null
  ) {}

  getSelectedEnemyStats(): EnemyProfile | null {
    const selectedEnemyId = this.getSelectedEnemyId();
    if (!selectedEnemyId) return null;
    const enemy = this.gameState.entities.findEnemy(selectedEnemyId);
    if (!enemy) return null;
    return {
      id: enemy.id,
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      traits: enemy.traits,
      singularity: {
        x: enemy.x,
        y: enemy.y,
        strength: enemy.strength,
        radius: enemy.radius,
      },
    };
  }

  getPlayerLoss(): number {
    return this.fieldSystem.getHeightAt(this.gameState.playerX, this.gameState.playerY);
  }

  getTurnCount(): number {
    return this.gameState.turnCount;
  }

  getRoomDescription(): string {
    return this.getCurrentRoom()?.label ?? '未初始化空间';
  }

  getTopologyLabel(): string {
    return this.describeTopology(this.gameState.getTopology());
  }

  getRoomSeed(): number | null {
    return this.getCurrentRoom()?.seed ?? null;
  }

  getPlayerStats(): PlayerStats {
    return this.gameState.getPlayerStats();
  }

  getAmmoCapacity(): number {
    return this.gameState.getAmmoCapacity();
  }

  getActionLog(): ActionLogEntry[] {
    return this.gameState.getActionLog();
  }

  getPendingBuffs(): BuffDefinition[] {
    return this.gameState.getPendingBuffs();
  }

  consumeBuff(buffId: BuffId) {
    this.gameState.consumeBuff(buffId);
  }

  getFieldHeatmap(resolution = 32): number[][] {
    if (
      this.cache.data &&
      this.fieldSystem.version === this.cache.lastFieldVersion &&
      this.cache.lastResolution === resolution
    ) {
      return this.cache.data;
    }

    const size = Math.max(4, Math.floor(resolution));
    const data: number[][] = [];
    let min = Infinity;
    let max = -Infinity;

    for (let y = 0; y < size; y++) {
      const row: number[] = [];
      for (let x = 0; x < size; x++) {
        const sampleX = (x / size) * this.fieldSystem.size;
        const sampleY = (y / size) * this.fieldSystem.size;
        const height = this.fieldSystem.getHeightAt(sampleX, sampleY);
        min = Math.min(min, height);
        max = Math.max(max, height);
        row.push(height);
      }
      data.push(row);
    }

    const range = max - min || 1;
    this.cache.data = data.map((row) => row.map((value) => (value - min) / range));
    this.cache.lastFieldVersion = this.fieldSystem.version;
    this.cache.lastResolution = resolution;
    return this.cache.data;
  }

  getEntitySnapshot(): EntitySnapshot {
    return {
      player: { x: this.gameState.playerX, y: this.gameState.playerY },
      enemies: this.gameState.entities.getEnemies().map((enemy) => ({
        id: enemy.id,
        x: enemy.position.x,
        y: enemy.position.y,
      })),
    };
  }

  private describeTopology(topology?: RoomTopology): string {
    switch (topology) {
      case RoomTopology.Torus:
        return '环面拓扑';
      case RoomTopology.Mobius:
        return '莫比乌斯拓扑';
      case RoomTopology.Plane:
        return '欧氏平面';
      default:
        return '未知拓扑';
    }
  }
}
