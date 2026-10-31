import { WeaponContext } from '../../types';
import { Point3D } from '../math/Ballistics';

export interface WeaponStrategy {
  readonly name: string;
  simulate(context: WeaponContext): Point3D[];
}
