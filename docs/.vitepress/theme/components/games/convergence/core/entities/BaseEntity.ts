import { Vector2 } from '../../types';

export abstract class BaseEntity {
  public position: Vector2;

  constructor(x: number, y: number) {
    this.position = { x, y };
  }

  abstract update(delta: number): void;
}
