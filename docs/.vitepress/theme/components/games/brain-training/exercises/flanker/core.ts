/** Pure balanced Flanker trial generation. */
import { createRng, shuffleInPlace } from '../../rng';

export type BinaryDirection = 0 | 1;

export interface FlankerTrial {
  target: BinaryDirection;
  congruent: boolean;
}

export function createFlankerTrials(count: number, seed: number): FlankerTrial[] {
  if (!Number.isInteger(count) || count < 16 || count % 4 !== 0) {
    throw new RangeError('Flanker trial count must be a multiple of four and at least 16');
  }
  const trials: FlankerTrial[] = [];
  for (let i = 0; i < count / 4; i++) {
    trials.push(
      { target: 0, congruent: true },
      { target: 1, congruent: true },
      { target: 0, congruent: false },
      { target: 1, congruent: false }
    );
  }
  return shuffleInPlace(trials, createRng(seed));
}

export function flankerGlyph(trial: FlankerTrial): string {
  const target = trial.target === 0 ? '←' : '→';
  const flank = trial.congruent ? target : trial.target === 0 ? '→' : '←';
  return `${flank}${flank}${target}${flank}${flank}`;
}
