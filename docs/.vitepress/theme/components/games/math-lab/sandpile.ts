/**
 * @file sandpile.ts
 * @description 阿贝尔沙堆模型。
 */
import type { ExperimentSpec, RuntimeConfig, SimulationRuntime, StatItem } from './types';
import { createRng } from './rng';

class SandpileRuntime implements SimulationRuntime {
  private n = 80;
  private cell = 4;
  private ox = 0;
  private threshold = 4;
  private grid = new Uint16Array(0);
  private queue: number[] = [];

  reset(width: number, height: number, config: RuntimeConfig) {
    this.n = Math.max(48, Math.min(110, Math.floor(Math.min(width, height) / 5)));
    this.resize(width, height);
    this.threshold = Math.max(2, Math.floor(config.values.threshold ?? 4));
    this.grid = new Uint16Array(this.n * this.n);
    this.queue = [];
    const center = Math.floor(this.n / 2) * this.n + Math.floor(this.n / 2);
    const rng = createRng(config.seed);
    if (config.preset === 'random') {
      for (let i = 0; i < this.grid.length; i++) this.grid[i] = Math.floor(rng() * this.threshold);
    } else if (config.preset === 'center') {
      this.grid[center] = Math.floor(config.values.grains ?? 3200);
      this.queue.push(center);
    }
  }

  resize(width: number, height: number) {
    this.cell = Math.min(width, height) / this.n;
    this.ox = (width - this.n * this.cell) / 2;
  }

  step() {
    if (this.queue.length === 0) this.seedActive();
    const limit = 1800;
    for (let k = 0; k < limit && this.queue.length > 0; k++) {
      const i = this.queue.pop() ?? 0;
      if (this.grid[i] < this.threshold) continue;
      this.grid[i] -= this.threshold;
      const x = i % this.n;
      const y = Math.floor(i / this.n);
      this.add(x - 1, y); this.add(x + 1, y); this.add(x, y - 1); this.add(x, y + 1);
      if (this.grid[i] >= this.threshold) this.queue.push(i);
    }
  }

  private add(x: number, y: number) {
    if (x < 0 || x >= this.n || y < 0 || y >= this.n) return;
    const i = y * this.n + x;
    this.grid[i]++;
    if (this.grid[i] >= this.threshold) this.queue.push(i);
  }

  private seedActive() {
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] >= this.threshold) this.queue.push(i);
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    const colors = ['#111827', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#f8fafc'];
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        const h = this.grid[y * this.n + x];
        if (h === 0) continue;
        ctx.fillStyle = colors[Math.min(h, colors.length - 1)];
        ctx.fillRect(this.ox + x * this.cell, y * this.cell, this.cell + 0.3, this.cell + 0.3);
      }
    }
  }

  stats(): StatItem[] {
    let total = 0;
    let active = 0;
    for (const h of this.grid) {
      total += h;
      if (h >= this.threshold) active++;
    }
    return [{ label: '总沙量', value: total }, { label: '活跃', value: active }];
  }

  pointerDown(x: number, y: number) {
    const col = Math.floor((x - this.ox) / this.cell);
    const row = Math.floor(y / this.cell);
    if (col < 0 || col >= this.n || row < 0 || row >= this.n) return;
    const i = row * this.n + col;
    this.grid[i] += 256;
    if (this.grid[i] >= this.threshold) this.queue.push(i);
  }
}

export const sandpileSpec: ExperimentSpec = {
  title: '阿贝尔沙堆模型',
  subtitle: '局部坍塌与守恒律产生自组织临界图案。',
  presets: [
    { id: 'center', label: '中心沙堆' },
    { id: 'random', label: '随机稳定态' },
    { id: 'empty', label: '空网格' },
  ],
  controls: [
    { id: 'threshold', label: '阈值', min: 3, max: 8, step: 1, value: 4 },
    { id: 'grains', label: '中心沙量', min: 100, max: 12000, step: 100, value: 3200 },
  ],
  canvasHeight: 360,
  create: () => new SandpileRuntime(),
};
