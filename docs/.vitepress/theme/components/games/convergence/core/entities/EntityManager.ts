import { BaseEntity } from './BaseEntity';
import { Enemy } from './Enemy';
import { Construct } from './Construct';

export class EntityManager {
  private enemies: Enemy[] = [];
  private constructs: Construct[] = [];

  public addEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
  }

  public addConstruct(construct: Construct): void {
    this.constructs.push(construct);
  }

  public update(delta: number): void {
    [...this.enemies, ...this.constructs].forEach((entity) => entity.update(delta));
  }

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  public findEnemy(id: string): Enemy | undefined {
    return this.enemies.find((enemy) => enemy.id === id);
  }

  public removeEnemy(id: string): void {
    this.enemies = this.enemies.filter((enemy) => enemy.id !== id);
  }

  public reset(): void {
    this.enemies = [];
    this.constructs = [];
  }
}
