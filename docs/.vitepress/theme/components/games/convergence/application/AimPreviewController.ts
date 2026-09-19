import type { Vector3 } from 'three';
import type { GameState } from '../core/GameState';
import type { WeaponArchetype, WeaponContext } from '../core/types';
import type { WeaponStrategy } from '../core/strategies/WeaponStrategy';
import type { CameraRig } from '../renderer/CameraRig';
import type { TrajectoryGhost } from '../renderer/TrajectoryGhost';
import type { InteractionState } from './types';

interface AimPreviewControllerOptions {
  gameState: GameState;
  trajectoryGhost: TrajectoryGhost;
  interactionState: InteractionState;
  cameraRig: CameraRig;
  forwardDir: Vector3;
  strategies: Record<WeaponArchetype, WeaponStrategy>;
  getActiveStrategy: () => WeaponArchetype;
}

export class AimPreviewController {
  private lastAimDir: { x: number; y: number } | null = null;

  constructor(private readonly options: AimPreviewControllerOptions) {}

  clear() {
    this.lastAimDir = null;
    this.options.trajectoryGhost.setVisible(false);
  }

  updateAim(dirX: number, dirY: number) {
    if (!this.options.interactionState.playerSelected || this.options.interactionState.plannedAction !== 'attack') {
      this.options.trajectoryGhost.setVisible(false);
      return;
    }

    this.lastAimDir = { x: dirX, y: dirY };
    const strategy = this.options.strategies[this.options.getActiveStrategy()];
    if (!strategy) return;

    const context: WeaponContext = {
      originX: this.options.gameState.playerX,
      originY: this.options.gameState.playerY,
      dirX,
      dirY,
    };
    const path = strategy.simulate(context);
    this.options.trajectoryGhost.renderPath(path);
    this.options.trajectoryGhost.setVisible(true);
  }

  updateAimFromCamera(force = false) {
    const forward = this.options.cameraRig.getForwardDirection(this.options.forwardDir);
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

  getLastAimDir() {
    return this.lastAimDir;
  }
}
