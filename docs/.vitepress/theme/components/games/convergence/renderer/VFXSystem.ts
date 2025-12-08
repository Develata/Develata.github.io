import * as THREE from 'three';

export class VFXSystem {
  private flashes: THREE.Points[] = [];

  constructor(private readonly scene: THREE.Scene) {}

  public spawnFlash(position: THREE.Vector3): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([position.clone()]);
    const material = new THREE.PointsMaterial({ color: 0xff66aa, size: 0.2 });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.flashes.push(points);
    setTimeout(() => this.disposeFlash(points), 500);
  }

  public update(): void {
    // 预留
  }

  public dispose(): void {
    this.flashes.forEach((flash) => this.disposeFlash(flash));
    this.flashes = [];
  }

  private disposeFlash(points: THREE.Points): void {
    if (points.parent) {
      points.parent.remove(points);
    }
    points.geometry.dispose();
    if (!Array.isArray(points.material)) {
      points.material.dispose();
    }
  }
}
