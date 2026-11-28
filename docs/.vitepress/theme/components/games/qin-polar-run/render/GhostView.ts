/** Translucent projection of the real competitor pose, never a gameplay authority.
 * Reuses character geometry; owns its tinted material clones and one tiny marker.
 */
import * as T from 'three'
import { FIELD as F, GHOST as G, FRAME_LENGTH } from '../config'
import { CharacterView } from './CharacterView'
import type { Palette } from './Palette'
export class GhostView {
  private character: CharacterView
  private pose = new Float32Array(FRAME_LENGTH)
  private materials = new Map<T.Material, T.MeshLambertMaterial>()
  private markerGeometry = new T.RingGeometry(1.1, 1.18, 24)
  private markerMaterial = new T.MeshBasicMaterial({ color: 0x70efff, transparent: true,
    opacity: 0.65, depthWrite: false, side: T.DoubleSide })
  private marker = new T.Mesh(this.markerGeometry, this.markerMaterial)
  private visible = false
  private batches: { mesh: T.InstancedMesh; parts: T.Mesh[] }[] = []
  constructor(scene: T.Scene, palette: Palette) {
    this.character = new CharacterView(scene, palette)
    // Animate the same model off-scene, then batch its parts by geometry/material.
    // This keeps the full silhouette without adding a draw call for every bead.
    this.character.root.removeFromParent()
    const groups = new Map<T.BufferGeometry, Map<T.Material, T.Mesh[]>>()
    this.character.root.traverse(object => {
      if (!(object instanceof T.Mesh)) return
      const source = object.material as T.MeshLambertMaterial
      let material = this.materials.get(source)
      if (!material) {
        material = source.clone()
        material.color.lerp(new T.Color(0x5cd9ef), 0.65)
        material.emissive.set(0x174650)
        material.transparent = true; material.opacity = 0.32; material.depthWrite = false
        this.materials.set(source, material)
      }
      let group = groups.get(object.geometry)
      if (!group) { group = new Map(); groups.set(object.geometry, group) }
      const parts = group.get(material) ?? []
      parts.push(object); group.set(material, parts)
    })
    for (const [geometry, group] of groups) {
      for (const [material, parts] of group) {
        const mesh = new T.InstancedMesh(geometry, material, parts.length)
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.frustumCulled = false
        this.batches.push({ mesh, parts }); scene.add(mesh)
      }
    }
    this.marker.rotation.x = -Math.PI / 2; scene.add(this.marker)
  }
  update(frame: Float32Array, reduced: boolean, dt: number, enabled: boolean) {
    const pose = this.pose, lead = frame[G.lead]
    pose[F.phase] = frame[F.phase] === 1 ? frame[G.phase] : frame[F.phase]
    pose[F.time] = frame[G.time]; pose[F.x] = frame[G.x]; pose[F.y] = frame[G.y]
    pose[F.duck] = frame[G.duck]; pose[F.speed] = frame[G.speed]
    pose[F.immunity] = frame[G.immunity]; pose[F.stumble] = frame[G.stumble]
    this.character.update(pose, reduced, dt, -lead)
    // Far/behind competitors get a HUD direction instead of a false clamped pose.
    this.visible = enabled && frame[F.phase] !== 0 && lead >= -8 && lead <= 100
    if (this.visible) this.character.root.updateMatrixWorld(true)
    for (const { mesh, parts } of this.batches) {
      mesh.visible = this.visible
      if (!this.visible) continue
      for (let i = 0; i < parts.length; i++) mesh.setMatrixAt(i, parts[i].matrixWorld)
      mesh.instanceMatrix.needsUpdate = true
    }
    this.character.shadow.visible = false
    this.marker.visible = this.visible
    this.marker.position.set(this.character.root.position.x, 0.045, -lead)
  }
  diagnostics() { return { visible: this.visible, z: this.character.root.position.z } }
  dispose() {
    this.character.dispose()
    for (const material of this.materials.values()) material.dispose()
    this.markerGeometry.dispose(); this.markerMaterial.dispose()
  }
}
