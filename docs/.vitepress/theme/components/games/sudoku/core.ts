import type { Difficulty } from './types';

const SIZE = 9;
const BOX = 3;

const CLUES_BY_DIFFICULTY: Record<Difficulty, number> = {
  Easy: 45,
  Medium: 35,
  Hard: 28,
};

type Grid = number[][];

function createEmptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0));
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function shuffle(values: number[]): number[] {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function isSafe(grid: Grid, row: number, col: number, value: number): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === value || grid[i][col] === value) {
      return false;
    }
  }

  const startRow = row - (row % BOX);
  const startCol = col - (col % BOX);
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      if (grid[startRow + r][startCol + c] === value) {
        return false;
      }
    }
  }
  return true;
}

function fillBox(grid: Grid, row: number, col: number): void {
  const values = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  let index = 0;
  for (let r = 0; r < BOX; r++) {
    for (let c = 0; c < BOX; c++) {
      grid[row + r][col + c] = values[index++];
    }
  }
}

function fillDiagonal(grid: Grid): void {
  for (let i = 0; i < SIZE; i += BOX) {
    fillBox(grid, i, i);
  }
}

function findBestEmptyCell(grid: Grid): { row: number; col: number; candidates: number[] } | null {
  let best: { row: number; col: number; candidates: number[] } | null = null;

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (grid[row][col] !== 0) {
        continue;
      }

      const candidates: number[] = [];
      for (let value = 1; value <= SIZE; value++) {
        if (isSafe(grid, row, col, value)) {
          candidates.push(value);
        }
      }

      if (candidates.length === 0) {
        return { row, col, candidates };
      }

      if (!best || candidates.length < best.candidates.length) {
        best = { row, col, candidates };
        if (candidates.length === 1) {
          return best;
        }
      }
    }
  }

  return best;
}

function solveInPlace(grid: Grid, randomized: boolean): boolean {
  const next = findBestEmptyCell(grid);
  if (!next) {
    return true;
  }
  if (next.candidates.length === 0) {
    return false;
  }

  const candidates = randomized ? shuffle([...next.candidates]) : next.candidates;
  for (const value of candidates) {
    grid[next.row][next.col] = value;
    if (solveInPlace(grid, randomized)) {
      return true;
    }
    grid[next.row][next.col] = 0;
  }
  return false;
}

function countSolutions(grid: Grid, limit: number): number {
  const next = findBestEmptyCell(grid);
  if (!next) {
    return 1;
  }
  if (next.candidates.length === 0) {
    return 0;
  }

  let total = 0;
  for (const value of next.candidates) {
    grid[next.row][next.col] = value;
    total += countSolutions(grid, limit);
    grid[next.row][next.col] = 0;
    if (total >= limit) {
      return total;
    }
  }
  return total;
}

function carvePuzzle(fullGrid: Grid, clues: number): Grid {
  const puzzle = cloneGrid(fullGrid);
  const positions = shuffle(Array.from({ length: SIZE * SIZE }, (_, index) => index));
  const removals = SIZE * SIZE - clues;
  let removed = 0;

  for (const position of positions) {
    if (removed >= removals) {
      break;
    }

    const row = Math.floor(position / SIZE);
    const col = position % SIZE;
    const backup = puzzle[row][col];
    if (backup === 0) {
      continue;
    }

    puzzle[row][col] = 0;
    const candidate = cloneGrid(puzzle);
    if (countSolutions(candidate, 2) !== 1) {
      puzzle[row][col] = backup;
      continue;
    }
    removed++;
  }

  return puzzle;
}

export function generateSudokuPuzzle(difficulty: Difficulty): { puzzle: number[]; solution: number[] } {
  const solved = createEmptyGrid();
  fillDiagonal(solved);
  solveInPlace(solved, true);

  const puzzle = carvePuzzle(solved, CLUES_BY_DIFFICULTY[difficulty]);
  return {
    puzzle: puzzle.flat(),
    solution: solved.flat(),
  };
}
