import * as THREE from 'three';

export class VFXSystem {
  private flashes = new Set<THREE.Points>();
  private flashTimers = new Map<THREE.Points, number>();

  constructor(private readonly scene: THREE.Scene) {}

  public spawnFlash(position: THREE.Vector3): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([position.clone()]);
    const material = new THREE.PointsMaterial({ color: 0xff66aa, size: 0.2 });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.flashes.add(points);
    const timerId = window.setTimeout(() => this.disposeFlash(points), 500);
    this.flashTimers.set(points, timerId);
  }

  public update(): void {
    // 预留
  }

  public dispose(): void {
    this.flashes.forEach((flash) => this.disposeFlash(flash));
    this.flashes.clear();
    this.flashTimers.clear();
  }

  private disposeFlash(points: THREE.Points): void {
    const timerId = this.flashTimers.get(points);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.flashTimers.delete(points);
    }
    if (points.parent) {
      points.parent.remove(points);
    }
    this.flashes.delete(points);
    points.geometry.dispose();
    if (Array.isArray(points.material)) {
      points.material.forEach((material) => material.dispose());
    } else {
      points.material.dispose();
    }
  }
}
