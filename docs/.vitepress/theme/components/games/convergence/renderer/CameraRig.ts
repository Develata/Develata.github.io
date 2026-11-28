import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraRig {
  private controls: OrbitControls;
  private target = new THREE.Vector3();
  private desired = new THREE.Vector3();
  private offset = new THREE.Vector3(6, 8, 6);
  private readonly camera: THREE.PerspectiveCamera;

  constructor(camera: THREE.PerspectiveCamera, dom: HTMLCanvasElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, dom);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 26;
    this.controls.minPolarAngle = Math.PI * 0.2;
    this.controls.maxPolarAngle = Math.PI * 0.6;
  }

  public setOffset(x: number, y: number, z: number) {
    this.offset.set(x, y, z);
  }

  public follow(position: THREE.Vector3, immediate = false) {
    this.target.copy(position);
    
    // 移动端竖屏时，将相机目标点向上偏移，使玩家显示在屏幕偏上方
    // 避免被底部的 UI 遮挡
    if (window.innerWidth < 960 && window.innerHeight > window.innerWidth) {
      // 这里的偏移量需要根据实际 UI 高度微调
      // 假设 UI 占底部 30-40%，我们将目标点向 Z 轴负方向（屏幕上方）移动
      // 或者直接修改 controls.target 的偏移
      // 但 OrbitControls 会强制看向 target。
      // 如果我们想让玩家显示在屏幕上方，我们需要让 camera 看向玩家下方的一个点。
      // 这样玩家就会出现在屏幕上方。
      this.target.add(new THREE.Vector3(0, 0, 2.5)); 
    }

    this.desired.copy(position).add(this.offset);
    if (immediate) {
      this.camera.position.copy(this.desired);
    } else {
      this.camera.position.lerp(this.desired, 0.15);
    }
    this.controls.target.copy(this.target);
  }

  public update(): void {
    this.controls.update();
  }

  public getForwardDirection(target = new THREE.Vector3()): THREE.Vector3 {
    this.camera.getWorldDirection(target);
    target.y = 0;
    if (target.lengthSq() === 0) target.set(0, 0, -1);
    return target.normalize();
  }

  public getRightDirection(target = new THREE.Vector3()): THREE.Vector3 {
    this.getForwardDirection(target);
    target.cross(new THREE.Vector3(0, 1, 0));
    if (target.lengthSq() === 0) target.set(1, 0, 0);
    target.y = 0;
    return target.normalize();
  }

  public dispose(): void {
    this.controls.dispose();
  }
}
