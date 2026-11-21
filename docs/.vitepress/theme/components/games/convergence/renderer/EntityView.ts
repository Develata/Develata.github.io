// renderer/EntityView.ts
import * as THREE from 'three';
import gsap from 'gsap';
import { GameState } from '../core/GameState';
import { FieldSystem } from '../core/math/FieldSystem';

export class EntityView {
  private playerMesh!: THREE.Mesh;
  private scene: THREE.Scene;
  private fieldSystem: FieldSystem;
  private gridOffset: number;
  private currentPosition = new THREE.Vector3();
  private enemyMeshes: THREE.Mesh[] = [];
  private enemyGeometry: THREE.SphereGeometry;
  private enemyMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, fieldSystem: FieldSystem) {
    this.scene = scene;
    this.fieldSystem = fieldSystem;
    
    // 计算网格偏移量，与 TerrainView 保持一致，确保对齐
    this.gridOffset = (fieldSystem.size - 1) / 2;

    this.createPlayerMesh();
    this.enemyGeometry = new THREE.SphereGeometry(0.35, 12, 12);
    this.enemyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffa200,
      emissive: 0xff5500,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.4,
    });
  }

  private createPlayerMesh() {
    // 玩家是一个发光的立方体 (Cyber Style)
    const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0088aa, // 自发光
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });

    this.playerMesh = new THREE.Mesh(geometry, material);
    // 初始不添加，等待 sync 第一次调用
    this.scene.add(this.playerMesh);
    this.currentPosition.copy(this.playerMesh.position);
  }

  /**
   * 将玩家 Mesh 同步到当前的 GameState 位置
   * @param gameState 当前状态
   * @param animate 是否使用动画 (初始化时为 false)
   */
  public sync(gameState: GameState, animate: boolean = true) {
    // 1. 逻辑坐标 -> 世界平面坐标
    // 注意：逻辑 y 对应 3D 场景的 z
    const targetX = gameState.playerX - this.gridOffset;
    const targetZ = gameState.playerY - this.gridOffset;

    // 2. 固定在网格平面上方一小段高度，移动与势函数无关
    const targetY = 0.3;

    const updateCachedPosition = () => {
      this.currentPosition.copy(this.playerMesh.position);
    };

    if (animate) {
      // 使用 GSAP 进行平滑移动
      gsap.to(this.playerMesh.position, {
        x: targetX,
        y: targetY,
        z: targetZ,
        duration: 0.3, // 300ms 动画
        ease: "power2.out",
        onUpdate: updateCachedPosition,
        onComplete: updateCachedPosition
      });
      
      // 添加一点“跳跃”感的缩放效果
      gsap.fromTo(this.playerMesh.scale, 
        { x: 1.2, y: 0.8, z: 1.2 }, 
        { x: 1, y: 1, z: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" }
      );

    } else {
      // 初始化直接设置
      this.playerMesh.position.set(targetX, targetY, targetZ);
      updateCachedPosition();
    }

    this.syncEnemies(gameState);
  }
  
  public getWorldPosition(target?: THREE.Vector3): THREE.Vector3 {
    if (target) {
      return target.copy(this.currentPosition);
    }

    return this.currentPosition.clone();
  }

  public getPlayerMesh(): THREE.Mesh {
    return this.playerMesh;
  }

  public getEnemyMeshes(): THREE.Mesh[] {
    return this.enemyMeshes;
  }
  
  public dispose(): void {
    gsap.killTweensOf(this.playerMesh.position);
    gsap.killTweensOf(this.playerMesh.scale);
    this.scene.remove(this.playerMesh);
    this.playerMesh.geometry.dispose();

    const material = this.playerMesh.material;
    if (Array.isArray(material)) {
      material.forEach((mat: THREE.Material) => mat.dispose());
    } else {
      material.dispose();
    }

    this.enemyMeshes.forEach((mesh) => {
      gsap.killTweensOf(mesh.position);
      gsap.killTweensOf(mesh.scale);
      this.scene.remove(mesh);
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        mat.forEach((m: THREE.Material) => m.dispose());
      } else {
        mat.dispose();
      }
    });
    this.enemyGeometry.dispose();
    this.enemyMaterial.dispose();
    this.enemyMeshes = [];
  }

  private syncEnemies(gameState: GameState) {
    const enemies = gameState.entities.getEnemies();
    this.ensureEnemyPool(enemies.length);
    const offset = this.gridOffset;

    enemies.forEach((enemy, index) => {
      const mesh = this.enemyMeshes[index];
      mesh.visible = true;
      // 敌人同样固定在网格平面上方，大小和颜色等仍可由势函数控制
      mesh.position.set(enemy.position.x - offset, 0.3, enemy.position.y - offset);
      const scale = THREE.MathUtils.clamp(Math.abs(enemy.strength) * 0.25, 0.6, 1.4);
      mesh.scale.setScalar(scale);
    });

    for (let i = enemies.length; i < this.enemyMeshes.length; i++) {
      this.enemyMeshes[i].visible = false;
    }
  }

  private ensureEnemyPool(targetCount: number) {
    while (this.enemyMeshes.length < targetCount) {
      const material = this.enemyMaterial.clone();
      const mesh = new THREE.Mesh(this.enemyGeometry, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.enemyMeshes.push(mesh);
    }
  }

  public setPlayerSelected(selected: boolean) {
    const targetScale = selected ? 1.2 : 1;
    gsap.to(this.playerMesh.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      duration: 0.25,
      ease: 'sine.out'
    });

    const material = this.playerMesh.material as THREE.MeshStandardMaterial;
    material.emissive.setHex(selected ? 0x00ffee : 0x0088aa);
  }
}
