// renderer/TerrainView.ts
import * as THREE from 'three';
import { FieldSystem } from '../core/math/FieldSystem';
import { terrainVertexShader } from './shaders/terrainVert';
import { terrainFragmentShader } from './shaders/terrainFrag';

export class TerrainView {
  private mesh: THREE.Mesh;
  private uniforms: {
    uBaseColor: { value: THREE.Color };
    uLineColor: { value: THREE.Color };
    uGridSize: { value: number };
    uLineWidth: { value: number };
    uTime: { value: number };
  };

  constructor(scene: THREE.Scene, fieldSystem: FieldSystem) {
    const size = fieldSystem.size;
    const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
    geometry.rotateX(-Math.PI / 2);

    this.uniforms = {
      uBaseColor: { value: new THREE.Color(0x050814) },
      uLineColor: { value: new THREE.Color(0x0aa3ff) },
      uGridSize: { value: size },
      uLineWidth: { value: 0.03 },
      uTime: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: this.uniforms,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = false;
    scene.add(this.mesh);
  }

  public update() {
    this.uniforms.uTime.value = performance.now() * 0.001;
  }

  public dispose(): void {
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.mesh.geometry.dispose();
    const material = this.mesh.material;
    if (Array.isArray(material)) {
      material.forEach((mat: THREE.Material) => mat.dispose());
    } else {
      material.dispose();
    }
  }
}