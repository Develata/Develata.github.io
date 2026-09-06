// core/GameState.ts
import { FieldSystem } from './math/FieldSystem';
import { EntityManager } from './entities/EntityManager';
import { RoomLayoutResult } from './map/RoomLayout';
import { Enemy } from './entities/Enemy';
import { ActionLogEntry, ActionType, BuffDefinition, BuffId, PlayerStats, RoomTopology } from './types';
import { Topology } from './math/Topology';
import { BUFF_LIBRARY, PLAYER_BASE_STATS } from '../config';

export interface AttackResolution {
  enemyId: string | null;
  impactStep: number;
  friendlyFire?: boolean;
}

export class GameState {
  public playerX: number = 0;
  public playerY: number = 0;
  public turnCount: number = 0;

  private fieldSystem: FieldSystem;
  private topology: RoomTopology = RoomTopology.Plane;
  private readonly topologyMapper: Topology;
  public readonly entities = new EntityManager();
  private playerStats: PlayerStats;
  private ammoMax: number;
  private actionLog: ActionLogEntry[] = [];
  private pendingBuffs: BuffDefinition[] = [];
  private background = 0x000000;

  constructor(fieldSystem: FieldSystem) {
    this.fieldSystem = fieldSystem;
    this.topologyMapper = new Topology(fieldSystem.size);
    this.playerStats = {
      hp: PLAYER_BASE_STATS.hp,
      maxHp: PLAYER_BASE_STATS.hp,
      ammo: PLAYER_BASE_STATS.ammo,
      potions: PLAYER_BASE_STATS.potions,
    };
    this.ammoMax = PLAYER_BASE_STATS.ammo;
    this.centerPlayer();
  }

  private centerPlayer() {
    this.playerX = Math.floor(this.fieldSystem.size / 2);
    this.playerY = Math.floor(this.fieldSystem.size / 2);
  }

  public loadRoom(layout: RoomLayoutResult) {
    this.fieldSystem.clear();
    this.fieldSystem.setBaseSingularities(layout.baseField);

    this.entities.reset();
    layout.enemySeeds.forEach((seed) => {
      const enemy = new Enemy(seed.id, seed.singularity.x, seed.singularity.y, {
        hp: seed.hp,
        strength: seed.singularity.strength,
        radius: seed.singularity.radius,
        traits: seed.traits,
        name: seed.name,
      });
      this.entities.addEnemy(enemy);
      this.fieldSystem.setEntitySource(enemy.id, seed.singularity);
    });

    this.playerX = this.topologyMapper.clamp(layout.playerSpawn.x);
    this.playerY = this.topologyMapper.clamp(layout.playerSpawn.y);
    this.topology = layout.topology;
    this.turnCount = 0;
    this.background = layout.background;
    this.refreshPlayerField();
    this.actionLog = [{ turn: 0, summary: `${layout.label}：指挥官抵达阵面。` }];
  }

  private refreshPlayerField() {
    this.fieldSystem.setEntitySource('player', {
      x: this.playerX,
      y: this.playerY,
      strength: -4,
      radius: 2,
    });
  }

  public getBackgroundColor(): number {
    return this.background;
  }

  public getPlayerStats(): PlayerStats {
    return { ...this.playerStats };
  }

  public getActionLog(): ActionLogEntry[] {
    return this.actionLog.slice(-8);
  }

  public getPendingBuffs(): BuffDefinition[] {
    return this.pendingBuffs;
  }

  public getAmmoCapacity(): number {
    return this.ammoMax;
  }

  public consumeBuff(buffId: BuffId) {
    if (!this.pendingBuffs.find((buff) => buff.id === buffId)) return;
    switch (buffId) {
      case BuffId.Velocity:
        this.log(`动量注入`, '子弹初速度提高。');
        break;
      case BuffId.Iterations:
        this.log(`收敛加速`, '每回合额外迭代一次。');
        break;
      case BuffId.Clone:
        this.log(`影分裂`, '复制体将在后续版本中加入。');
        break;
      case BuffId.FieldRelief:
        this.log(`势能松弛`, '自身场函数浅化。');
        break;
      case BuffId.Potion:
        this.playerStats.potions += 1;
        this.log(`获得药剂`, '药水 +1。');
        break;
      case BuffId.Ammo:
        this.ammoMax += 1;
        this.playerStats.ammo = Math.min(this.playerStats.ammo + 1, this.ammoMax);
        this.log(`装药补给`, '弹药容量提升。');
        break;
    }
    this.pendingBuffs = [];
  }

  public movePlayer(dx: number, dy: number): boolean {
    const nextX = this.playerX + dx;
    const nextY = this.playerY + dy;

    let targetX = nextX;
    let targetY = nextY;

    switch (this.topology) {
      case RoomTopology.Torus:
        ({ x: targetX, y: targetY } = this.topologyMapper.toTorus(nextX, nextY));
        break;
      case RoomTopology.Mobius:
        ({ x: targetX, y: targetY } = this.topologyMapper.toMobius(nextX, nextY));
        break;
      case RoomTopology.Sphere:
        ({ x: targetX, y: targetY } = this.topologyMapper.toTorus(nextX, nextY));
        break;
      default:
        if (!this.isInside(nextX, nextY)) {
          return false;
        }
        break;
    }

    this.playerX = targetX;
    this.playerY = targetY;
    this.refreshPlayerField();
    this.advanceTurn(ActionType.Move, `移动至 (${targetX}, ${targetY})`);
    return true;
  }

  public resolveAttack(result: AttackResolution) {
    if (this.playerStats.ammo <= 0) {
      this.log('弹药不足', '需要补给后才能攻击。');
      return;
    }
    this.playerStats.ammo -= 1;

    if (result.enemyId) {
      const enemy = this.entities.findEnemy(result.enemyId);
      if (!enemy) return;
      const damage = Math.max(10, Math.floor(120 / Math.max(1, result.impactStep + 1)));
      enemy.applyDamage(damage);
      this.log('攻击结算', `${enemy.id} 受到 ${damage} 伤害。`);
      if (enemy.isDead()) {
        this.entities.removeEnemy(enemy.id);
        this.fieldSystem.removeEntitySource(enemy.id);
        this.rollBuffChoices();
        this.log('奇点平复', `${enemy.id} 被填平，出现算子奖励。`);
      }
    } else if (result.friendlyFire) {
      const damage = Math.max(5, Math.floor(60 / Math.max(1, result.impactStep + 1)));
      this.playerStats.hp = Math.max(0, this.playerStats.hp - damage);
      this.log('误伤警告', `自伤 ${damage}！`);
    } else {
      this.log('攻击', '子弹未命中目标。');
    }

    this.advanceTurn(ActionType.Attack, '完成一次攻击');
  }

  private rollBuffChoices() {
    const shuffled = [...BUFF_LIBRARY].sort(() => Math.random() - 0.5);
    this.pendingBuffs = shuffled.slice(0, 3);
  }

  public advanceTurn(action?: ActionType, summary?: string): void {
    this.turnCount++;
    this.entities.update(1 / 60);
    if (action && summary) {
      this.log(`第 ${this.turnCount} 回合`, `${ActionType.Attack === action ? '攻击' : '移动'}：${summary}`);
    }
  }

  public reloadAmmo(amount: number) {
    this.playerStats.ammo = Math.min(this.playerStats.ammo + amount, this.ammoMax);
  }

  public heal(amount: number) {
    this.playerStats.hp = Math.min(this.playerStats.hp + amount, this.playerStats.maxHp);
  }

  public getTopology(): RoomTopology {
    return this.topology;
  }

  private log(title: string, detail: string) {
    this.actionLog.push({ turn: this.turnCount, summary: `${title}｜${detail}` });
  }

  private isInside(x: number, y: number): boolean {
    return x >= 0 && x < this.fieldSystem.size && y >= 0 && y < this.fieldSystem.size;
  }
}