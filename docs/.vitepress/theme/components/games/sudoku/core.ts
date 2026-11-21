import type { Difficulty } from './types';

const SIZE = 9;
const BOX = 3;
const ALL_VALUES_MASK = (1 << SIZE) - 1;

const CLUES_BY_DIFFICULTY: Record<Difficulty, number> = {
  Easy: 45,
  Medium: 35,
  Hard: 28,
};

type Grid = number[][];

interface SolverState {
  grid: Grid;
  rowMasks: number[];
  colMasks: number[];
  boxMasks: number[];
}

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

function boxIndex(row: number, col: number): number {
  return Math.floor(row / BOX) * BOX + Math.floor(col / BOX);
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

function createSolverState(grid: Grid): SolverState {
  const state: SolverState = {
    grid,
    rowMasks: Array<number>(SIZE).fill(0),
    colMasks: Array<number>(SIZE).fill(0),
    boxMasks: Array<number>(SIZE).fill(0),
  };

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const value = grid[row][col];
      if (value === 0) {
        continue;
      }
      const mask = valueToMask(value);
      state.rowMasks[row] |= mask;
      state.colMasks[col] |= mask;
      state.boxMasks[boxIndex(row, col)] |= mask;
    }
  }

  return state;
}

function valueToMask(value: number): number {
  return 1 << (value - 1);
}

function maskToValues(mask: number, randomized: boolean): number[] {
  const values: number[] = [];
  for (let value = 1; value <= SIZE; value++) {
    if (mask & valueToMask(value)) {
      values.push(value);
    }
  }
  return randomized ? shuffle(values) : values;
}

function popCount(mask: number): number {
  let count = 0;
  while (mask !== 0) {
    mask &= mask - 1;
    count++;
  }
  return count;
}

function getCandidatesMask(state: SolverState, row: number, col: number): number {
  return ALL_VALUES_MASK & ~(state.rowMasks[row] | state.colMasks[col] | state.boxMasks[boxIndex(row, col)]);
}

function placeValue(state: SolverState, row: number, col: number, value: number): void {
  const mask = valueToMask(value);
  state.grid[row][col] = value;
  state.rowMasks[row] |= mask;
  state.colMasks[col] |= mask;
  state.boxMasks[boxIndex(row, col)] |= mask;
}

function clearValue(state: SolverState, row: number, col: number, value: number): void {
  const mask = ~valueToMask(value);
  state.grid[row][col] = 0;
  state.rowMasks[row] &= mask;
  state.colMasks[col] &= mask;
  state.boxMasks[boxIndex(row, col)] &= mask;
}

function findBestEmptyCell(state: SolverState): { row: number; col: number; candidatesMask: number } | null {
  let best: { row: number; col: number; candidatesMask: number; count: number } | null = null;

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (state.grid[row][col] !== 0) {
        continue;
      }

      const candidatesMask = getCandidatesMask(state, row, col);
      const count = popCount(candidatesMask);
      if (count === 0) {
        return { row, col, candidatesMask };
      }
      if (!best || count < best.count) {
        best = { row, col, candidatesMask, count };
        if (count === 1) {
          return best;
        }
      }
    }
  }

  return best;
}

function solveState(state: SolverState, randomized: boolean): boolean {
  const next = findBestEmptyCell(state);
  if (!next) {
    return true;
  }
  if (next.candidatesMask === 0) {
    return false;
  }

  for (const value of maskToValues(next.candidatesMask, randomized)) {
    placeValue(state, next.row, next.col, value);
    if (solveState(state, randomized)) {
      return true;
    }
    clearValue(state, next.row, next.col, value);
  }
  return false;
}

function solveInPlace(grid: Grid, randomized: boolean): boolean {
  return solveState(createSolverState(grid), randomized);
}

function countSolutionsState(state: SolverState, limit: number): number {
  const next = findBestEmptyCell(state);
  if (!next) {
    return 1;
  }
  if (next.candidatesMask === 0) {
    return 0;
  }

  let total = 0;
  for (const value of maskToValues(next.candidatesMask, false)) {
    placeValue(state, next.row, next.col, value);
    total += countSolutionsState(state, limit);
    clearValue(state, next.row, next.col, value);
    if (total >= limit) {
      return total;
    }
  }
  return total;
}

function countSolutions(grid: Grid, limit: number): number {
  return countSolutionsState(createSolverState(grid), limit);
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
