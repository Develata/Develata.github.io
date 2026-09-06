import * as THREE from 'three';
import { FieldSystem } from '../core/math/FieldSystem';
import { GameState } from '../core/GameState';
import { EntityView } from '../renderer/EntityView';
import { findOrthogonalPath } from './pathfinding';
import type { InteractionState } from './types';

interface InteractionControllerOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLCanvasElement;
  groundPlane: THREE.Plane;
  fieldSystem: FieldSystem;
  gameState: GameState;
  entityView: EntityView;
  interactionState: InteractionState;
  setPlayerSelection: (selected: boolean) => void;
  updateAim: (dirX: number, dirY: number) => void;
  onStateChange: () => void;
}

export class InteractionController {
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();

  constructor(private readonly options: InteractionControllerOptions) {}

  deselectAll() {
    this.options.setPlayerSelection(false);
    this.options.interactionState.selectedEnemyId = null;
    this.options.onStateChange();
  }

  handleCanvasClick(event: MouseEvent) {
    const { interactionState } = this.options;
    if (interactionState.playerSelected && interactionState.plannedAction) {
      this.handleGroundClick(event);
      return;
    }
    if (this.trySelectEnemy(event)) return;
    if (this.trySelectPlayer(event)) return;
    if (interactionState.playerSelected) {
      this.handleGroundClick(event);
    }
  }

  private updatePointer(event: MouseEvent) {
    const rect = this.options.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private trySelectEnemy(event: MouseEvent): boolean {
    const meshes = this.options.entityView.getEnemyMeshes();
    if (meshes.length === 0) return false;

    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.options.camera);
    const visibleMeshes = meshes.filter((mesh) => mesh.visible);
    const hits = this.raycaster.intersectObjects(visibleMeshes, false);
    if (hits.length === 0) return false;

    const hitMesh = hits[0].object;
    const index = meshes.indexOf(hitMesh as THREE.Mesh);
    if (index === -1) return false;

    const enemies = this.options.gameState.entities.getEnemies();
    if (!enemies[index]) return false;

    this.options.interactionState.selectedEnemyId = enemies[index].id;
    this.options.setPlayerSelection(false);
    this.options.onStateChange();
    return true;
  }

  private trySelectPlayer(event: MouseEvent): boolean {
    const mesh = this.options.entityView.getPlayerMesh();
    if (!mesh) return false;

    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.options.camera);
    const hit = this.raycaster.intersectObject(mesh, false);
    if (hit.length === 0) return false;

    this.options.setPlayerSelection(true);
    this.options.onStateChange();
    return true;
  }

  private getGridFromRay(event: MouseEvent): { gx: number; gy: number } | null {
    this.updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.options.camera);
    const intersection = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.options.groundPlane, intersection)) {
      return null;
    }

    const half = (this.options.fieldSystem.size - 1) / 2;
    const gx = Math.round(intersection.x + half);
    const gy = Math.round(intersection.z + half);
    if (gx < 0 || gx >= this.options.fieldSystem.size || gy < 0 || gy >= this.options.fieldSystem.size) {
      return null;
    }
    return { gx, gy };
  }

  private handleGroundClick(event: MouseEvent) {
    const hit = this.getGridFromRay(event);
    if (!hit) return;

    const { interactionState, gameState, fieldSystem } = this.options;
    if (interactionState.plannedAction === 'move') {
      const path = findOrthogonalPath(fieldSystem.size, gameState.playerX, gameState.playerY, hit.gx, hit.gy);
      if (path.length > 0) {
        interactionState.movePath = path;
        interactionState.targetX = path[0].x;
        interactionState.targetY = path[0].y;
      } else {
        interactionState.movePath = [];
        interactionState.targetX = hit.gx;
        interactionState.targetY = hit.gy;
      }
      this.options.onStateChange();
      return;
    }

    interactionState.targetX = hit.gx;
    interactionState.targetY = hit.gy;
    if (interactionState.plannedAction === 'attack') {
      const dirX = hit.gx - gameState.playerX;
      const dirY = hit.gy - gameState.playerY;
      if (dirX === 0 && dirY === 0) return;
      const len = Math.hypot(dirX, dirY) || 1;
      this.options.updateAim(dirX / len, dirY / len);
    }
    this.options.onStateChange();
  }
}
