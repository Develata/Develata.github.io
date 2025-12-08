import { BaseEntity } from './BaseEntity';
import { EnemyTrait } from '../types';

export class Enemy extends BaseEntity {
  public hp: number;
  public maxHp: number;
  public traits: EnemyTrait[];
  public name: string = '未知实体';

  constructor(
    public readonly id: string,
    x: number,
    y: number,
    options: {
      hp: number;
      strength: number;
      radius: number;
      traits?: EnemyTrait[];
      name?: string;
    }
  ) {
    super(x, y);
    this.hp = options.hp;
    this.maxHp = options.hp;
    this.strength = options.strength;
    this.radius = options.radius;
    this.traits = options.traits ?? [];
    if (options.name) this.name = options.name;
  }

  public strength: number;
  public radius: number;

  update(): void {
    // TODO: 根据 traits 更新移动/隐匿行为
  }

  public applyDamage(amount: number): number {
    const next = Math.max(0, this.hp - amount);
    const delta = this.hp - next;
    this.hp = next;
    return delta;
  }

  public isDead(): boolean {
    return this.hp <= 0;
  }
}
