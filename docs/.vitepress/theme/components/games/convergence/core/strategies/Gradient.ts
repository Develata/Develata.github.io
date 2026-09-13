import { WeaponStrategy } from './WeaponStrategy';
import { WeaponContext } from '../../types';
import { Point3D, Ballistics, BallisticType } from '../math/Ballistics';

export class GradientStrategy implements WeaponStrategy {
  public readonly name = 'Gradient';

  constructor(private readonly ballistics: Ballistics) {}

  simulate(context: WeaponContext): Point3D[] {
    return this.ballistics.simulatePath(
      context.originX,
      context.originY,
      context.dirX,
      context.dirY,
      BallisticType.Gradient,
      100,
      0.4
    );
  }
}
