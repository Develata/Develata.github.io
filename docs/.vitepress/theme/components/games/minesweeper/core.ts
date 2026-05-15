import type { Cell } from './types';

export function createBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      isMine: false,
      isOpen: false,
      isFlagged: false,
      count: 0,
    }))
  );
}

export function forEachNeighbor(
  rows: number,
  cols: number,
  row: number,
  col: number,
  visit: (nextRow: number, nextCol: number) => void
) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) {
        continue;
      }
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
        visit(nextRow, nextCol);
      }
    }
  }
}

export function placeMines(
  board: Cell[][],
  rows: number,
  cols: number,
  totalMines: number,
  excludeRow: number,
  excludeCol: number
) {
  const candidates: Array<[number, number]> = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1) {
        continue;
      }
      candidates.push([row, col]);
    }
  }

  const mineCount = Math.min(totalMines, candidates.length);
  for (let i = 0; i < mineCount; i++) {
    const j = i + Math.floor(Math.random() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];

    const [row, col] = candidates[i];
    board[row][col].isMine = true;
    forEachNeighbor(rows, cols, row, col, (nextRow, nextCol) => {
      if (!board[nextRow][nextCol].isMine) {
        board[nextRow][nextCol].count++;
      }
    });
  }
}

export function revealRegion(board: Cell[][], rows: number, cols: number, startRow: number, startCol: number) {
  const stack: Array<[number, number]> = [[startRow, startCol]];
  while (stack.length > 0) {
    const [row, col] = stack.pop()!;
    const cell = board[row][col];
    if (cell.isOpen || cell.isFlagged) {
      continue;
    }

    cell.isOpen = true;
    if (cell.count !== 0) {
      continue;
    }

    forEachNeighbor(rows, cols, row, col, (nextRow, nextCol) => {
      const next = board[nextRow][nextCol];
      if (!next.isOpen && !next.isFlagged) {
        stack.push([nextRow, nextCol]);
      }
    });
  }
}

export function checkWin(board: Cell[][], rows: number, cols: number, totalMines: number): boolean {
  let opened = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].isOpen) {
        opened++;
      }
    }
  }
  return opened === rows * cols - totalMines;
}

export function revealAllMines(board: Cell[][], rows: number, cols: number) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].isMine) {
        board[row][col].isOpen = true;
      }
    }
  }
}

export function flagAllMines(board: Cell[][], rows: number, cols: number): number {
  let added = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = board[row][col];
      if (cell.isMine && !cell.isFlagged) {
        cell.isFlagged = true;
        added++;
      }
    }
  }
  return added;
}
