import * as THREE from 'three';
import { COLOR_PALETTE } from '../config';
import { CameraRig } from './CameraRig';
import { TerrainView } from './TerrainView';
import { VFXSystem } from './VFXSystem';

interface RenderDependencies {
  cameraRig: CameraRig;
  terrainView: TerrainView;
  vfxSystem: VFXSystem;
}

export class SceneShell {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  private starField: THREE.Points | null = null;

  constructor(private readonly container: HTMLDivElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLOR_PALETTE.background);
    this.scene.fog = new THREE.FogExp2(COLOR_PALETTE.fog, 0.02);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 5);
    this.camera.lookAt(0, 1.6, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.buildStarField();
  }

  applyRoomTheme(background: string) {
    const targetColor = new THREE.Color(background);
    this.scene.background = targetColor.clone();
    if (this.scene.fog) {
      this.scene.fog.color.copy(targetColor);
    }
  }

  renderFrame({ cameraRig, terrainView, vfxSystem }: RenderDependencies) {
    terrainView.update();
    cameraRig.update();
    if (this.starField) {
      this.starField.rotation.y += 0.0003;
    }
    vfxSystem.update();
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }

    if (this.starField) {
      this.scene.remove(this.starField);
      this.starField.geometry.dispose();
      this.starField.material.dispose();
      this.starField = null;
    }
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);
  }

  private buildStarField() {
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const index = i * 3;
      positions[index] = (Math.random() - 0.5) * 400;
      positions[index + 1] = Math.random() * 200 + 60;
      positions[index + 2] = (Math.random() - 0.5) * 400;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    this.starField = new THREE.Points(geometry, material);
    this.scene.add(this.starField);
  }
}
