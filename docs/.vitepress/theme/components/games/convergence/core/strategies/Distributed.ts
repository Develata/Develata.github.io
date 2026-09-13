import { WeaponStrategy } from './WeaponStrategy';
import { WeaponContext } from '../../types';
import { Point3D } from '../math/Ballistics';

export class DistributedStrategy implements WeaponStrategy {
  public readonly name = 'Distributed';

  simulate(_: WeaponContext): Point3D[] {
    // TODO: 实现分布式协同策略，目前返回空路径
    return [];
  }
}
