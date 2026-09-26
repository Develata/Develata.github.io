/** Pure Schulte-grid generation. O(size²) time and memory. */
import { createRng, shuffleInPlace } from '../../rng';

export type SchulteMode = 'ascending' | 'descending' | 'alternating';

export interface SchulteRound {
  cells: number[];
  sequence: number[];
  size: number;
  mode: SchulteMode;
  seed: number;
}

export function createSchulteRound(size: number, mode: SchulteMode, seed: number): SchulteRound {
  if (!Number.isInteger(size) || size < 3 || size > 6) {
    throw new RangeError('Schulte grid size must be an integer from 3 to 6');
  }
  const count = size * size;
  const cells = Array.from({ length: count }, (_, index) => index + 1);
  shuffleInPlace(cells, createRng(seed));

  let sequence: number[];
  if (mode === 'descending') {
    sequence = Array.from({ length: count }, (_, index) => count - index);
  } else if (mode === 'alternating') {
    sequence = [];
    for (let low = 1, high = count; low <= high; low++, high--) {
      sequence.push(low);
      if (low !== high) sequence.push(high);
    }
  } else {
    sequence = Array.from({ length: count }, (_, index) => index + 1);
  }

  return { cells, sequence, size, mode, seed };
}
