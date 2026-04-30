/**
 * @file types.ts
 * @description Math Lab 零参与模拟实验的共享接口。
 */
export interface StatItem {
  label: string;
  value: string | number;
}

export interface SelectOption {
  id: string;
  label: string;
}

export interface NumberOption {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface RuntimeConfig {
  preset: string;
  seed: number;
  values: Record<string, number>;
}

export interface SimulationRuntime {
  reset(width: number, height: number, config: RuntimeConfig): void;
  resize?(width: number, height: number): void;
  step(): void;
  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void;
  stats(): StatItem[];
  pointerDown?(x: number, y: number): void;
  pointerMove?(x: number, y: number): void;
}

export interface ExperimentSpec {
  title: string;
  subtitle: string;
  presets: SelectOption[];
  controls?: NumberOption[];
  canvasHeight?: number;
  randomPreset?: string;
  stepsPerFrame?: number;
  create(): SimulationRuntime;
}
