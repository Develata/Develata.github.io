import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const loader = await import('./brain-training-ts-loader.mjs');
registerHooks({ resolve: loader.resolve, load: loader.load });

const root = '../docs/.vitepress/theme/components/games/brain-training';
const schulte = await import(`${root}/exercises/schulte/core.ts`);
const flanker = await import(`${root}/exercises/flanker/core.ts`);
const nback = await import(`${root}/exercises/n-back/core.ts`);
const switching = await import(`${root}/exercises/task-switching/core.ts`);
const statistics = await import(`${root}/statistics.ts`);

for (const size of [3, 4, 5, 6]) {
  for (const mode of ['ascending', 'descending', 'alternating']) {
    for (let seed = 1; seed <= 100; seed++) {
      const round = schulte.createSchulteRound(size, mode, seed);
      const count = size * size;
      assert.deepEqual([...round.cells].sort((a, b) => a - b), Array.from({ length: count }, (_, index) => index + 1));
      assert.equal(round.sequence.length, count);
      assert.equal(new Set(round.sequence).size, count);
    }
  }
}

for (let seed = 1; seed <= 500; seed++) {
  const trials = flanker.createFlankerTrials(24, seed);
  assert.equal(trials.length, 24);
  assert.equal(trials.filter((trial) => trial.congruent).length, 12);
  assert.equal(trials.filter((trial) => !trial.congruent).length, 12);
}

for (const n of [1, 2, 3]) {
  for (let seed = 1; seed <= 500; seed++) {
    const sequence = nback.createNBackSequence(n, 28, seed, 0.28);
    let targets = 0;
    for (let index = n; index < sequence.positions.length; index++) {
      const expected = sequence.positions[index] === sequence.positions[index - n] ? 1 : 0;
      assert.equal(sequence.targets[index], expected);
      targets += sequence.targets[index];
    }
    assert.equal(targets, Math.round((28 - n) * 0.28));
  }
}

for (let seed = 1; seed <= 500; seed++) {
  const trials = switching.createSwitchingTrials(32, seed);
  const buckets = [0, 0, 0, 0];
  for (let index = 0; index < trials.length; index++) {
    const trial = trials[index];
    const expected = trial.rule === 0 ? (trial.digit % 2 === 0 ? 1 : 0) : (trial.digit > 5 ? 1 : 0);
    assert.equal(trial.answer, expected);
    assert.equal(trial.switched, index > 0 && trial.rule !== trials[index - 1].rule);
    if (index > 0) {
      const repeated = trial.answer === trials[index - 1].answer;
      buckets[(trial.switched ? 2 : 0) + (repeated ? 0 : 1)]++;
    }
  }
  assert.ok(Math.max(...buckets) - Math.min(...buckets) <= 1);
}

assert.equal(statistics.median([]), null);
assert.equal(statistics.median([3, 1, 2]), 2);
assert.equal(statistics.median([4, 1, 2, 3]), 2.5);
for (const args of [[10, 10, 0, 10], [0, 10, 10, 10], [5, 10, 5, 10]]) {
  assert.ok(Number.isFinite(statistics.dPrime(...args)));
}

console.log('PASS: 1,200 Schulte rounds; 500 Flanker blocks; 1,500 n-back sequences; 500 switching blocks; statistics edge cases');
