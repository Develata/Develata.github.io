/** Shared public contracts for the cognitive-task modules. */
export type TrainingId =
  | 'schulte'
  | 'flanker'
  | 'n-back'
  | 'task-switching'
  | 'multiple-object-tracking'
  | 'mental-rotation'
  | 'change-localization';
export type InputMode = 'none' | 'keyboard' | 'pointer' | 'mixed';

export interface TrainingResult {
  schemaVersion: 1;
  taskId: TrainingId;
  completedAt: string;
  durationMs: number;
  seed: number;
  variant: string;
  inputMode: InputMode;
  metrics: Record<string, number>;
  parameters: Record<string, string | number | boolean>;
}

export interface TrainingCatalogItem {
  id: TrainingId;
  title: string;
  enTitle: string;
  description: string;
  construct: string;
  route: string;
  symbol: string;
  accent: string;
  darkAccent: string;
  duration: string;
}
