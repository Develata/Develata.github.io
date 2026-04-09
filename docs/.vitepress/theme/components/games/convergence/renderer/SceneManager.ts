// renderer/SceneManager.ts
import * as THREE from 'three';
import { FieldSystem } from '../core/math/FieldSystem';
import { GameState, AttackResolution } from '../core/GameState';
import { TerrainView } from './TerrainView';
import { EntityView } from './EntityView';
import { TrajectoryGhost } from './TrajectoryGhost';
import { Ballistics } from '../core/math/Ballistics';
import { CameraRig } from './CameraRig';
import { VFXSystem } from './VFXSystem';
import { RoomLayout, RoomLayoutResult } from '../core/map/RoomLayout';
import { GRID_SIZE, COLOR_PALETTE } from '../config';
import { WeaponArchetype } from '../core/types';
import type { ActionLogEntry, BuffDefinition, BuffId, EnemyProfile, PlayerStats } from '../core/types';
import { WeaponStrategy } from '../core/strategies/WeaponStrategy';
import { EuclideanStrategy } from '../core/strategies/Euclidean';
import { GradientStrategy } from '../core/strategies/Gradient';
import { DistributedStrategy } from '../core/strategies/Distributed';
import { SceneQueries } from '../application/SceneQueries';
import type { EntitySnapshot, InteractionState, PlayerAction } from '../application/types';
import { TurnController } from '../application/TurnController';
import { InteractionController } from '../application/InteractionController';

export class SceneManager {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationId: number | null = null;
  private cameraRig: CameraRig;
  private playerWorldPosition = new THREE.Vector3();
  private forwardDir = new THREE.Vector3();
  private rightDir = new THREE.Vector3();
  private tempDir = new THREE.Vector3();
  private lastAimDir: { x: number; y: number } | null = null;
  private interactionState: InteractionState = {
    playerSelected: false,
    selectedEnemyId: null,
    plannedAction: null,
    targetX: null,
    targetY: null,
  };
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  // 游戏核心与视图组件
  private fieldSystem: FieldSystem;
  private gameState: GameState;
  private terrainView: TerrainView;
  private entityView: EntityView;
  private trajectoryGhost: TrajectoryGhost;
  private vfxSystem: VFXSystem;
  private ballistics: Ballistics;
  private strategies: Record<WeaponArchetype, WeaponStrategy>;
  private activeStrategy: WeaponArchetype = WeaponArchetype.Gradient;
  private currentRoom: RoomLayoutResult | null = null;
  private roomLayout = new RoomLayout();
  private queries: SceneQueries;
  private turnController: TurnController;
  private interactionController: InteractionController;
  private starField: THREE.Points | null = null;
  private handleCanvasClick = (event: MouseEvent) => {
    this.interactionController.handleCanvasClick(event);
  };

  constructor(container: HTMLDivElement) {
    this.container = container;

    // --- 1. 基础 Three.js 环境初始化 ---
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
      powerPreference: 'high-performance' 
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.buildStarField();

    this.cameraRig = new CameraRig(this.camera, this.renderer.domElement);

    // --- 2. 游戏核心逻辑初始化 (Phase 2 & 3) ---
    this.fieldSystem = new FieldSystem(GRID_SIZE);
    this.gameState = new GameState(this.fieldSystem);
    this.currentRoom = this.roomLayout.generate();
    this.gameState.loadRoom(this.currentRoom);
    this.queries = new SceneQueries(
      this.fieldSystem,
      this.gameState,
      () => this.currentRoom,
      () => this.interactionState.selectedEnemyId
    );
    this.applyRoomTheme();

    // --- 3. 视图组件初始化 (Phase 2 & 3 & 4) ---
    this.terrainView = new TerrainView(this.scene, this.fieldSystem);
    this.entityView = new EntityView(this.scene, this.fieldSystem);

    this.trajectoryGhost = new TrajectoryGhost(this.scene, this.fieldSystem);
    this.vfxSystem = new VFXSystem(this.scene);
    this.ballistics = new Ballistics(this.fieldSystem);
    this.strategies = {
      [WeaponArchetype.Euclidean]: new EuclideanStrategy(this.fieldSystem),
      [WeaponArchetype.Gradient]: new GradientStrategy(this.ballistics),
      [WeaponArchetype.Distributed]: new DistributedStrategy(),
    };
    this.turnController = new TurnController({
      gameState: this.gameState,
      cameraRig: this.cameraRig,
      interactionState: this.interactionState,
      forwardDir: this.forwardDir,
      strategies: this.strategies,
      getActiveStrategy: () => this.activeStrategy,
      getLastAimDir: () => this.lastAimDir,
      setPlayerSelection: (selected) => this.setPlayerSelection(selected),
      syncPlayerView: () => this.syncPlayerView(),
      updateAimFromCamera: (force) => this.updateAimFromCamera(force),
    });
    this.interactionController = new InteractionController({
      camera: this.camera,
      domElement: this.renderer.domElement,
      groundPlane: this.groundPlane,
      fieldSystem: this.fieldSystem,
      gameState: this.gameState,
      entityView: this.entityView,
      interactionState: this.interactionState,
      setPlayerSelection: (selected) => this.setPlayerSelection(selected),
      updateAim: (dirX, dirY) => this.updateAim(dirX, dirY),
    });
    
    // 初始同步玩家和敌人位置，并将相机放到玩家视角
    this.syncPlayerView(false);
    this.updateAimFromCamera(true);

    this.renderer.domElement.addEventListener('click', this.handleCanvasClick);

    // --- 4. 事件监听 ---
    // --- 5. 开始循环 ---
    this.animate();
  }

  private setPlayerSelection(selected: boolean) {
    if (!this.entityView) return;
    
    // 如果选中玩家，必须先取消选中敌人
    if (selected) {
      this.interactionState.selectedEnemyId = null;
    }

    this.interactionState.playerSelected = selected;
    if (!selected) {
      this.interactionState.plannedAction = null;
      this.interactionState.targetX = null;
      this.interactionState.targetY = null;
      this.trajectoryGhost?.setVisible(false);
    }
    this.entityView.setPlayerSelected(selected);
  }

  public deselectAll() {
    this.interactionController.deselectAll();
  }

  private applyRoomTheme() {
    if (!this.currentRoom) return;
    const targetColor = new THREE.Color(this.currentRoom.background);
    this.scene.background = targetColor.clone();
    if (this.scene.fog) {
      this.scene.fog.color.copy(targetColor);
    }
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); 
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);
  }

  private buildStarField(): void {
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 400;
      positions[i3 + 1] = Math.random() * 200 + 60;
      positions[i3 + 2] = (Math.random() - 0.5) * 400;
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

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.render();
  };

  private render(): void {
    // 每一帧都需要更新地形的 Uniforms
    if (this.terrainView) this.terrainView.update();
    
    this.cameraRig.update();
    if (this.starField) {
      this.starField.rotation.y += 0.0003;
    }
    // this.updateAimFromCamera(); // Removed to prevent overwriting manual aim
    this.vfxSystem.update();
    this.renderer.render(this.scene, this.camera);
  }

  public onWindowResize(): void {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // --- 输入处理接口 ---

  // 键盘输入目前仅用于阻止滚屏等默认行为，实际移动全部由回合面板控制
  public handleInput(_key: string) {
    return;
  }

  private updateAim(dirX: number, dirY: number) {
    if (!this.gameState || !this.trajectoryGhost) return;
    if (!this.interactionState.playerSelected || this.interactionState.plannedAction !== 'attack') {
      this.trajectoryGhost.setVisible(false);
      return;
    }

    this.lastAimDir = { x: dirX, y: dirY };
    const strategy = this.strategies[this.activeStrategy];
    if (!strategy) return;

    const context: WeaponContext = {
      originX: this.gameState.playerX,
      originY: this.gameState.playerY,
      dirX,
      dirY,
    };

    const path = strategy.simulate(context);
    this.trajectoryGhost.renderPath(path);
    this.trajectoryGhost.setVisible(true);
  }

  private updateAimFromCamera(force = false) {
    if (!this.gameState) return;
    const forward = this.cameraRig.getForwardDirection(this.forwardDir);
    const dirX = forward.x;
    const dirY = forward.z;
    if (!force && this.lastAimDir) {
      const deltaX = Math.abs(this.lastAimDir.x - dirX);
      const deltaY = Math.abs(this.lastAimDir.y - dirY);
      if (deltaX < 0.01 && deltaY < 0.01) {
        return;
      }
    }
    if (dirX === 0 && dirY === 0) return;
    this.updateAim(dirX, dirY);
  }

  private syncPlayerView(animate = true): void {
    this.entityView.sync(this.gameState, animate);
    const world = this.entityView.getWorldPosition(this.playerWorldPosition);
    this.cameraRig.follow(world, !animate);
  }



  public setStrategy(strategy: WeaponArchetype): void {
    if (this.activeStrategy === strategy) return;
    this.activeStrategy = strategy;
    this.updateAimFromCamera(true);
  }

  public planAction(action: PlayerAction | null): void {
    if (!this.interactionState.playerSelected && action !== null) return;
    this.interactionState.plannedAction = action;
    this.interactionState.targetX = null;
    this.interactionState.targetY = null;
    this.interactionState.movePath = undefined;
    if (action === 'attack') {
      this.updateAimFromCamera(true);
    } else {
      this.trajectoryGhost.setVisible(false);
    }
  }

  public getInteractionState(): InteractionState {
    return { ...this.interactionState };
  }

  public performMoveAction(): boolean {
    return this.turnController.performMoveAction();
  }

  public performAttackAction(): AttackResolution | null {
    return this.turnController.performAttackAction();
  }

  public executeTurn(): void {
    this.turnController.executeTurn();
  }

  public getActiveStrategy(): WeaponArchetype {
    return this.activeStrategy;
  }

  public getPlayerLoss(): number {
    return this.queries.getPlayerLoss();
  }

  public getTurnCount(): number {
    return this.queries.getTurnCount();
  }

  public getRoomDescription(): string {
    return this.queries.getRoomDescription();
  }

  public getTopologyLabel(): string {
    return this.queries.getTopologyLabel();
  }

  public getRoomSeed(): number | null {
    return this.queries.getRoomSeed();
  }

  public getPlayerStats(): PlayerStats {
    return this.queries.getPlayerStats();
  }

  public getAmmoCapacity(): number {
    return this.queries.getAmmoCapacity();
  }

  public getActionLog(): ActionLogEntry[] {
    return this.queries.getActionLog();
  }

  public getPendingBuffs(): BuffDefinition[] {
    return this.queries.getPendingBuffs();
  }

  public consumeBuff(buffId: BuffId) {
    this.queries.consumeBuff(buffId);
  }

  public getFieldHeatmap(resolution = 32): number[][] {
    return this.queries.getFieldHeatmap(resolution);
  }

  public getEntitySnapshot(): EntitySnapshot {
    return this.queries.getEntitySnapshot();
  }


  /**
   * 资源清理
   */
  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    // 移除事件监听
    this.renderer.domElement.removeEventListener('click', this.handleCanvasClick);

    // 清理 Three.js 资源
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }

    this.cameraRig.dispose();

    // 清理组件资源
    if (this.terrainView) this.terrainView.dispose();
    if (this.entityView) this.entityView.dispose();
    if (this.trajectoryGhost) this.trajectoryGhost.dispose();
    if (this.vfxSystem) this.vfxSystem.dispose();
    this.lastAimDir = null;

    if (this.starField) {
      this.scene.remove(this.starField);
      (this.starField.geometry as THREE.BufferGeometry).dispose();
      (this.starField.material as THREE.Material).dispose();
      this.starField = null;
    }

    // 递归清理场景
    const disposeObject = (object: THREE.Mesh | THREE.Line) => {
      object.geometry.dispose();
      const material = object.material;
      if (Array.isArray(material)) {
        material.forEach((m: THREE.Material) => m.dispose());
      } else {
        material.dispose();
      }
    };

    this.scene.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        disposeObject(object);
      } else if (object instanceof THREE.Line) {
        disposeObject(object);
      }
    });

    console.log('SceneManager disposed.');
  }
}




