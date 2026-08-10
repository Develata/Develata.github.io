/**
 * Deterministic Multiple Object Tracking (MOT) state.
 *
 * Positions and velocities are normalized to a square arena. `advanceMotState`
 * mutates fixed-size typed arrays in place: O(n²) collision work, O(1)
 * allocation per step. Here n <= 12, so the pairwise pass is predictable and
 * avoids visual overlap without introducing a physics dependency.
 */
import { createRng, shuffleInPlace } from '../../rng';

export interface MotRound {
  readonly count: number;
  readonly targetCount: number;
  readonly radius: number;
  readonly positions: Float32Array;
  readonly velocities: Float32Array;
  readonly targets: Uint8Array;
}

export interface MotScore {
  hits: number;
  falseSelections: number;
  accuracy: number;
}

export function createMotRound(count: number, targetCount: number, speed: number, seed: number): MotRound {
  if (!Number.isInteger(count) || count < 6 || count > 12) throw new RangeError('MOT object count must be 6–12');
  if (!Number.isInteger(targetCount) || targetCount < 2 || targetCount >= count) throw new RangeError('MOT target count must be 2..count-1');
  if (!Number.isFinite(speed) || speed < 0.06 || speed > 0.22) throw new RangeError('MOT speed must be 0.06–0.22');

  const rng = createRng(seed);
  const positions = new Float32Array(count * 2);
  const velocities = new Float32Array(count * 2);
  const targets = new Uint8Array(count);
  const cells = shuffleInPlace(Array.from({ length: 12 }, (_, index) => index), rng).slice(0, count);
  // The normalized radius covers the 44px selection hit box even in the
  // smallest supported arena, preventing both visual and pointer occlusion.
  const radius = 0.088;

  for (let index = 0; index < count; index++) {
    const cell = cells[index];
    positions[index * 2] = 0.14 + (cell % 4) * 0.24;
    positions[index * 2 + 1] = 0.18 + Math.floor(cell / 4) * 0.32;
    const angle = rng.next() * Math.PI * 2;
    const magnitude = speed * (0.84 + rng.next() * 0.32);
    velocities[index * 2] = Math.cos(angle) * magnitude;
    velocities[index * 2 + 1] = Math.sin(angle) * magnitude;
  }

  const targetIndices = shuffleInPlace(Array.from({ length: count }, (_, index) => index), rng);
  for (let index = 0; index < targetCount; index++) targets[targetIndices[index]] = 1;
  return { count, targetCount, radius, positions, velocities, targets };
}

export function advanceMotState(state: MotRound, seconds: number): void {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 0.05) throw new RangeError('MOT step must be 0–0.05 seconds');
  const { count, positions, velocities, radius } = state;
  const low = radius;
  const high = 1 - radius;

  for (let index = 0; index < count; index++) {
    const offset = index * 2;
    positions[offset] += velocities[offset] * seconds;
    positions[offset + 1] += velocities[offset + 1] * seconds;
    if (positions[offset] < low || positions[offset] > high) {
      positions[offset] = Math.min(high, Math.max(low, positions[offset]));
      velocities[offset] *= -1;
    }
    if (positions[offset + 1] < low || positions[offset + 1] > high) {
      positions[offset + 1] = Math.min(high, Math.max(low, positions[offset + 1]));
      velocities[offset + 1] *= -1;
    }
  }

  const minimum = radius * 2;
  for (let left = 0; left < count; left++) {
    for (let right = left + 1; right < count; right++) {
      const li = left * 2;
      const ri = right * 2;
      let dx = positions[ri] - positions[li];
      let dy = positions[ri + 1] - positions[li + 1];
      let distanceSquared = dx * dx + dy * dy;
      if (distanceSquared >= minimum * minimum) continue;
      if (distanceSquared < 1e-10) {
        dx = (left + right) % 2 === 0 ? 1 : 0;
        dy = dx === 0 ? 1 : 0;
        distanceSquared = 1;
      }
      const distance = Math.sqrt(distanceSquared);
      const nx = dx / distance;
      const ny = dy / distance;
      const correction = (minimum - distance) / 2;
      positions[li] -= nx * correction;
      positions[li + 1] -= ny * correction;
      positions[ri] += nx * correction;
      positions[ri + 1] += ny * correction;
      const relative = (velocities[ri] - velocities[li]) * nx + (velocities[ri + 1] - velocities[li + 1]) * ny;
      if (relative < 0) {
        velocities[li] += relative * nx;
        velocities[li + 1] += relative * ny;
        velocities[ri] -= relative * nx;
        velocities[ri + 1] -= relative * ny;
      }
    }
  }

  // Collision separation can push an edge object a few pixels outside. Clamp
  // once more and orient its velocity inward so bounds remain an invariant.
  for (let index = 0; index < count; index++) {
    const offset = index * 2;
    if (positions[offset] < low) {
      positions[offset] = low;
      velocities[offset] = Math.abs(velocities[offset]);
    } else if (positions[offset] > high) {
      positions[offset] = high;
      velocities[offset] = -Math.abs(velocities[offset]);
    }
    if (positions[offset + 1] < low) {
      positions[offset + 1] = low;
      velocities[offset + 1] = Math.abs(velocities[offset + 1]);
    } else if (positions[offset + 1] > high) {
      positions[offset + 1] = high;
      velocities[offset + 1] = -Math.abs(velocities[offset + 1]);
    }
  }
}

export function scoreMotSelection(state: MotRound, selected: ReadonlySet<number>): MotScore {
  let hits = 0;
  let falseSelections = 0;
  for (const index of selected) {
    if (!Number.isInteger(index) || index < 0 || index >= state.count) continue;
    if (state.targets[index] === 1) hits++;
    else falseSelections++;
  }
  return { hits, falseSelections, accuracy: hits / state.targetCount };
}
