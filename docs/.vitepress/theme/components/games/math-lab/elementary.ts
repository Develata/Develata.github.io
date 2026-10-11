/**
 * @file elementary.ts
 * @description 一维初等元胞自动机。
 */
import type { ExperimentSpec, RuntimeConfig, SimulationRuntime, StatItem } from './types';
import { createRng } from './rng';

class ElementaryRuntime implements SimulationRuntime {
  private cols = 0;
  private rows = 0;
  private row = 0;
  private cell = 6;
  private cellX = 6;
  private cellY = 6;
  private rule = 30;
  private grid = new Uint8Array(0);

  reset(width: number, height: number, config: RuntimeConfig) {
    this.cell = width < 520 ? 5 : 6;
    this.cols = Math.floor(width / this.cell);
    this.rows = Math.floor(height / this.cell);
    this.row = 0;
    this.rule = Math.max(0, Math.min(255, Math.floor(config.values.rule ?? 30)));
    this.grid = new Uint8Array(this.cols * this.rows);
    this.resize(width, height);
    const rng = createRng(config.seed);
    if (config.preset === 'random') {
      for (let x = 0; x < this.cols; x++) this.grid[x] = rng() > 0.5 ? 1 : 0;
    } else {
      this.grid[Math.floor(this.cols / 2)] = 1;
    }
  }

  resize(width: number, height: number) {
    this.cellX = width / Math.max(1, this.cols);
    this.cellY = height / Math.max(1, this.rows);
  }

  step() {
    if (this.row >= this.rows - 1) {
      this.grid.copyWithin(0, this.cols);
      this.grid.fill(0, (this.rows - 1) * this.cols);
      this.row = this.rows - 2;
    }
    const srcRow = this.row;
    const dst = (this.row + 1) * this.cols;
    const src = srcRow * this.cols;
    for (let x = 0; x < this.cols; x++) {
      const left = x > 0 ? this.grid[src + x - 1] : 0;
      const mid = this.grid[src + x];
      const right = x + 1 < this.cols ? this.grid[src + x + 1] : 0;
      const code = (left << 2) | (mid << 1) | right;
      this.grid[dst + x] = (this.rule >> code) & 1;
    }
    this.row++;
    return true;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    for (let y = 0; y < this.rows; y++) {
      const offset = y * this.cols;
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[offset + x]) ctx.rect(x * this.cellX, y * this.cellY, this.cellX - 1, this.cellY - 1);
      }
    }
    ctx.fill();
  }

  stats(): StatItem[] {
    let active = 0;
    const offset = this.row * this.cols;
    for (let x = 0; x < this.cols; x++) active += this.grid[offset + x];
    return [{ label: '规则', value: this.rule }, { label: '末行活跃', value: active }];
  }

  pointerDown(x: number) {
    const col = Math.floor(x / this.cellX);
    if (col >= 0 && col < this.cols) this.grid[col] = this.grid[col] ? 0 : 1;
  }

  pointerMove(x: number) {
    const col = Math.floor(x / this.cellX);
    if (col >= 0 && col < this.cols) this.grid[col] = 1;
  }
}

export const elementarySpec: ExperimentSpec = {
  title: '一维元胞自动机',
  subtitle: '固定局部规则后，一行初态决定整张时空图。',
  presets: [
    { id: 'single', label: '中心单点' },
    { id: 'random', label: '随机第一行' },
  ],
  controls: [{ id: 'rule', label: '规则号', min: 0, max: 255, step: 1, value: 30 }],
  canvasHeight: 360,
  create: () => new ElementaryRuntime(),
};
