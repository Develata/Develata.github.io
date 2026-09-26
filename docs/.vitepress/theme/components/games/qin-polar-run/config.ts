/** ABI v2 constants must match rust/src/runner.rs; no gameplay rules live here. */
export const ABI_VERSION = 2
export const FRAME_LENGTH = 144
export const CHUNKS = 8
export const CHUNK_STRIDE = 16
export const HEADER = 16
export const LANE_WIDTH = 3.2
export const ROW_OFFSETS = [12, 36] as const
export const ACTION = { left: 1, right: 2, jump: 4, duck: 8, boost: 16 } as const
export const FIELD = { phase: 1, time: 2, travel: 3, score: 4, x: 5, y: 6,
  duck: 7, immunity: 8, stumble: 9, speed: 10, events: 11, hits: 12, charge: 13, boost: 14, biome: 15 } as const
export const EVENT = { coin: 1, hit: 2, over: 4, boost: 8, smash: 16, biome: 32 } as const
export type Phase = 'loading' | 'ready' | 'running' | 'paused' | 'over' | 'error'
export interface WasmRunner {
  reset(seed: number): void
  pause(paused: boolean): void
  advance(dt: number, actions: number, frame: Float32Array): void
  free(): void
}
export interface WasmPackage {
  default(options?: { module_or_path: string }): Promise<unknown>
  Runner: new (seed: number) => WasmRunner
}
