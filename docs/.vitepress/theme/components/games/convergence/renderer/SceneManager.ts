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
import { GRID_SIZE } from '../config';
import { WeaponArchetype } from '../core/types';
import type { BuffId } from '../core/types';
import { WeaponStrategy } from '../core/strategies/WeaponStrategy';
import { EuclideanStrategy } from '../core/strategies/Euclidean';
import { GradientStrategy } from '../core/strategies/Gradient';
import { DistributedStrategy } from '../core/strategies/Distributed';
import { SceneQueries } from '../application/SceneQueries';
import type { InteractionState, PlayerAction, SceneUiSnapshot } from '../application/types';
import { TurnController } from '../application/TurnController';
import { InteractionController } from '../application/InteractionController';
import { SceneUiBridge } from '../application/SceneUiBridge';
import { AimPreviewController } from '../application/AimPreviewController';
import { SceneShell } from './SceneShell';
import { disposeSceneGraph } from './disposeSceneGraph';

export class SceneManager {
  private container: HTMLDivElement;
  private sceneShell: SceneShell;
  private animationId: number | null = null;
  private cameraRig: CameraRig;
  private playerWorldPosition = new THREE.Vector3();
  private forwardDir = new THREE.Vector3();
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
  private uiBridge: SceneUiBridge;
  private aimPreviewController: AimPreviewController;
  private turnController: TurnController;
  private interactionController: InteractionController;
  private handleCanvasClick = (event: MouseEvent) => {
    this.interactionController.handleCanvasClick(event);
  };
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.sceneShell = new SceneShell(container);
    this.cameraRig = new CameraRig(this.sceneShell.camera, this.sceneShell.renderer.domElement);
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
    this.uiBridge = new SceneUiBridge(() => this.getUiSnapshot());
    this.applyRoomTheme();
    this.terrainView = new TerrainView(this.sceneShell.scene, this.fieldSystem);
    this.entityView = new EntityView(this.sceneShell.scene, this.fieldSystem);
    this.trajectoryGhost = new TrajectoryGhost(this.sceneShell.scene, this.fieldSystem);
    this.vfxSystem = new VFXSystem(this.sceneShell.scene);
    this.ballistics = new Ballistics(this.fieldSystem);
    this.strategies = {
      [WeaponArchetype.Euclidean]: new EuclideanStrategy(this.fieldSystem),
      [WeaponArchetype.Gradient]: new GradientStrategy(this.ballistics),
      [WeaponArchetype.Distributed]: new DistributedStrategy(),
    };
    this.aimPreviewController = new AimPreviewController({
      gameState: this.gameState,
      trajectoryGhost: this.trajectoryGhost,
      interactionState: this.interactionState,
      cameraRig: this.cameraRig,
      forwardDir: this.forwardDir,
      strategies: this.strategies,
      getActiveStrategy: () => this.activeStrategy,
    });
    this.turnController = new TurnController({
      gameState: this.gameState,
      cameraRig: this.cameraRig,
      interactionState: this.interactionState,
      forwardDir: this.forwardDir,
      strategies: this.strategies,
      getActiveStrategy: () => this.activeStrategy,
      getLastAimDir: () => this.aimPreviewController.getLastAimDir(),
      setPlayerSelection: (selected) => this.setPlayerSelection(selected),
      syncPlayerView: () => this.syncPlayerView(),
      updateAimFromCamera: (force) => this.aimPreviewController.updateAimFromCamera(force),
    });
    this.interactionController = new InteractionController({
      camera: this.sceneShell.camera,
      domElement: this.sceneShell.renderer.domElement,
      groundPlane: this.groundPlane,
      fieldSystem: this.fieldSystem,
      gameState: this.gameState,
      entityView: this.entityView,
      interactionState: this.interactionState,
      setPlayerSelection: (selected) => this.setPlayerSelection(selected),
      updateAim: (dirX, dirY) => this.aimPreviewController.updateAim(dirX, dirY),
      onStateChange: () => this.uiBridge.notify(),
    });
    this.syncPlayerView(false);
    this.aimPreviewController.updateAimFromCamera(true);
    this.sceneShell.renderer.domElement.addEventListener('click', this.handleCanvasClick);
    this.animate();
  }

  private setPlayerSelection(selected: boolean) {
    if (!this.entityView) return;
    if (selected) {
      this.interactionState.selectedEnemyId = null;
    }
    this.interactionState.playerSelected = selected;
    if (!selected) {
      this.interactionState.plannedAction = null;
      this.interactionState.targetX = null;
      this.interactionState.targetY = null;
      this.aimPreviewController.clear();
    }
    this.entityView.setPlayerSelected(selected);
    this.uiBridge.notify();
  }

  public deselectAll() {
    this.interactionController.deselectAll();
    this.uiBridge.notify();
  }

  private applyRoomTheme() {
    if (!this.currentRoom) return;
    this.sceneShell.applyRoomTheme(this.currentRoom.background);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.render();
  };

  private render(): void {
    this.sceneShell.renderFrame({
      cameraRig: this.cameraRig,
      terrainView: this.terrainView,
      vfxSystem: this.vfxSystem,
    });
  }

  public onWindowResize(): void {
    this.sceneShell.resize();
  }
  public handleInput(_key: string) {
    return;
  }

  private syncPlayerView(animate = true): void {
    this.entityView.sync(this.gameState, animate);
    const world = this.entityView.getWorldPosition(this.playerWorldPosition);
    this.cameraRig.follow(world, !animate);
  }
  public setStrategy(strategy: WeaponArchetype): void {
    if (this.activeStrategy === strategy) return;
    this.activeStrategy = strategy;
    this.aimPreviewController.updateAimFromCamera(true);
    this.uiBridge.notify();
  }

  public planAction(action: PlayerAction | null): void {
    if (!this.interactionState.playerSelected && action !== null) return;
    this.interactionState.plannedAction = action;
    this.interactionState.targetX = null;
    this.interactionState.targetY = null;
    this.interactionState.movePath = undefined;
    if (action === 'attack') {
      this.aimPreviewController.updateAimFromCamera(true);
    } else {
      this.trajectoryGhost.setVisible(false);
    }
    this.uiBridge.notify();
  }

  private getInteractionState(): InteractionState {
    return { ...this.interactionState };
  }

  public getUiSnapshot(): SceneUiSnapshot {
    return {
      lossValue: this.queries.getPlayerLoss(),
      playerStats: this.queries.getPlayerStats(),
      selectedEnemyStats: this.queries.getSelectedEnemyStats(),
      ammoCapacity: this.queries.getAmmoCapacity(),
      actionLog: this.queries.getActionLog(),
      pendingBuffs: this.queries.getPendingBuffs(),
      interactionState: this.getInteractionState(),
      heatmap: this.queries.getFieldHeatmap(36),
      entities: this.queries.getEntitySnapshot(),
      activeStrategy: this.activeStrategy,
      topologyLabel: this.queries.getTopologyLabel(),
      roomLabel: this.queries.getRoomDescription(),
      turnCount: this.queries.getTurnCount(),
    };
  }

  public subscribeUiState(listener: (snapshot: SceneUiSnapshot) => void): () => void {
    return this.uiBridge.subscribe(listener);
  }

  public performMoveAction(): boolean {
    return this.turnController.performMoveAction();
  }

  public performAttackAction(): AttackResolution | null {
    return this.turnController.performAttackAction();
  }

  public executeTurn(): void {
    this.turnController.executeTurn();
    this.uiBridge.notify();
  }

  public consumeBuff(buffId: BuffId) {
    this.queries.consumeBuff(buffId);
    this.uiBridge.notify();
  }
  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.uiBridge.clear();
    this.sceneShell.renderer.domElement.removeEventListener('click', this.handleCanvasClick);
    this.cameraRig.dispose();
    if (this.terrainView) this.terrainView.dispose();
    if (this.entityView) this.entityView.dispose();
    if (this.trajectoryGhost) this.trajectoryGhost.dispose();
    if (this.vfxSystem) this.vfxSystem.dispose();
    disposeSceneGraph(this.sceneShell.scene);
    this.sceneShell.dispose();
  }
}
