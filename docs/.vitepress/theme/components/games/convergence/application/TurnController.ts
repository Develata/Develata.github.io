import { GameState, AttackResolution } from '../core/GameState';
import { CameraRig } from '../renderer/CameraRig';
import { WeaponStrategy } from '../core/strategies/WeaponStrategy';
import { WeaponArchetype, WeaponContext } from '../core/types';
import type { InteractionState } from './types';
import { vectorToOrthogonalGrid } from './pathfinding';
import * as THREE from 'three';

interface TurnControllerOptions {
  gameState: GameState;
  cameraRig: CameraRig;
  interactionState: InteractionState;
  forwardDir: THREE.Vector3;
  strategies: Record<WeaponArchetype, WeaponStrategy>;
  getActiveStrategy: () => WeaponArchetype;
  getLastAimDir: () => { x: number; y: number } | null;
  setPlayerSelection: (selected: boolean) => void;
  syncPlayerView: () => void;
  updateAimFromCamera: (force?: boolean) => void;
}

export class TurnController {
  constructor(private readonly options: TurnControllerOptions) {}

  performMoveAction(): boolean {
    const { gameState, interactionState, cameraRig, forwardDir } = this.options;
    let moved = false;

    if (interactionState.targetX != null && interactionState.targetY != null) {
      const dx = interactionState.targetX - gameState.playerX;
      const dy = interactionState.targetY - gameState.playerY;
      if (dx === 0 && dy === 0) return false;

      let stepX = 0;
      let stepY = 0;
      if (Math.abs(dx) >= Math.abs(dy)) {
        stepX = Math.sign(dx);
      } else {
        stepY = Math.sign(dy);
      }
      moved = gameState.movePlayer(stepX, stepY);
    } else {
      const forward = cameraRig.getForwardDirection(forwardDir);
      const { dx, dy } = vectorToOrthogonalGrid(forward);
      if (dx === 0 && dy === 0) return false;
      moved = gameState.movePlayer(dx, dy);
    }

    if (!moved) return false;

    this.options.syncPlayerView();
    this.options.updateAimFromCamera(true);
    if (interactionState.movePath && interactionState.movePath.length > 0) {
      interactionState.movePath.shift();
      if (interactionState.movePath.length > 0) {
        const next = interactionState.movePath[0];
        interactionState.targetX = next.x;
        interactionState.targetY = next.y;
        return true;
      }
    }

    this.options.setPlayerSelection(false);
    interactionState.movePath = undefined;
    return true;
  }

  performAttackAction(): AttackResolution | null {
    const result = this.simulateAttack();
    if (!result) return null;

    this.options.gameState.resolveAttack(result);
    this.options.syncPlayerView();
    this.options.setPlayerSelection(false);
    this.options.updateAimFromCamera(true);
    return result;
  }

  executeTurn(): void {
    const { interactionState } = this.options;
    if (!interactionState.playerSelected || !interactionState.plannedAction) return;
    if (interactionState.plannedAction === 'attack') {
      this.performAttackAction();
    } else {
      this.performMoveAction();
    }
  }

  private simulateAttack(): AttackResolution | null {
    const { gameState, strategies, getActiveStrategy, getLastAimDir } = this.options;
    const strategy = strategies[getActiveStrategy()];
    if (!strategy) return null;

    const context: WeaponContext = {
      originX: gameState.playerX,
      originY: gameState.playerY,
      dirX: getLastAimDir()?.x ?? 1,
      dirY: getLastAimDir()?.y ?? 0,
    };

    const path = strategy.simulate(context);
    if (!path.length) return null;

    const enemies = gameState.entities.getEnemies();
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
      const dx = point.x - gameState.playerX;
      const dy = point.y - gameState.playerY;
      if (dx * dx + dy * dy <= 0.4) {
        return { enemyId: null, impactStep: i, friendlyFire: true };
      }
    }

    return { enemyId: null, impactStep: path.length - 1 };
  }
}
