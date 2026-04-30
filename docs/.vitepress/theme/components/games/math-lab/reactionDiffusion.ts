/**
 * @file reactionDiffusion.ts
 * @description Gray-Scott 反应扩散模型。
 */
import type { ExperimentSpec, RuntimeConfig, SimulationRuntime, StatItem } from './types';
import { createRng } from './rng';

class ReactionDiffusionRuntime implements SimulationRuntime {
  private n = 120;
  private u = new Float32Array(0);
  private v = new Float32Array(0);
  private u2 = new Float32Array(0);
  private v2 = new Float32Array(0);
  private feed = 0.037;
  private kill = 0.06;
  private image: ImageData | null = null;
  private buffer: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;

  reset(width: number, height: number, config: RuntimeConfig) {
    this.n = Math.max(72, Math.min(150, Math.floor(Math.min(width, height) / 3)));
    const size = this.n * this.n;
    this.u = new Float32Array(size);
    this.v = new Float32Array(size);
    this.u2 = new Float32Array(size);
    this.v2 = new Float32Array(size);
    this.u.fill(1);
    this.feed = config.values.feed ?? 0.037;
    this.kill = config.values.kill ?? 0.06;
    this.image = null;
    this.buffer = null;
    this.bufferCtx = null;
    const rng = createRng(config.seed);
    const r = Math.floor(this.n * 0.08);
    const c = Math.floor(this.n / 2);
    for (let y = c - r; y <= c + r; y++) {
      for (let x = c - r; x <= c + r; x++) this.setPatch(x, y, 0.5, 0.25);
    }
    if (config.preset === 'noise') {
      for (let k = 0; k < size / 12; k++) this.setPatch(Math.floor(rng() * this.n), Math.floor(rng() * this.n), 0.5, rng());
    }
  }

  step() {
    const du = 0.16;
    const dv = 0.08;
    for (let y = 0; y < this.n; y++) {
      for (let x = 0; x < this.n; x++) {
        const i = y * this.n + x;
        const u = this.u[i];
        const v = this.v[i];
        const uvv = u * v * v;
        const nextU = u + du * this.lap(this.u, x, y) - uvv + this.feed * (1 - u);
        const nextV = v + dv * this.lap(this.v, x, y) + uvv - (this.feed + this.kill) * v;
        this.u2[i] = Math.max(0, Math.min(1, nextU));
        this.v2[i] = Math.max(0, Math.min(1, nextV));
      }
    }
    [this.u, this.u2] = [this.u2, this.u];
    [this.v, this.v2] = [this.v2, this.v];
    return true;
  }

  private setPatch(x: number, y: number, u: number, v: number) {
    if (x < 1 || x >= this.n - 1 || y < 1 || y >= this.n - 1) return;
    const i = y * this.n + x;
    this.u[i] = u;
    this.v[i] = v;
  }

  private lap(a: Float32Array, x: number, y: number) {
    const n = this.n;
    const at = (xx: number, yy: number) => a[((yy + n) % n) * n + ((xx + n) % n)];
    return -a[y * n + x] + 0.2 * (at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1))
      + 0.05 * (at(x - 1, y - 1) + at(x + 1, y - 1) + at(x - 1, y + 1) + at(x + 1, y + 1));
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.image || this.image.width !== this.n) this.image = ctx.createImageData(this.n, this.n);
    if (!this.buffer) {
      this.buffer = document.createElement('canvas');
      this.buffer.width = this.n;
      this.buffer.height = this.n;
      this.bufferCtx = this.buffer.getContext('2d');
    }
    const data = this.image.data;
    for (let i = 0; i < this.v.length; i++) {
      const c = Math.floor(Math.max(0, Math.min(255, 255 - this.v[i] * 620)));
      data[i * 4] = c;
      data[i * 4 + 1] = Math.min(255, c + 60);
      data[i * 4 + 2] = 255 - c;
      data[i * 4 + 3] = 255;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    const side = Math.min(width, height);
    this.bufferCtx?.putImageData(this.image, 0, 0);
    if (this.buffer) ctx.drawImage(this.buffer, (width - side) / 2, 0, side, side);
  }

  stats(): StatItem[] {
    let mass = 0;
    for (const value of this.v) mass += value;
    return [{ label: 'V均值', value: (mass / this.v.length).toFixed(3) }];
  }
}

export const reactionDiffusionSpec: ExperimentSpec = {
  title: 'Gray-Scott 反应扩散',
  subtitle: '两个浓度场在扩散与反应之间形成斑点、条纹和迷宫。',
  presets: [
    { id: 'center', label: '中心扰动' },
    { id: 'noise', label: '随机噪声' },
  ],
  controls: [
    { id: 'feed', label: '馈入率', min: 0.01, max: 0.08, step: 0.001, value: 0.037 },
    { id: 'kill', label: '杀灭率', min: 0.03, max: 0.08, step: 0.001, value: 0.06 },
  ],
  canvasHeight: 360,
  randomPreset: 'noise',
  stepsPerFrame: 2,
  create: () => new ReactionDiffusionRuntime(),
};
