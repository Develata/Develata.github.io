/** Procedural polar bear and Qin-inspired rider; transforms are visual only. */
import * as T from 'three'
import { FIELD as F, LANE_WIDTH } from '../config'
import { Palette } from './Palette'
export class CharacterView {
  readonly root = new T.Group()
  private bear = new T.Group()
  private rider = new T.Group()
  private legs: T.Group[] = []
  private stride = 0
  private shadow: T.Mesh
  private shadowMaterial = new T.MeshBasicMaterial({ color: 0x1c3a46, transparent: true, opacity: 0.24, depthWrite: false })
  private shadowGeometry = new T.CircleGeometry(1, 24)
  constructor(scene: T.Scene, p: Palette) {
    scene.add(this.root); this.root.add(this.bear, this.rider)
    const m = p.mesh.bind(p)
    m(this.bear, p.rounded, p.fur, 0, 1.24, 0, 0.82, 0.79, 1.4)
    m(this.bear, p.rounded, p.fur, 0, 1.42, -1.04, 0.83, 0.78, 0.86)
    m(this.bear, p.rounded, p.fur, 0, 1.68, -1.63, 0.57, 0.55, 0.7)
    m(this.bear, p.rounded, p.snow, 0, 1.49, -2.13, 0.37, 0.27, 0.51)
    m(this.bear, p.rounded, p.black, 0, 1.55, -2.53, 0.24, 0.16, 0.13)
    for (const side of [-1, 1]) {
      m(this.bear, p.rounded, p.fur, side * 0.4, 2.08, -1.52, 0.19, 0.22, 0.17)
      m(this.bear, p.rounded, p.dark, side * 0.48, 1.81, -1.93, 0.045, 0.055, 0.07)
      for (const z of [-0.91, 0.92]) {
        const leg = new T.Group(); leg.position.set(side * 0.59, 1.05, z); this.bear.add(leg)
        m(leg, p.rounded, p.fur, 0, -0.35, 0, 0.30, 0.57, 0.37)
        m(leg, p.rounded, p.fur, 0, -0.83, -0.13, 0.32, 0.21, 0.45)
        this.legs.push(leg)
      }
    }
    m(this.bear, p.rounded, p.fur, 0, 1.35, 1.39, 0.22, 0.22, 0.31)
    // Broad saddle and long dark robe; seated legs straddle the bear.
    m(this.rider, p.box, p.bronze, 0, 1.91, 0.15, 1.15, 0.14, 1.25)
    m(this.rider, p.cone, p.robe, 0, 2.32, 0.11, 0.74, 1.24, 0.63)
    m(this.rider, p.box, p.gold, 0, 2.51, -0.10, 0.69, 0.10, 0.49)
    m(this.rider, p.box, p.robe, 0, 2.95, 0.1, 0.76, 0.82, 0.52)
    m(this.rider, p.box, p.gold, 0, 2.97, -0.175, 0.055, 0.72, 0.028)
    for (const side of [-1, 1]) {
      m(this.rider, p.box, p.robe, side * 0.69, 1.71, 0.17, 0.36, 0.74, 0.69)
      const arm = m(this.rider, p.box, p.robe, side * 0.47, 2.76, -0.13, 0.31, 0.63, 0.39)
      arm.rotation.x = -0.45
      m(this.rider, p.rounded, p.skin, side * 0.43, 2.5, -0.43, 0.13, 0.14, 0.15)
      m(this.rider, p.box, p.bronze, side * 0.44, 2.08, -0.69, 0.032, 0.035, 1.33).rotation.x = -0.45
    }
    m(this.rider, p.box, p.skin, 0, 3.63, 0.06, 0.44, 0.54, 0.43)
    m(this.rider, p.box, p.black, 0, 3.66, 0.24, 0.47, 0.53, 0.14)
    m(this.rider, p.cone, p.black, 0, 3.3, -0.17, 0.18, 0.4, 0.12).rotation.z = Math.PI
    m(this.rider, p.box, p.gold, 0, 3.94, 0.06, 0.49, 0.09, 0.47)
    m(this.rider, p.box, p.black, 0, 4.08, 0.03, 0.58, 0.22, 0.49)
    m(this.rider, p.box, p.black, 0, 4.23, 0.01, 0.87, 0.10, 0.87)
    m(this.rider, p.box, p.gold, 0, 4.20, -0.43, 0.88, 0.04, 0.025)
    for (let i = -2; i <= 2; i++) {
      for (const z of [-0.41, 0.41]) {
        m(this.rider, p.box, p.bronze, i * 0.16, 4.02, z, 0.018, 0.38, 0.018)
        m(this.rider, p.rounded, p.gold, i * 0.16, 3.83, z, 0.038)
      }
    }
    this.shadow = new T.Mesh(this.shadowGeometry, this.shadowMaterial)
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.scale.set(1.1, 1.9, 1)
    this.shadow.position.y = 0.025; scene.add(this.shadow)
  }
  update(frame: Float32Array, reduced: boolean, dt = 0) {
    const time = frame[F.time], running = frame[F.phase] === 1
    if (time === 0) this.stride = 0
    if (running) this.stride = (this.stride + dt * Math.min(22, 7 + frame[F.speed] * 0.2)) % (Math.PI * 2)
    const pace = this.stride
    const lean = Math.min(0.12, Math.max(0, frame[F.speed] - 12) * 0.003) + (frame[F.boost] > 0 ? 0.07 : 0)
    const crouch = frame[F.duck]
    const bob = running && !reduced ? Math.sin(pace * 2) * 0.07 : 0
    this.root.position.set(frame[F.x] * LANE_WIDTH, frame[F.y], 0)
    this.root.rotation.y = frame[F.phase] === 0 ? -1.15 : 0
    this.bear.position.y = bob - crouch * 0.35
    this.bear.scale.y = 1 - crouch * 0.2
    this.rider.position.y = bob - crouch * 1.25
    this.rider.rotation.x = -crouch * 0.5 - lean + (reduced ? 0 : Math.sin(pace) * 0.012)
    this.root.rotation.z = reduced ? 0 : Math.sin(time * 36) * frame[F.stumble] * 0.05
    this.root.visible = reduced || frame[F.boost] > 0 || frame[F.immunity] === 0 || Math.floor(time * 12) % 3 !== 0
    for (let i = 0; i < this.legs.length; i++) {
      this.legs[i].rotation.x = running ? Math.sin(pace + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.42 : 0
    }
    this.shadow.position.x = this.root.position.x
    this.shadowMaterial.opacity = 0.24 / (1 + frame[F.y] * 0.3)
  }
  dispose() { this.shadowGeometry.dispose(); this.shadowMaterial.dispose() }
}
