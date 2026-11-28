import type { Cell, SaveData, SerializableCell } from './types';

export const STORAGE_KEY = 'sudoku-state';
export const ANIMATION_DELAY = 20;

export function serializeGrid(grid: Cell[]): SerializableCell[] {
  return grid.map((cell) => ({
    val: cell.val,
    fixed: cell.fixed,
    notes: Array.from(cell.notes),
    error: cell.error,
  }));
}

export function deserializeGrid(grid: SerializableCell[]): Cell[] {
  return grid.map((cell) => ({
    val: cell.val,
    fixed: cell.fixed,
    notes: new Set(cell.notes),
    error: cell.error,
  }));
}

export function loadSavedGame(): SaveData | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as SaveData;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function getCellClass(grid: Cell[], selectedIdx: number | null, index: number): string[] {
  const cell = grid[index];
  const classes: string[] = [];
  if (cell.fixed) classes.push('fixed');
  if (cell.error) classes.push('error');

  if (selectedIdx !== null) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const selectedRow = Math.floor(selectedIdx / 9);
    const selectedCol = selectedIdx % 9;

    if (index === selectedIdx) {
      classes.push('selected');
    } else if (
      row === selectedRow ||
      col === selectedCol ||
      (Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
        Math.floor(col / 3) === Math.floor(selectedCol / 3))
    ) {
      classes.push('related');
    }

    if (cell.val !== 0 && grid[selectedIdx].val === cell.val) {
      classes.push('same-num');
    }
  }

  return classes;
}

export async function runVisualSolve(
  grid: Cell[],
  solution: number[],
  signal: AbortSignal
): Promise<boolean> {
  async function solveStep(index: number): Promise<boolean> {
    if (signal.aborted) {
      throw new Error('aborted');
    }
    if (index === 81) {
      return true;
    }
    if (grid[index].fixed) {
      return solveStep(index + 1);
    }

    grid[index].val = solution[index];
    if (Math.random() > 0.7) {
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DELAY));
    }
    if (await solveStep(index + 1)) {
      return true;
    }

    grid[index].val = 0;
    return false;
  }

  return solveStep(0);
}
