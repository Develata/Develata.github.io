/**
 * @file core.ts
 * @description 推箱子的纯规则核心。地形、玩家、箱子状态分离，便于校验与 UI 复用。
 */

import type { BoardCell, Direction, MoveResult, SokobanLevel, SokobanState, Terrain } from './types';

const DIRECTION_DELTAS: Record<Direction, { row: number; col: number }> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

interface ParsedCell {
  terrain: Terrain;
  player: boolean;
  box: boolean;
}

function toIndex(row: number, col: number, width: number): number {
  return row * width + col;
}

function toRow(index: number, width: number): number {
  return Math.floor(index / width);
}

function toCol(index: number, width: number): number {
  return index % width;
}

function sortBoxes(boxes: number[]): number[] {
  return [...boxes].sort((a, b) => a - b);
}

function parseCell(ch: string): ParsedCell {
  switch (ch) {
    case ' ':
      return { terrain: 'void', player: false, box: false };
    case '#':
      return { terrain: 'wall', player: false, box: false };
    case '_':
      return { terrain: 'floor', player: false, box: false };
    case '.':
      return { terrain: 'goal', player: false, box: false };
    case '@':
      return { terrain: 'floor', player: true, box: false };
    case '+':
      return { terrain: 'goal', player: true, box: false };
    case '$':
      return { terrain: 'floor', player: false, box: true };
    case '*':
      return { terrain: 'goal', player: false, box: true };
    default:
      throw new Error(`非法推箱子地图字符: ${ch}`);
  }
}
export function parseLevel(level: SokobanLevel): SokobanState {
  if (level.rows.length === 0) {
    throw new Error(`关卡 ${level.id} 没有地图数据`);
  }

  const width = Math.max(...level.rows.map((row) => row.length));
  const height = level.rows.length;
  const terrain: Terrain[] = [];
  const boxes: number[] = [];
  let player = -1;
  let players = 0;
  let goals = 0;

  for (let row = 0; row < height; row++) {
    const padded = level.rows[row].padEnd(width, ' ');
    for (let col = 0; col < width; col++) {
      const parsed = parseCell(padded[col]);
      const index = toIndex(row, col, width);
      terrain[index] = parsed.terrain;

      if (parsed.terrain === 'goal') {
        goals++;
      }
      if (parsed.player) {
        player = index;
        players++;
      }
      if (parsed.box) {
        boxes.push(index);
      }
    }
  }

  if (players !== 1) {
    throw new Error(`关卡 ${level.id} 必须有且仅有一个玩家，实际为 ${players}`);
  }
  if (boxes.length === 0 || boxes.length !== goals) {
    throw new Error(`关卡 ${level.id} 箱子数 ${boxes.length} 与目标数 ${goals} 不匹配`);
  }
  if (boxes.length !== level.boxCount) {
    throw new Error(`关卡 ${level.id} 元数据 boxCount=${level.boxCount} 与地图箱子数 ${boxes.length} 不匹配`);
  }

  return {
    levelId: level.id,
    width,
    height,
    terrain,
    player,
    boxes: sortBoxes(boxes),
    moves: 0,
    pushes: 0,
    won: isSolved(terrain, boxes),
  };
}

export function isWalkable(state: Pick<SokobanState, 'terrain'>, index: number): boolean {
  const terrain = state.terrain[index];
  return terrain === 'floor' || terrain === 'goal';
}

export function isSolved(terrain: Terrain[], boxes: number[]): boolean {
  return boxes.every((box) => terrain[box] === 'goal');
}

export function movePlayer(state: SokobanState, direction: Direction): MoveResult {
  if (state.won) {
    return { moved: false, pushed: false, won: true, state };
  }

  const delta = DIRECTION_DELTAS[direction];
  const row = toRow(state.player, state.width);
  const col = toCol(state.player, state.width);
  const nextRow = row + delta.row;
  const nextCol = col + delta.col;

  if (nextRow < 0 || nextRow >= state.height || nextCol < 0 || nextCol >= state.width) {
    return { moved: false, pushed: false, won: state.won, state };
  }

  const next = toIndex(nextRow, nextCol, state.width);
  if (!isWalkable(state, next)) {
    return { moved: false, pushed: false, won: state.won, state };
  }

  const boxIndex = state.boxes.indexOf(next);
  if (boxIndex === -1) {
    const nextState = {
      ...state,
      player: next,
      moves: state.moves + 1,
    };
    return { moved: true, pushed: false, won: nextState.won, state: nextState };
  }

  const boxRow = nextRow + delta.row;
  const boxCol = nextCol + delta.col;
  if (boxRow < 0 || boxRow >= state.height || boxCol < 0 || boxCol >= state.width) {
    return { moved: false, pushed: false, won: state.won, state };
  }

  const boxTarget = toIndex(boxRow, boxCol, state.width);
  if (!isWalkable(state, boxTarget) || state.boxes.includes(boxTarget)) {
    return { moved: false, pushed: false, won: state.won, state };
  }

  const boxes = [...state.boxes];
  boxes[boxIndex] = boxTarget;
  const sortedBoxes = sortBoxes(boxes);
  const won = isSolved(state.terrain, sortedBoxes);
  const nextState = {
    ...state,
    player: next,
    boxes: sortedBoxes,
    moves: state.moves + 1,
    pushes: state.pushes + 1,
    won,
  };

  return { moved: true, pushed: true, won, state: nextState };
}

export function createSnapshot(state: SokobanState): string {
  return [
    state.player,
    state.boxes.join(','),
    state.moves,
    state.pushes,
    state.won ? 1 : 0,
  ].join('|');
}

export function restoreSnapshot(base: SokobanState, snapshot: string): SokobanState {
  const [playerRaw, boxesRaw, movesRaw, pushesRaw, wonRaw] = snapshot.split('|');
  const boxes = boxesRaw.length ? boxesRaw.split(',').map((value) => Number.parseInt(value, 10)) : [];

  return {
    ...base,
    player: Number.parseInt(playerRaw, 10),
    boxes: sortBoxes(boxes),
    moves: Number.parseInt(movesRaw, 10),
    pushes: Number.parseInt(pushesRaw, 10),
    won: wonRaw === '1',
  };
}

export function createBoardCells(state: SokobanState): BoardCell[] {
  const boxSet = new Set(state.boxes);
  return state.terrain.map((terrain, index) => {
    const row = toRow(index, state.width);
    const col = toCol(index, state.width);
    const hasBox = boxSet.has(index);
    return {
      key: `${row}-${col}`,
      row,
      col,
      terrain,
      hasPlayer: state.player === index,
      hasBox,
      boxOnGoal: hasBox && terrain === 'goal',
    };
  });
}

export function directionFromKey(key: string): Direction | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'up';
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'down';
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right';
    default:
      return null;
  }
}
