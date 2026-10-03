/**
 * @file types.ts
 * @description 推箱子规则核心与 UI 之间共享的显式数据契约。
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Terrain = 'void' | 'floor' | 'wall' | 'goal';

export interface Position {
  row: number;
  col: number;
}

export interface SokobanLevel {
  id: string;
  title: string;
  rows: string[];
  seed: string;
  boxCount: number;
  minPushes: number;
  score: number;
}

export interface SokobanState {
  levelId: string;
  width: number;
  height: number;
  terrain: Terrain[];
  player: number;
  boxes: number[];
  moves: number;
  pushes: number;
  won: boolean;
}

export interface BoardCell {
  key: string;
  row: number;
  col: number;
  terrain: Terrain;
  hasPlayer: boolean;
  hasBox: boolean;
  boxOnGoal: boolean;
}

export interface MoveResult {
  moved: boolean;
  pushed: boolean;
  won: boolean;
  state: SokobanState;
}

export interface LevelRecord {
  moves: number;
  pushes: number;
  updatedAt: string;
}
