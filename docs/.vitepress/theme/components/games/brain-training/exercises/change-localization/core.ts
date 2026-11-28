/** Deterministic color-and-shape arrays for a change-localization task. */
import { createRng, shuffleInPlace } from '../../rng';

export const COLOR_LABELS = ['蓝色', '橙色', '青色', '紫色', '红色', '绿色'] as const;
export const COLOR_VALUES = ['#2563eb', '#c2410c', '#0f766e', '#8b4cf0', '#d11f4d', '#15803d'] as const;
export const SHAPE_LABELS = ['圆形', '方形', '菱形', '三角形'] as const;
export const SHAPE_GLYPHS = ['●', '■', '◆', '▲'] as const;

export interface ChangeTrial {
  readonly slots: Uint8Array;
  readonly sampleColors: Uint8Array;
  readonly sampleShapes: Uint8Array;
  readonly probeColors: Uint8Array;
  readonly probeShapes: Uint8Array;
  readonly changedSlot: number;
}

export function createChangeTrials(setSize: number, count: number, seed: number): ChangeTrial[] {
  if (!Number.isInteger(setSize) || setSize < 3 || setSize > 8) throw new RangeError('Change set size must be 3–8');
  if (!Number.isInteger(count) || count < 8 || count > 32) throw new RangeError('Change trial count must be 8–32');
  const rng = createRng(seed);
  const trials: ChangeTrial[] = [];

  for (let trialIndex = 0; trialIndex < count; trialIndex++) {
    const selectedSlots = shuffleInPlace(Array.from({ length: 9 }, (_, index) => index), rng).slice(0, setSize).sort((a, b) => a - b);
    const slots = Uint8Array.from(selectedSlots);
    const sampleColors = new Uint8Array(setSize);
    const sampleShapes = new Uint8Array(setSize);
    for (let index = 0; index < setSize; index++) {
      sampleColors[index] = rng.int(COLOR_LABELS.length);
      sampleShapes[index] = rng.int(SHAPE_LABELS.length);
    }
    const probeColors = sampleColors.slice();
    const probeShapes = sampleShapes.slice();
    const changedIndex = rng.int(setSize);
    probeColors[changedIndex] = (sampleColors[changedIndex] + 1 + rng.int(COLOR_LABELS.length - 1)) % COLOR_LABELS.length;
    probeShapes[changedIndex] = (sampleShapes[changedIndex] + 1 + rng.int(SHAPE_LABELS.length - 1)) % SHAPE_LABELS.length;
    trials.push({ slots, sampleColors, sampleShapes, probeColors, probeShapes, changedSlot: slots[changedIndex] });
  }
  return trials;
}

export function describeChangeArray(trial: ChangeTrial, probe: boolean): string {
  const colors = probe ? trial.probeColors : trial.sampleColors;
  const shapes = probe ? trial.probeShapes : trial.sampleShapes;
  return Array.from(trial.slots, (slot, index) => {
    const row = Math.floor(slot / 3) + 1;
    const column = slot % 3 + 1;
    return `第 ${row} 行第 ${column} 列是${COLOR_LABELS[colors[index]]}${SHAPE_LABELS[shapes[index]]}`;
  }).join('；');
}

export function itemIndexAtSlot(trial: ChangeTrial, slot: number): number {
  return trial.slots.indexOf(slot);
}
