import { BaseEntity } from './BaseEntity';

export class Construct extends BaseEntity {
  public charge = 0;

  update(delta: number): void {
    this.charge = Math.min(1, this.charge + delta * 0.1);
  }
}
