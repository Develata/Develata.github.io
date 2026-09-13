/** Bounded local result history. Gameplay remains available when storage is blocked. */
import type { TrainingId, TrainingResult } from './contracts';

const MAX_RESULTS = 30;

function storageKey(taskId: TrainingId): string {
  return `gamelab:brain-training:${taskId}:results:v1`;
}

function canUseStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function isResult(value: unknown, taskId: TrainingId): value is TrainingResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TrainingResult>;
  return candidate.schemaVersion === 1 && candidate.taskId === taskId && typeof candidate.durationMs === 'number';
}

export function loadResults(taskId: TrainingId): TrainingResult[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(taskId)) ?? '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => isResult(item, taskId)).slice(0, MAX_RESULTS);
  } catch {
    return [];
  }
}

export function saveResult(result: TrainingResult): void {
  if (!canUseStorage()) return;
  const next = [result, ...loadResults(result.taskId)].slice(0, MAX_RESULTS);
  try {
    window.localStorage.setItem(storageKey(result.taskId), JSON.stringify(next));
  } catch {
    // Private mode or quota failure must not break the exercise.
  }
}
