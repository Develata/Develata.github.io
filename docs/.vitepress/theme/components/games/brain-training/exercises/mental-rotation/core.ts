/** Procedural chiral polyomino pairs for a two-dimensional mental-rotation task. */
import { createRng, shuffleInPlace } from '../../rng';

export interface Cell { x: number; y: number }
export interface RotationTrial {
  left: readonly Cell[];
  right: readonly Cell[];
  same: boolean;
  leftAngleDeg: number;
  rightAngleDeg: number;
  angleDeg: 0 | 45 | 90 | 135 | 180;
}

const ANGLE_BINS = [0, 45, 90, 135, 180] as const;

const CANDIDATES: readonly (readonly Cell[])[] = [
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 1 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
];

export function normalizeCells(cells: readonly Cell[]): Cell[] {
  const minX = Math.min(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  return cells
    .map((cell) => ({ x: cell.x - minX, y: cell.y - minY }))
    .sort((left, right) => left.y - right.y || left.x - right.x);
}

export function rotateCells(cells: readonly Cell[], quarterTurns: number): Cell[] {
  let result = normalizeCells(cells);
  const turns = ((quarterTurns % 4) + 4) % 4;
  for (let turn = 0; turn < turns; turn++) {
    result = normalizeCells(result.map((cell) => ({ x: -cell.y, y: cell.x })));
  }
  return result;
}

export function reflectCells(cells: readonly Cell[]): Cell[] {
  return normalizeCells(cells.map((cell) => ({ x: -cell.x, y: cell.y })));
}

export function cellSignature(cells: readonly Cell[]): string {
  return normalizeCells(cells).map((cell) => `${cell.x},${cell.y}`).join(';');
}

export function areRotationEquivalent(left: readonly Cell[], right: readonly Cell[]): boolean {
  return rotationDistanceQuarter(left, right) !== null;
}

export function rotationDistanceQuarter(left: readonly Cell[], right: readonly Cell[]): 0 | 1 | 2 | null {
  const signature = cellSignature(left);
  const distances = [0, 1, 2, 3]
    .filter((turn) => cellSignature(rotateCells(right, turn)) === signature)
    .map((turn) => Math.min(turn, 4 - turn));
  return distances.length === 0 ? null : Math.min(...distances) as 0 | 1 | 2;
}

const CHIRAL_BASES = CANDIDATES.filter((cells) => (
  !areRotationEquivalent(cells, reflectCells(cells))
  && ![1, 2, 3].some((turn) => cellSignature(rotateCells(cells, turn)) === cellSignature(cells))
));
if (CHIRAL_BASES.length < 3) throw new Error('Mental-rotation base library must contain chiral shapes');

export function createRotationTrials(count: number, seed: number): RotationTrial[] {
  if (!Number.isInteger(count) || count < 8 || count > 40 || count % 2 !== 0) {
    throw new RangeError('Mental-rotation trial count must be an even integer from 8 to 40');
  }
  const rng = createRng(seed);
  const trials: RotationTrial[] = [];
  for (let index = 0; index < count; index++) {
    const base = CHIRAL_BASES[rng.int(CHIRAL_BASES.length)];
    const same = index < count / 2;
    const left = rotateCells(base, rng.int(4));
    const right = same ? left : reflectCells(left);
    const angleDeg = ANGLE_BINS[index % ANGLE_BINS.length];
    const leftAngleDeg = rng.int(8) * 45;
    const direction = rng.int(2) === 0 ? -1 : 1;
    trials.push({
      left,
      right,
      same,
      leftAngleDeg,
      rightAngleDeg: (leftAngleDeg + direction * angleDeg + 360) % 360,
      angleDeg,
    });
  }
  return shuffleInPlace(trials, rng);
}

export function describeCells(cells: readonly Cell[]): string {
  return normalizeCells(cells).map((cell) => `第 ${cell.y + 1} 行第 ${cell.x + 1} 列`).join('、');
}
