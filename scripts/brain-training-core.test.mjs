import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

const loader = await import('./brain-training-ts-loader.mjs');
registerHooks({ resolve: loader.resolve, load: loader.load });

const root = '../docs/.vitepress/theme/components/games/brain-training';
const schulte = await import(`${root}/exercises/schulte/core.ts`);
const flanker = await import(`${root}/exercises/flanker/core.ts`);
const nback = await import(`${root}/exercises/n-back/core.ts`);
const switching = await import(`${root}/exercises/task-switching/core.ts`);
const mot = await import(`${root}/exercises/multiple-object-tracking/core.ts`);
const rotation = await import(`${root}/exercises/mental-rotation/core.ts`);
const change = await import(`${root}/exercises/change-localization/core.ts`);
const statistics = await import(`${root}/statistics.ts`);

const exerciseComponents = [
  'schulte/SchulteTraining.vue',
  'flanker/FlankerTraining.vue',
  'n-back/NBackTraining.vue',
  'task-switching/TaskSwitchingTraining.vue',
  'multiple-object-tracking/MultipleObjectTracking.vue',
  'mental-rotation/MentalRotationTraining.vue',
  'change-localization/ChangeLocalizationTraining.vue',
];

for (const component of exerciseComponents) {
  const source = await readFile(new URL(`../docs/.vitepress/theme/components/games/brain-training/exercises/${component}`, import.meta.url), 'utf8');
  assert.equal((source.match(/role="status"/g) ?? []).length, 1, `${component} must have one stable status region`);
  assert.equal((source.match(/aria-live=/g) ?? []).length, 0, `${component} must not add a competing live region`);
}

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

for (let seed = 1; seed <= 200; seed++) {
  const state = mot.createMotRound(12, 4, 0.14, seed);
  assert.equal(state.targets.reduce((sum, value) => sum + value, 0), 4);
  for (let step = 0; step < 960; step++) {
    mot.advanceMotState(state, 1 / 120);
    for (const value of state.positions) {
      assert.ok(Number.isFinite(value) && value >= state.radius - 1e-6 && value <= 1 - state.radius + 1e-6);
    }
    for (let left = 0; left < state.count; left++) {
      for (let right = left + 1; right < state.count; right++) {
        const dx = state.positions[left * 2] - state.positions[right * 2];
        const dy = state.positions[left * 2 + 1] - state.positions[right * 2 + 1];
        assert.ok(Math.hypot(dx, dy) >= state.radius * 1.8, 'MOT objects must not substantially occlude each other');
      }
    }
  }
  const selected = new Set(Array.from(state.targets, (value, index) => value ? index : -1).filter((index) => index >= 0));
  assert.deepEqual(mot.scoreMotSelection(state, selected), { hits: 4, falseSelections: 0, accuracy: 1 });
}

for (let seed = 1; seed <= 500; seed++) {
  const trials = rotation.createRotationTrials(24, seed);
  assert.equal(trials.filter((trial) => trial.same).length, 12);
  const angleBuckets = [0, 45, 90, 135, 180].map((angle) => trials.filter((trial) => trial.angleDeg === angle).length);
  assert.ok(Math.max(...angleBuckets) - Math.min(...angleBuckets) <= 1);
  for (const trial of trials) {
    assert.equal(rotation.areRotationEquivalent(trial.left, trial.right), trial.same);
    assert.ok([0, 45, 90, 135, 180].includes(trial.angleDeg));
    assert.equal(trial.left.length, 5);
    assert.equal(trial.right.length, 5);
  }
}

for (const setSize of [4, 6, 8]) {
  for (let seed = 1; seed <= 300; seed++) {
    const trials = change.createChangeTrials(setSize, 18, seed);
    assert.equal(trials.length, 18);
    for (const trial of trials) {
      assert.equal(trial.slots.length, setSize);
      assert.equal(new Set(trial.slots).size, setSize);
      let changed = 0;
      for (let index = 0; index < setSize; index++) {
        const colorChanged = trial.sampleColors[index] !== trial.probeColors[index];
        const shapeChanged = trial.sampleShapes[index] !== trial.probeShapes[index];
        assert.equal(colorChanged, shapeChanged);
        if (colorChanged) {
          changed++;
          assert.equal(trial.slots[index], trial.changedSlot);
        }
      }
      assert.equal(changed, 1);
    }
  }
}

assert.equal(statistics.median([]), null);
assert.equal(statistics.median([3, 1, 2]), 2);
assert.equal(statistics.median([4, 1, 2, 3]), 2.5);
for (const args of [[10, 10, 0, 10], [0, 10, 10, 10], [5, 10, 5, 10]]) {
  assert.ok(Number.isFinite(statistics.dPrime(...args)));
}

console.log('PASS: live-region invariants; existing cores; 200 MOT simulations; 500 rotation blocks; 900 change-localization blocks; statistics edge cases');
