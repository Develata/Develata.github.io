import { WeaponStrategy } from './WeaponStrategy';
import { WeaponContext } from '../../types';
import { Point3D } from '../math/Ballistics';
import { FieldSystem } from '../math/FieldSystem';

export class EuclideanStrategy implements WeaponStrategy {
  public readonly name = 'Euclidean';

  constructor(private readonly field: FieldSystem) {}

  simulate(context: WeaponContext): Point3D[] {
    const { originX, originY, dirX, dirY } = context;
    const points: Point3D[] = [];
    let x = originX;
    let y = originY;

    for (let i = 0; i < 80; i++) {
      const z = this.field.getHeightAt(x, y);
      points.push({ x, y, z });
      x += dirX * 0.4;
      y += dirY * 0.4;
    }

    return points;
  }
}
