/**
 * @file langton.ts
 * @description Langton 蚂蚁确定性自动机。
 */
import type { ExperimentSpec, RuntimeConfig, SimulationRuntime, StatItem } from './types';
import { createRng } from './rng';

class LangtonRuntime implements SimulationRuntime {
  private n = 96;
  private cell = 4;
  private ox = 0;
  private grid = new Uint8Array(0);
  private x = 0;
  private y = 0;
  private dir = 0;
  private black = 0;

  reset(width: number, height: number, config: RuntimeConfig) {
    this.n = Math.max(48, Math.min(128, Math.floor(Math.min(width, height) / 4)));
    this.resize(width, height);
    this.grid = new Uint8Array(this.n * this.n);
    this.x = Math.floor(this.n / 2);
    this.y = Math.floor(this.n / 2);
    this.dir = Math.floor(config.values.direction ?? 0) & 3;
    this.black = 0;
    const rng = createRng(config.seed);
    if (config.preset === 'random') {
      for (let i = 0; i < this.grid.length; i++) {
        this.grid[i] = rng() > 0.82 ? 1 : 0;
        this.black += this.grid[i];
      }
    }
  }

  resize(width: number, height: number) {
    this.cell = Math.min(width, height) / this.n;
    this.ox = (width - this.n * this.cell) / 2;
  }

  step() {
    const i = this.y * this.n + this.x;
    if (this.grid[i] === 0) {
      this.dir = (this.dir + 1) & 3;
      this.grid[i] = 1;
      this.black++;
    } else {
      this.dir = (this.dir + 3) & 3;
      this.grid[i] = 0;
      this.black--;
    }
    if (this.dir === 0) this.y = (this.y - 1 + this.n) % this.n;
    if (this.dir === 1) this.x = (this.x + 1) % this.n;
    if (this.dir === 2) this.y = (this.y + 1) % this.n;
    if (this.dir === 3) this.x = (this.x - 1 + this.n) % this.n;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#111827';
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        if (this.grid[y * this.n + x]) ctx.fillRect(this.ox + x * this.cell, y * this.cell, this.cell + 0.2, this.cell + 0.2);
      }
    }
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(this.ox + (this.x + 0.5) * this.cell, (this.y + 0.5) * this.cell, Math.max(3, this.cell * 1.6), 0, Math.PI * 2);
    ctx.fill();
  }

  stats(): StatItem[] {
    return [{ label: '黑格', value: this.black }, { label: '位置', value: `${this.x},${this.y}` }];
  }

  pointerDown(x: number, y: number) {
    const col = Math.floor((x - this.ox) / this.cell);
    const row = Math.floor(y / this.cell);
    if (col < 0 || col >= this.n || row < 0 || row >= this.n) return;
    const i = row * this.n + col;
    this.black += this.grid[i] ? -1 : 1;
    this.grid[i] = this.grid[i] ? 0 : 1;
  }
}

export const langtonSpec: ExperimentSpec = {
  title: 'Langton 蚂蚁',
  subtitle: '极小确定性规则在长时间后形成高速公路结构。',
  presets: [
    { id: 'empty', label: '空白棋盘' },
    { id: 'random', label: '随机棋盘' },
  ],
  controls: [{ id: 'direction', label: '初始方向', min: 0, max: 3, step: 1, value: 0 }],
  canvasHeight: 360,
  stepsPerFrame: 24,
  create: () => new LangtonRuntime(),
};
