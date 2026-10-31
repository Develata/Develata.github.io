import { deserializeGrid, serializeGrid, STORAGE_KEY } from './runtime';
import type { Cell, Difficulty, SerializableCell } from './types';

export function saveSudokuState(
  grid: Cell[],
  solution: number[],
  timer: number,
  mistakes: number,
  difficulty: Difficulty
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      grid: serializeGrid(grid),
      solution,
      timer,
      mistakes,
      difficulty,
    })
  );
}

export function createSnapshot(grid: Cell[], mistakes: number): string {
  return JSON.stringify({
    grid: serializeGrid(grid),
    mistakes,
  });
}

export function restoreSnapshot(snapshot: string): { grid: Cell[]; mistakes: number } {
  const parsed = JSON.parse(snapshot) as { grid: SerializableCell[]; mistakes: number };
  return {
    grid: deserializeGrid(parsed.grid),
    mistakes: parsed.mistakes,
  };
}
