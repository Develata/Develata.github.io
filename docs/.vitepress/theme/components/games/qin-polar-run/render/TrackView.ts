/** Eight Rust slots feed fixed instance pools; no track generation or collision here. */
import * as T from 'three'
import { FIELD as F, CHUNKS, CHUNK_STRIDE, HEADER, ROW_OFFSETS, LANE_WIDTH } from '../config'
import { Palette } from './Palette'
type Batch = { mesh: T.InstancedMesh; count: number }
export class TrackView {
  private batches: Batch[] = []
  private scratch = new T.Object3D()
  private snow: Batch
  private ice: Batch
  private bronze: Batch
  private dark: Batch
  private gold: Batch
  private boulders: Batch
  private caps: Batch
  private coins: Batch
  constructor(scene: T.Scene, p: Palette) {
    const batch = (geometry: T.BufferGeometry, material: T.Material, capacity: number): Batch => {
      const mesh = new T.InstancedMesh(geometry, material, capacity)
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage)
      // Pools contain only the visible longitudinal range. Avoid recomputing spheres.
      mesh.frustumCulled = false; scene.add(mesh)
      const b = { mesh, count: 0 }; this.batches.push(b); return b
    }
    // Upper bounds cover even an artificial all-hazards frame (48 hazards).
    this.snow = batch(p.box, p.snow, 64)
    this.ice = batch(p.box, p.ice, 24)
    this.bronze = batch(p.box, p.bronze, 160)
    this.dark = batch(p.box, p.dark, 144)
    this.gold = batch(p.box, p.gold, 48)
    this.boulders = batch(p.rock, p.ice, 48)
    this.caps = batch(p.rock, p.snow, 48)
    this.coins = batch(p.coin, p.gold, 16)
  }
  private put(batch: Batch, x: number, y: number, z: number, sx: number, sy: number, sz: number, angle = 0) {
    this.scratch.position.set(x, y, z); this.scratch.scale.set(sx, sy, sz)
    this.scratch.rotation.set(0, angle, 0); this.scratch.updateMatrix()
    batch.mesh.setMatrixAt(batch.count++, this.scratch.matrix)
  }
  private obstacle(kind: number, x: number, z: number) {
    if (kind === 1) {
      this.put(this.boulders, x, 1.5, z, 1.25, 2.45, 1.05)
      this.put(this.caps, x - 0.12, 2.7, z, 0.94, 1.02, 0.8)
    } else if (kind === 2) {
      this.put(this.dark, x, 0.46, z, 2.72, 0.92, 0.62)
      this.put(this.gold, x, 0.91, z, 2.8, 0.11, 0.68)
      for (let i = -1; i <= 1; i++) this.put(this.bronze, x + i * 0.95, 0.45, z + 0.33, 0.09, 0.6, 0.035)
    } else if (kind === 3) {
      for (let side = -1; side <= 1; side += 2) {
        this.put(this.dark, x + side * 1.35, 1.78, z, 0.2, 3.56, 0.3)
        this.put(this.bronze, x + side * 1.35, 0.32, z, 0.36, 0.64, 0.45)
      }
      this.put(this.dark, x, 3.09, z, 2.85, 0.74, 0.48)
      this.put(this.gold, x, 2.69, z, 2.87, 0.08, 0.5)
      this.put(this.snow, x, 3.51, z, 3.02, 0.11, 0.65)
    }
  }
  update(frame: Float32Array) {
    const horizon = Math.min(360, Math.max(170, frame[F.speed] * 2.5 + 20))
    for (const batch of this.batches) batch.count = 0
    for (let i = 0; i < CHUNKS; i++) {
      const b = HEADER + i * CHUNK_STRIDE, z = frame[b]
      if (z < horizon) {
        this.put(this.ice, 0, -0.25, -z - 24, 10, 0.45, 48)
        this.put(this.snow, 0, -0.03, -z - 24, 9.6, 0.10, 48)
        for (let side = -1; side <= 1; side += 2) {
          this.put(this.ice, side * 1.6, 0.025, -z - 24, 0.055, 0.025, 48)
          this.put(this.bronze, side * 4.85, 0.025, -z - 24, 0.065, 0.035, 48)
        }
      }
      for (let r = 0; r < 2; r++) {
        const row = b + 1 + r * 5, rowZ = z + ROW_OFFSETS[r]
        if (rowZ > -6 && rowZ < horizon) {
          for (let lane = 0; lane < 3; lane++) this.obstacle(frame[row + lane], (lane - 1) * LANE_WIDTH, -rowZ)
        }
        const coinZ = rowZ - 5
        if (!frame[row + 4] && coinZ > -5 && coinZ < horizon - 5) {
          const attract = frame[F.boost] > 0 && Math.abs(frame[row + 3] - frame[F.x]) < 1.15
            ? Math.max(0, 1 - Math.abs(coinZ) / 6) : 0
          const x = (frame[row + 3] + (frame[F.x] - frame[row + 3]) * attract) * LANE_WIDTH
          this.put(this.coins, x, 1.18, -coinZ, 1, 1, 1, frame[F.time] * 1.4)
        }
      }
    }
    for (const batch of this.batches) {
      batch.mesh.count = batch.count; batch.mesh.instanceMatrix.needsUpdate = true
    }
  }
}
