// renderer/TrajectoryGhost.ts
import * as THREE from 'three';
import { FieldSystem } from '../core/math/FieldSystem';
import { Point3D } from '../core/math/Ballistics';

export class TrajectoryGhost {
  private line: THREE.Line;
  private geometry: THREE.BufferGeometry;
  private gridOffset: number;
  
  // 临时存储顶点数据 (最大步数 100)
  private positions = new Float32Array(100 * 3); 

  constructor(scene: THREE.Scene, fieldSystem: FieldSystem) {
    this.gridOffset = (fieldSystem.size - 1) / 2;

    // 初始化几何体
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    // 设置 drawRange 初始为 0，不显示
    this.geometry.setDrawRange(0, 0);

    // 材质：虚线效果
    const material = new THREE.LineBasicMaterial({
      color: 0xff0055, // 霓虹红，表示攻击路径
      linewidth: 2,    // 注意：WebGL 中 linewidth 通常只能是 1
      opacity: 0.7,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.line = new THREE.Line(this.geometry, material);
    // 稍微抬高一点点，防止与地面 Z-fighting
    this.line.position.y = 0.05; 
    scene.add(this.line);
  }

  public renderPath(path: Point3D[]): void {
    if (path.length === 0) {
      this.line.visible = false;
      return;
    }

    this.line.visible = true;
    const positions = this.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      positions[i * 3] = p.x - this.gridOffset;
      // 强制固定高度，避免因场函数数值为负导致线条穿模到地下
      // 与 EntityView 中的高度保持一致 (0.3)
      positions[i * 3 + 1] = 0.3; 
      positions[i * 3 + 2] = p.y - this.gridOffset;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.setDrawRange(0, path.length);
  }
  
  public setVisible(visible: boolean) {
    this.line.visible = visible;
  }

  public dispose() {
    this.line.parent?.remove(this.line);
    this.line.geometry.dispose();
    if (Array.isArray(this.line.material)) {
      this.line.material.forEach((m: THREE.Material) => m.dispose());
    } else {
      this.line.material.dispose();
    }
  }
}