/** Pure task-switching schedule generation. */
import { createRng, shuffleInPlace } from '../../rng';

export type TaskRule = 0 | 1; // 0: parity, 1: magnitude
export type BinaryChoice = 0 | 1;

export interface SwitchingTrial {
  rule: TaskRule;
  digit: number;
  answer: BinaryChoice;
  switched: boolean;
}

const DIGITS: readonly [readonly number[], readonly number[]][] = [
  [[1, 3, 7, 9], [2, 4, 6, 8]],
  [[1, 2, 3, 4], [6, 7, 8, 9]],
];

export function createSwitchingTrials(count: number, seed: number): SwitchingTrial[] {
  if (!Number.isInteger(count) || count < 16 || count % 4 !== 0) {
    throw new RangeError('Switching trial count must be a multiple of four and at least 16');
  }
  const rng = createRng(seed);
  // Counterbalance rule switches and response repetitions jointly. Independent
  // shuffles can accidentally put nearly every repeated response in one rule
  // condition, confounding the measured switch cost.
  const transitions = Array.from({ length: count - 1 }, (_, index) => ({
    switched: index % 4 >= 2,
    repeatedAnswer: index % 2 === 0,
  }));
  shuffleInPlace(transitions, rng);

  const trials: SwitchingTrial[] = [];
  let rule = rng.int(2) as TaskRule;
  let answer = rng.int(2) as BinaryChoice;
  for (let i = 0; i < count; i++) {
    const transition = transitions[i - 1];
    const switched = i > 0 && transition.switched;
    if (switched) rule = (1 - rule) as TaskRule;
    if (i > 0 && !transition.repeatedAnswer) answer = (1 - answer) as BinaryChoice;
    const pool = DIGITS[rule][answer];
    trials.push({ rule, answer, switched, digit: pool[rng.int(pool.length)] });
  }
  return trials;
}

export function ruleLabel(rule: TaskRule): string {
  return rule === 0 ? '判断奇偶' : '判断大小';
}
