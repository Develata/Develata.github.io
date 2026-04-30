/**
 * @file percolation.ts
 * @description 二维方格 site percolation。
 */
import type { ExperimentSpec, RuntimeConfig, SimulationRuntime, StatItem } from './types';
import { createRng } from './rng';

class PercolationRuntime implements SimulationRuntime {
  private n = 64;
  private cell = 5;
  private ox = 0;
  private grid = new Uint8Array(0);
  private queue: number[] = [];
  private percolates = false;

  reset(width: number, height: number, config: RuntimeConfig) {
    this.n = Math.max(24, Math.min(120, Math.floor(config.values.size ?? 64)));
    this.resize(width, height);
    this.grid = new Uint8Array(this.n * this.n);
    this.queue = [];
    this.percolates = false;
    const p = Math.max(0, Math.min(1, config.values.p ?? 0.59));
    const rng = createRng(config.seed);
    for (let i = 0; i < this.grid.length; i++) this.grid[i] = rng() < p ? 1 : 0;
    for (let x = 0; x < this.n; x++) {
      if (this.grid[x] === 1) {
        this.grid[x] = 2;
        this.queue.push(x);
      }
    }
  }

  resize(width: number, height: number) {
    this.cell = Math.min(width, height) / this.n;
    this.ox = (width - this.n * this.cell) / 2;
  }

  step() {
    const limit = 900;
    for (let k = 0; k < limit && this.queue.length > 0; k++) {
      const i = this.queue.shift() ?? 0;
      if (this.grid[i] !== 2) continue;
      const x = i % this.n;
      const y = Math.floor(i / this.n);
      if (y === this.n - 1) this.percolates = true;
      this.flow(x - 1, y); this.flow(x + 1, y); this.flow(x, y - 1); this.flow(x, y + 1);
    }
  }

  private flow(x: number, y: number) {
    if (x < 0 || x >= this.n || y < 0 || y >= this.n) return;
    const i = y * this.n + x;
    if (this.grid[i] !== 1) return;
    this.grid[i] = 2;
    if (y === this.n - 1) this.percolates = true;
    this.queue.push(i);
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        const v = this.grid[y * this.n + x];
        if (v === 0) continue;
        ctx.fillStyle = v === 2 ? '#38bdf8' : '#e5e7eb';
        ctx.fillRect(this.ox + x * this.cell, y * this.cell, this.cell + 0.2, this.cell + 0.2);
      }
    }
  }

  stats(): StatItem[] {
    let wet = 0;
    let open = 0;
    for (const v of this.grid) {
      if (v > 0) open++;
      if (v === 2) wet++;
    }
    return [{ label: '开放', value: open }, { label: '湿润', value: wet }, { label: '贯通', value: this.percolates ? '是' : '否' }];
  }

  pointerDown(x: number, y: number) {
    const col = Math.floor((x - this.ox) / this.cell);
    const row = Math.floor(y / this.cell);
    if (col < 0 || col >= this.n || row < 0 || row >= this.n) return;
    const i = row * this.n + col;
    if (this.grid[i] === 0) {
      this.grid[i] = row === 0 ? 2 : 1;
      if (row === 0) this.queue.push(i);
    } else {
      this.grid[i] = 0;
    }
  }
}

export const percolationSpec: ExperimentSpec = {
  title: '渗流模型',
  subtitle: '随机开放格点中，观察连通簇是否穿越边界。',
  presets: [{ id: 'random', label: '随机开放' }],
  controls: [
    { id: 'p', label: '开放概率', min: 0, max: 1, step: 0.01, value: 0.59 },
    { id: 'size', label: '规模', min: 24, max: 120, step: 4, value: 64 },
  ],
  canvasHeight: 360,
  create: () => new PercolationRuntime(),
};
