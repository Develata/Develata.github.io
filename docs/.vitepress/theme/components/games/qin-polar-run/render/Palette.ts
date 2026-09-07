/** Game-owned geometry/material registry. Construct once, share, dispose once. */
import * as T from 'three'
export class Palette {
  readonly box = new T.BoxGeometry(1, 1, 1)
  readonly rock = new T.IcosahedronGeometry(1, 0)
  readonly rounded = new T.IcosahedronGeometry(1, 1)
  readonly cone = new T.ConeGeometry(1, 1, 5)
  readonly cylinder = new T.CylinderGeometry(1, 1, 1, 8)
  readonly coin: T.ExtrudeGeometry
  readonly snow = this.material(0xe1edf0)
  readonly fur = this.material(0xf5f1df)
  readonly ice = this.material(0x789faa)
  readonly dark = this.material(0x172b32)
  readonly stone = this.material(0x435d66)
  readonly bronze = this.material(0xb58745)
  readonly gold = this.material(0xe6be67)
  readonly robe = this.material(0x18242a)
  readonly skin = this.material(0xc9ac8c)
  readonly black = this.material(0x141c23)
  readonly red = this.material(0x793b34)
  constructor() {
    // A round banliang silhouette with a real square hole, no texture download.
    const shape = new T.Shape()
    shape.absarc(0, 0, 0.38, 0, Math.PI * 2, false)
    const hole = new T.Path()
    hole.moveTo(-0.13, -0.13); hole.lineTo(-0.13, 0.13)
    hole.lineTo(0.13, 0.13); hole.lineTo(0.13, -0.13); hole.closePath()
    shape.holes.push(hole)
    this.coin = new T.ExtrudeGeometry(shape, { depth: 0.10, bevelEnabled: false, curveSegments: 12 })
  }
  private material(color: number) { return new T.MeshLambertMaterial({ color, flatShading: true }) }
  mesh(parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material,
    x: number, y: number, z: number, sx = 1, sy = sx, sz = sx): T.Mesh {
    const mesh = new T.Mesh(geometry, material)
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh)
    return mesh
  }
  dispose() {
    for (const geometry of [this.box, this.rock, this.rounded, this.cone, this.cylinder, this.coin]) geometry.dispose()
    for (const material of [this.snow, this.fur, this.ice, this.dark, this.stone, this.bronze,
      this.gold, this.robe, this.skin, this.black, this.red]) material.dispose()
  }
}
