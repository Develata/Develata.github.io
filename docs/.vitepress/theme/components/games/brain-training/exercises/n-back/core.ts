/** Pure spatial n-back sequence generation with an exact target count. */
import { createRng, shuffleInPlace } from '../../rng';

export interface NBackSequence {
  positions: Uint8Array;
  targets: Uint8Array;
  n: number;
  seed: number;
}

export function createNBackSequence(n: number, count: number, seed: number, targetRate = 0.3): NBackSequence {
  if (!Number.isInteger(n) || n < 1 || n > 3) throw new RangeError('n must be 1, 2, or 3');
  if (!Number.isInteger(count) || count < n + 12) throw new RangeError('trial count is too small');

  const rng = createRng(seed);
  const positions = new Uint8Array(count);
  const targets = new Uint8Array(count);
  const eligible = Array.from({ length: count - n }, (_, index) => index + n);
  shuffleInPlace(eligible, rng);
  const targetCount = Math.max(1, Math.round(eligible.length * targetRate));
  for (let i = 0; i < targetCount; i++) targets[eligible[i]] = 1;

  for (let i = 0; i < count; i++) {
    if (i >= n && targets[i] === 1) {
      positions[i] = positions[i - n];
      continue;
    }
    if (i < n) {
      positions[i] = rng.int(9);
      continue;
    }
    const forbidden = positions[i - n];
    const candidate = rng.int(8);
    positions[i] = candidate >= forbidden ? candidate + 1 : candidate;
  }

  return { positions, targets, n, seed };
}
