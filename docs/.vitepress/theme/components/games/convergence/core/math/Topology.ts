import { GRID_SIZE } from '../../config';

export class Topology {
  constructor(private readonly size = GRID_SIZE) {}

  public clamp(value: number): number {
    if (value < 0) return 0;
    if (value >= this.size) return this.size - 1;
    return value;
  }

  public wrapX(x: number): number {
    return (x % this.size + this.size) % this.size;
  }

  public wrapY(y: number): number {
    return (y % this.size + this.size) % this.size;
  }

  public toTorus(x: number, y: number): { x: number; y: number } {
    return { x: this.wrapX(x), y: this.wrapY(y) };
  }

  public toPlane(x: number, y: number): { x: number; y: number } {
    return { x: this.clamp(x), y: this.clamp(y) };
  }

  public toMobius(x: number, y: number): { x: number; y: number } {
    let nextX = x;
    let nextY = y;

    if (x < 0) {
      nextX = this.size - 1;
      nextY = this.size - 1 - this.wrapY(y);
    } else if (x >= this.size) {
      nextX = 0;
      nextY = this.size - 1 - this.wrapY(y);
    }

    nextY = this.clamp(nextY);
    nextX = this.clamp(nextX);
    return { x: nextX, y: nextY };
  }
}
