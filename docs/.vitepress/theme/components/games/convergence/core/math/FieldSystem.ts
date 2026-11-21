// core/math/FieldSystem.ts
import { Singularity } from '../types';

export class FieldSystem {
  public readonly size: number;
  public singularities: Singularity[] = [];
  public version = 0;
  private baseSingularities: Singularity[] = [];
  private entitySources = new Map<string, Singularity>();

  constructor(size: number = 20) {
    this.size = size;
  }

  /**
   * 添加一个影响场的奇异点 (例如：敌人或掩体)
   */
  public addSingularity(x: number, y: number, strength: number, radius: number = 2.0) {
    this.singularities.push({ x, y, strength, radius });
    this.version++;
  }

  public setBaseSingularities(list: Singularity[]): void {
    this.baseSingularities = list.map((s) => ({ ...s }));
    this.rebuild();
  }

  public setEntitySource(key: string, singularity: Singularity): void {
    this.entitySources.set(key, singularity);
    this.rebuild();
  }

  public removeEntitySource(key: string): void {
    this.entitySources.delete(key);
    this.rebuild();
  }

  private rebuild(): void {
    this.singularities = [
      ...this.baseSingularities,
      ...Array.from(this.entitySources.values()),
    ];
    this.version++;
  }

  /**
   * 清除所有奇异点 (用于重置关卡)
   */
  public clear() {
    this.singularities = [];
    this.baseSingularities = [];
    this.entitySources.clear();
    this.version++;
  }

  /**
   * CPU 侧计算特定坐标的高度 Z (Loss)
   * 公式: Sum( Strength * exp( -distance^2 / (2 * radius^2) ) )
   * 这与 Shader 中的逻辑必须保持一致
   */
  public getHeightAt(x: number, y: number): number {
    let z = 0;
    
    // 基础平面高度为 0
    // 叠加所有奇异点的影响
    for (const s of this.singularities) {
      const dx = x - s.x;
      const dy = y - s.y;
      const distSq = dx * dx + dy * dy;
      
      // 高斯衰减
      const influence = s.strength * Math.exp(-distSq / (2 * s.radius * s.radius));
      z += influence;
    }

    return z;
  }
}