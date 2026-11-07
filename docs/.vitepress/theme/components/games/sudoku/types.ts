export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type SudokuGameState = 'playing' | 'won' | 'lost' | 'solving';

export interface Cell {
  val: number;
  fixed: boolean;
  notes: Set<number>;
  error: boolean;
}

export interface SerializableCell {
  val: number;
  fixed: boolean;
  notes: number[];
  error: boolean;
}

export interface SaveData {
  grid: SerializableCell[];
  solution: number[];
  timer: number;
  mistakes: number;
  difficulty: Difficulty;
}
