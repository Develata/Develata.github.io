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
import {
  ActionLogEntry,
  BuffDefinition,
  BuffId,
  PlayerStats,
  RoomTopology,
  WeaponArchetype,
  WeaponContext,
  EnemyProfile,
} from '../core/types';
import { WeaponStrategy } from '../core/strategies/WeaponStrategy';
import { EuclideanStrategy } from '../core/strategies/Euclidean';
import { GradientStrategy } from '../core/strategies/Gradient';
import { DistributedStrategy } from '../core/strategies/Distributed';

type PlayerAction = 'attack' | 'move';

interface InteractionState {
  playerSelected: boolean;
  selectedEnemyId: string | null;
  plannedAction: PlayerAction | null;
  targetX: number | null;
  targetY: number | null;
  movePath?: { x: number; y: number }[];
}

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
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private interactionState: InteractionState = {
    playerSelected: false,
    selectedEnemyId: null,
    plannedAction: null,
    targetX: null,
    targetY: null,
  };
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private cachedHeatmap: number[][] | null = null;
  private lastFieldVersion = -1;
  private lastHeatmapResolution = 0;
  
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
  private starField: THREE.Points | null = null;
  private handleCanvasClick = (event: MouseEvent) => {
    // 如果已经规划了行动（攻击/移动），优先处理地面点击，忽略实体选择
    if (this.interactionState.playerSelected && this.interactionState.plannedAction) {
      this.handleGroundClick(event);
      return;
    }

    // 优先检测敌人点击
    if (this.trySelectEnemy(event)) {
      return;
    }

    // 检测玩家点击
    if (this.trySelectPlayer(event)) {
      return;
    }

    // 如果选中了玩家但未规划行动，则处理地面点击（可能用于取消选择或其他交互）
    if (this.interactionState.playerSelected) {
      this.handleGroundClick(event);
    }
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
    this.setPlayerSelection(false);
    this.interactionState.selectedEnemyId = null;
  }

  private trySelectEnemy(event: MouseEvent): boolean {
    const meshes = this.entityView.getEnemyMeshes();
    if (meshes.length === 0) return false;

    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    
    // 只检测可见的 mesh
    const visibleMeshes = meshes.filter(m => m.visible);
    const hits = this.raycaster.intersectObjects(visibleMeshes, false);

    if (hits.length > 0) {
      // 找到对应的敌人 ID
      const hitMesh = hits[0].object;
      const index = meshes.indexOf(hitMesh as THREE.Mesh);
      if (index !== -1) {
        const enemies = this.gameState.entities.getEnemies();
        if (enemies[index]) {
          this.interactionState.selectedEnemyId = enemies[index].id;
          this.setPlayerSelection(false); // 选中敌人时取消选中玩家
          return true;
        }
      }
    }
    return false;
  }

  public getSelectedEnemyStats(): EnemyProfile | null {
    if (!this.interactionState.selectedEnemyId) return null;
    const enemy = this.gameState.entities.findEnemy(this.interactionState.selectedEnemyId);
    if (!enemy) return null;
    return {
      id: enemy.id,
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      traits: enemy.traits,
      singularity: {
        x: enemy.x,
        y: enemy.y,
        strength: enemy.strength,
        radius: enemy.radius,
      },
    };
  }

  private updatePointer(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private trySelectPlayer(event: MouseEvent): boolean {
    const mesh = this.entityView.getPlayerMesh();
    if (!mesh) return false;
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(mesh, false);
    if (hit.length > 0) {
      this.setPlayerSelection(true);
      return true;
    }
    return false;
  }

  private getGridFromRay(event: MouseEvent): { gx: number; gy: number } | null {
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersection = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, intersection)) {
      return null;
    }

    const half = (this.fieldSystem.size - 1) / 2;
    const gx = Math.round(intersection.x + half);
    const gy = Math.round(intersection.z + half);

    if (gx < 0 || gx >= this.fieldSystem.size || gy < 0 || gy >= this.fieldSystem.size) {
      return null;
    }

    return { gx, gy };
  }

  private handleGroundClick(event: MouseEvent) {
    const hit = this.getGridFromRay(event);
    if (!hit) return;

    if (this.interactionState.plannedAction === 'move') {
      // 计算路径
      const path = this.findPath(this.gameState.playerX, this.gameState.playerY, hit.gx, hit.gy);
      if (path.length > 0) {
        this.interactionState.movePath = path;
        const next = path[0];
        this.interactionState.targetX = next.x;
        this.interactionState.targetY = next.y;
      } else {
        this.interactionState.movePath = [];
        this.interactionState.targetX = hit.gx;
        this.interactionState.targetY = hit.gy;
      }
      return;
    }

    this.interactionState.targetX = hit.gx;
    this.interactionState.targetY = hit.gy;

    if (this.interactionState.plannedAction === 'attack') {
      const dirX = hit.gx - this.gameState.playerX;
      const dirY = hit.gy - this.gameState.playerY;
      if (dirX === 0 && dirY === 0) return;
      const len = Math.hypot(dirX, dirY) || 1;
      this.updateAim(dirX / len, dirY / len);
    }
  }

  private findPath(startX: number, startY: number, endX: number, endY: number): { x: number; y: number }[] {
    // 简单的 BFS 寻路
    const size = this.fieldSystem.size;
    const queue: { x: number; y: number; path: { x: number; y: number }[] }[] = [
      { x: startX, y: startY, path: [] }
    ];
    const visited = new Set<string>();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
      const { x, y, path } = queue.shift()!;
      if (x === endX && y === endY) {
        return path;
      }

      const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const dir of dirs) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;

        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const key = `${nx},${ny}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
          }
        }
      }
    }
    return [];
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

  private vectorToGrid(vec: THREE.Vector3): { dx: number; dy: number } {
    const absX = Math.abs(vec.x);
    const absZ = Math.abs(vec.z);
    if (absX < 0.1 && absZ < 0.1) {
      return { dx: 0, dy: 0 };
    }
    if (absX > absZ) {
      return { dx: Math.sign(vec.x), dy: 0 };
    }
    if (absZ > absX) {
      return { dx: 0, dy: Math.sign(vec.z) };
    }
    // Fallback for exact diagonal: prioritize X axis to enforce orthogonal movement
    return { dx: Math.sign(vec.x), dy: 0 };
  }

  public setStrategy(strategy: WeaponArchetype): void {
    if (this.activeStrategy === strategy) return;
    this.activeStrategy = strategy;
    this.updateAimFromCamera(true);
  }

  public planAction(action: PlayerAction): void {
    if (!this.interactionState.playerSelected) return;
    this.interactionState.plannedAction = action;
    this.interactionState.targetX = null;
    this.interactionState.targetY = null;
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
    let moved = false;
    if (this.interactionState.targetX != null && this.interactionState.targetY != null) {
      const dx = this.interactionState.targetX - this.gameState.playerX;
      const dy = this.interactionState.targetY - this.gameState.playerY;
      if (dx === 0 && dy === 0) return false;
      
      // Enforce orthogonal movement: prioritize the axis with larger distance
      let stepX = 0;
      let stepY = 0;
      if (Math.abs(dx) >= Math.abs(dy)) {
        stepX = Math.sign(dx);
      } else {
        stepY = Math.sign(dy);
      }
      
      moved = this.gameState.movePlayer(stepX, stepY);
    } else {
      const forward = this.cameraRig.getForwardDirection(this.forwardDir);
      const { dx, dy } = this.vectorToGrid(forward);
      if (dx === 0 && dy === 0) return false;
      moved = this.gameState.movePlayer(dx, dy);
    }
    if (moved) {
      this.syncPlayerView();
      this.updateAimFromCamera(true);
      
      // 更新路径逻辑
      if (this.interactionState.movePath && this.interactionState.movePath.length > 0) {
        // 移除已经到达的第一个点
        this.interactionState.movePath.shift();
        
        if (this.interactionState.movePath.length > 0) {
          // 如果还有路径，设置下一个目标
          const next = this.interactionState.movePath[0];
          this.interactionState.targetX = next.x;
          this.interactionState.targetY = next.y;
          // 保持选中状态，允许连续移动
          return moved;
        }
      }
      
      // 路径走完或没有路径，取消选择
      this.setPlayerSelection(false);
      this.interactionState.movePath = undefined;
    }
    return moved;
  }

  public performAttackAction(): AttackResolution | null {
    const result = this.simulateAttack();
    if (!result) {
      return null;
    }

    this.gameState.resolveAttack(result);
    this.syncPlayerView();
    this.setPlayerSelection(false);
    this.updateAimFromCamera(true);
    return result;
  }

  public executeTurn(): void {
    if (!this.interactionState.playerSelected || !this.interactionState.plannedAction) {
      return;
    }

    if (this.interactionState.plannedAction === 'attack') {
      this.performAttackAction();
    } else {
      this.performMoveAction();
    }
  }

  public getActiveStrategy(): WeaponArchetype {
    return this.activeStrategy;
  }

  public getPlayerLoss(): number {
    if (!this.gameState) return 0;
    return this.fieldSystem.getHeightAt(this.gameState.playerX, this.gameState.playerY);
  }

  public getTurnCount(): number {
    return this.gameState?.turnCount ?? 0;
  }

  public getRoomDescription(): string {
    return this.currentRoom?.label ?? '未初始化空间';
  }

  public getTopologyLabel(): string {
    return this.describeTopology(this.gameState?.getTopology());
  }

  public getRoomSeed(): number | null {
    return this.currentRoom?.seed ?? null;
  }

  public getPlayerStats(): PlayerStats {
    return this.gameState.getPlayerStats();
  }

  public getAmmoCapacity(): number {
    return this.gameState.getAmmoCapacity();
  }

  public getActionLog(): ActionLogEntry[] {
    return this.gameState.getActionLog();
  }

  public getPendingBuffs(): BuffDefinition[] {
    return this.gameState.getPendingBuffs();
  }

  public consumeBuff(buffId: BuffId) {
    this.gameState.consumeBuff(buffId);
  }

  public getFieldHeatmap(resolution = 32): number[][] {
    if (
      this.cachedHeatmap &&
      this.fieldSystem.version === this.lastFieldVersion &&
      this.lastHeatmapResolution === resolution
    ) {
      return this.cachedHeatmap;
    }

    const size = Math.max(4, Math.floor(resolution));
    const data: number[][] = [];
    let min = Infinity;
    let max = -Infinity;
    for (let y = 0; y < size; y++) {
      const row: number[] = [];
      for (let x = 0; x < size; x++) {
        const sampleX = (x / size) * this.fieldSystem.size;
        const sampleY = (y / size) * this.fieldSystem.size;
        const h = this.fieldSystem.getHeightAt(sampleX, sampleY);
        min = Math.min(min, h);
        max = Math.max(max, h);
        row.push(h);
      }
      data.push(row);
    }

    const range = max - min || 1;
    this.cachedHeatmap = data.map((row) => row.map((value) => (value - min) / range));
    this.lastFieldVersion = this.fieldSystem.version;
    this.lastHeatmapResolution = resolution;
    return this.cachedHeatmap;
  }

  public getEntitySnapshot() {
    return {
      player: { x: this.gameState.playerX, y: this.gameState.playerY },
      enemies: this.gameState.entities.getEnemies().map((enemy) => ({
        id: enemy.id,
        x: enemy.position.x,
        y: enemy.position.y,
      })),
    };
  }

  private describeTopology(topology?: RoomTopology): string {
    switch (topology) {
      case RoomTopology.Torus:
        return '环面拓扑';
      case RoomTopology.Mobius:
        return '莫比乌斯拓扑';
      case RoomTopology.Plane:
        return '欧氏平面';
      default:
        return '未知拓扑';
    }
  }

  private simulateAttack(): AttackResolution | null {
    if (!this.gameState) return null;
    const strategy = this.strategies[this.activeStrategy];
    if (!strategy) return null;

    const context: WeaponContext = {
      originX: this.gameState.playerX,
      originY: this.gameState.playerY,
      dirX: this.lastAimDir?.x ?? 1,
      dirY: this.lastAimDir?.y ?? 0,
    };

    const path = strategy.simulate(context);
    if (!path.length) {
      return null;
    }

    const enemies = this.gameState.entities.getEnemies();
    let best: AttackResolution | null = null;

    enemies.forEach((enemy) => {
      for (let i = 1; i < path.length; i++) {
        const point = path[i];
        const dx = point.x - enemy.position.x;
        const dy = point.y - enemy.position.y;
        const radius = Math.max(0.6, enemy.radius);
        if (dx * dx + dy * dy <= radius * radius) {
          if (!best || i < best.impactStep) {
            best = { enemyId: enemy.id, impactStep: i };
          }
          break;
        }
      }
    });

    if (best) return best;

    for (let i = 1; i < path.length; i++) {
      const point = path[i];
      const dx = point.x - this.gameState.playerX;
      const dy = point.y - this.gameState.playerY;
      if (dx * dx + dy * dy <= 0.4) {
        return { enemyId: null, impactStep: i, friendlyFire: true };
      }
    }

    return { enemyId: null, impactStep: path.length - 1 };
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