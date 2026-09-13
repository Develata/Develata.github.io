import type { Cell } from './types';

export function autoEraseNotes(grid: Cell[], index: number, num: number) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  for (let i = 0; i < 9; i++) {
    grid[row * 9 + i].notes.delete(num);
    grid[i * 9 + col].notes.delete(num);
  }

  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      grid[(startRow + r) * 9 + (startCol + c)].notes.delete(num);
    }
  }
}

export function isSolved(grid: Cell[]): boolean {
  return grid.every((cell) => cell.val !== 0 && !cell.error);
}

export function moveSelection(index: number, key: string): number {
  const row = Math.floor(index / 9);
  const col = index % 9;
  let nextRow = row;
  let nextCol = col;

  if (key === 'ArrowUp') nextRow = (row - 1 + 9) % 9;
  if (key === 'ArrowDown') nextRow = (row + 1) % 9;
  if (key === 'ArrowLeft') nextCol = (col - 1 + 9) % 9;
  if (key === 'ArrowRight') nextCol = (col + 1) % 9;

  return nextRow * 9 + nextCol;
}
