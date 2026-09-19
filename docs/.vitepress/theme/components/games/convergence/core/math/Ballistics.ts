// core/math/Ballistics.ts
import { FieldSystem } from './FieldSystem';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export enum BallisticType {
  Euclidean = 'EUCLIDEAN', // 直线步枪
  Gradient = 'GRADIENT'    // 梯度追踪导弹
}

export class Ballistics {
  private field: FieldSystem;

  constructor(field: FieldSystem) {
    this.field = field;
  }

  /**
   * 计算某一点的梯度向量 (∇F)
   * 使用中心差分法: f'(x) ≈ (f(x+h) - f(x-h)) / 2h
   */
  public getGradient(x: number, y: number): { x: number, y: number } {
    const h = 0.1; // 步长，越小越精确
    const z_x1 = this.field.getHeightAt(x + h, y);
    const z_x2 = this.field.getHeightAt(x - h, y);
    const z_y1 = this.field.getHeightAt(x, y + h);
    const z_y2 = this.field.getHeightAt(x, y - h);

    return {
      x: (z_x1 - z_x2) / (2 * h),
      y: (z_y1 - z_y2) / (2 * h)
    };
  }

  /**
   * 模拟路径
   * @param startX 起始 X (Grid Space)
   * @param startY 起始 Y (Grid Space)
   * @param dirX 方向向量 X (归一化)
   * @param dirY 方向向量 Y (归一化)
   * @param type 弹道类型
   * @param steps 模拟步数
   * @param speed 初始速度 (学习率/步长)
   */
  public simulatePath(
    startX: number, 
    startY: number, 
    dirX: number, 
    dirY: number, 
    type: BallisticType,
    steps: number = 60,
    speed: number = 0.5
  ): Point3D[] {
    const path: Point3D[] = [];
    
    // 初始状态
    let px = startX;
    let py = startY;
    let vx = dirX * speed;
    let vy = dirY * speed;

    // 参数：动量保留率 (0.9 类似于优化器中的 momentum 参数)
    const momentum = 0.9; 
    // 参数：梯度影响率 (也就是 Learning Rate / Gravity)
    const learningRate = 0.3; 

    for (let i = 0; i < steps; i++) {
      // 1. 记录当前点
      const pz = this.field.getHeightAt(px, py);
      path.push({ x: px, y: py, z: pz });

      // 2. 更新位置 (p += v)
      px += vx;
      py += vy;

      // 3. 根据类型更新速度
      if (type === BallisticType.Gradient) {
        // 计算梯度 (即地形倾斜度)
        const grad = this.getGradient(px, py);
        
        // 速度更新公式: v_new = v_old * momentum - gradient * lr
        // 负梯度方向即下降方向
        vx = vx * momentum - grad.x * learningRate;
        vy = vy * momentum - grad.y * learningRate;
      } else {
        // Euclidean 模式：速度恒定 (或者只受简单阻力)
        // 这里我们让它保持匀速直线
      }

      // 4. 边界检查 (简单的出界停止)
      if (px < 0 || px > this.field.size || py < 0 || py > this.field.size) {
        break;
      }
    }

    return path;
  }
}