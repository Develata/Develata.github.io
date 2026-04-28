/**
 * @file ising.ts
 * @description 二维 Ising 模型的 Metropolis 动力学。
 */
import type { ExperimentSpec, RuntimeConfig, SimulationRuntime, StatItem } from './types';
import { createRng } from './rng';

class IsingRuntime implements SimulationRuntime {
  private n = 80;
  private cell = 4;
  private ox = 0;
  private spins = new Int8Array(0);
  private rng = createRng(1);
  private temp = 2.27;
  private field = 0;

  reset(width: number, height: number, config: RuntimeConfig) {
    this.n = Math.max(36, Math.min(100, Math.floor(config.values.size ?? 72)));
    this.resize(width, height);
    this.spins = new Int8Array(this.n * this.n);
    this.rng = createRng(config.seed);
    this.temp = Math.max(0.05, config.values.temperature ?? 2.27);
    this.field = config.values.field ?? 0;
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        const i = y * this.n + x;
        if (config.preset === 'up') this.spins[i] = 1;
        else if (config.preset === 'checker') this.spins[i] = (x + y) % 2 === 0 ? 1 : -1;
        else this.spins[i] = this.rng() > 0.5 ? 1 : -1;
      }
    }
  }

  resize(width: number, height: number) {
    this.cell = Math.min(width, height) / this.n;
    this.ox = (width - this.n * this.cell) / 2;
  }

  step() {
    const attempts = this.n * this.n;
    for (let k = 0; k < attempts; k++) {
      const x = Math.floor(this.rng() * this.n);
      const y = Math.floor(this.rng() * this.n);
      const i = y * this.n + x;
      const s = this.spins[i];
      const sum = this.at(x - 1, y) + this.at(x + 1, y) + this.at(x, y - 1) + this.at(x, y + 1);
      const delta = 2 * s * (sum + this.field);
      if (delta <= 0 || this.rng() < Math.exp(-delta / this.temp)) this.spins[i] = -s;
    }
  }

  private at(x: number, y: number) {
    const xx = (x + this.n) % this.n;
    const yy = (y + this.n) % this.n;
    return this.spins[yy * this.n + xx];
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        ctx.fillStyle = this.spins[y * this.n + x] > 0 ? '#f8fafc' : '#334155';
        ctx.fillRect(this.ox + x * this.cell, y * this.cell, this.cell + 0.2, this.cell + 0.2);
      }
    }
  }

  stats(): StatItem[] {
    let m = 0;
    let e = 0;
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        const s = this.at(x, y);
        m += s;
        e -= s * (this.at(x + 1, y) + this.at(x, y + 1));
        e -= this.field * s;
      }
    }
    const scale = this.n * this.n;
    return [{ label: '磁化', value: (m / scale).toFixed(2) }, { label: '能量', value: (e / scale).toFixed(2) }];
  }

  pointerDown(x: number, y: number) {
    const col = Math.floor((x - this.ox) / this.cell);
    const row = Math.floor(y / this.cell);
    if (col < 0 || col >= this.n || row < 0 || row >= this.n) return;
    const i = row * this.n + col;
    this.spins[i] = -this.spins[i];
  }
}

export const isingSpec: ExperimentSpec = {
  title: 'Ising 模型',
  subtitle: '固定温度下的随机自旋翻转，展示有序与无序的竞争。',
  presets: [
    { id: 'random', label: '随机自旋' },
    { id: 'up', label: '全上自旋' },
    { id: 'checker', label: '棋盘初态' },
  ],
  controls: [
    { id: 'temperature', label: '温度', min: 0.2, max: 5, step: 0.05, value: 2.27 },
    { id: 'field', label: '外场', min: -1, max: 1, step: 0.05, value: 0 },
    { id: 'size', label: '规模', min: 36, max: 100, step: 4, value: 72 },
  ],
  canvasHeight: 360,
  create: () => new IsingRuntime(),
};
