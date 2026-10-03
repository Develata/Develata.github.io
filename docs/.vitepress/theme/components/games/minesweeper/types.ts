export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  count: number;
  isExploded?: boolean;
}

export interface GameConfig {
  rows: number;
  cols: number;
  density: number;
  totalMines: number;
}

export type MinesweeperGameState = 'idle' | 'playing' | 'won' | 'lost';
