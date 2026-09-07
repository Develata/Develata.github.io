/** Repeated scenery is instanced and loops over a finite 384m strip. */
import * as T from 'three'
import { Palette } from './Palette'
export class EnvironmentView {
  private scroll = new T.Group()
  private scratch = new T.Object3D()
  constructor(scene: T.Scene, p: Palette) {
    scene.add(this.scroll)
    p.mesh(scene, p.box, p.snow, 0, -0.68, -125, 900, 0.4, 1000)
    const batches = new Map<string, { geometry: T.BufferGeometry; material: T.Material; transforms: number[][] }>()
    const add = (key: string, geometry: T.BufferGeometry, material: T.Material,
      x: number, y: number, z: number, sx: number, sy: number, sz: number, rotation = 0) => {
      if (!batches.has(key)) batches.set(key, { geometry, material, transforms: [] })
      batches.get(key)!.transforms.push([x,y,z,sx,sy,sz,rotation])
    }
    for (let i = 0; i < 16; i++) {
      const z = -i * 24 + 12
      for (const side of [-1, 1]) {
        add('wall',p.box,p.stone,side*7.0,0.9,z,1.4,2.4,24)
        add('snow',p.box,p.snow,side*7.0,2.12,z,1.52,0.17,24)
        for (let j = 0; j < 6; j++) {
          add('wall',p.box,p.stone,side*7.0,2.5,z-j*4+10,1.4,0.8,1.4)
          add('snow',p.box,p.snow,side*7.0,2.93,z-j*4+10,1.5,0.09,1.5)
        }
        if (i % 2 === 0) {
          add('tower',p.box,p.dark,side*10,3.15,z,5.2,6.3,5.0)
          add('roof',p.cone,p.dark,side*10,7.0,z,4.4,2.2,4.4,Math.PI/4)
          add('roofSnow',p.cone,p.snow,side*10,7.55,z,2.75,1.27,2.75,Math.PI/4)
          add('gold',p.box,p.bronze,side*10,5.6,z+2.53,3.7,0.19,0.08)
          add('window',p.box,p.black,side*10,4.1,z+2.55,0.8,1.4,0.07)
        }
        add('pole',p.box,p.bronze,side*5.8,3.0,z+8,0.095,6,0.095)
        add('flag',p.box,p.dark,side*5.8+side*0.7,4.8,z+8,1.3,1.95,0.065)
        add('flagGold',p.box,p.bronze,side*5.8+side*0.7,4.8,z+8.04,0.11,1.25,0.02)
        // Terracotta sentries beyond the wall, never mistaken for lane hazards.
        add('sentry',p.cone,p.stone,side*8.7,1.45,z-8,0.5,2.6,0.4)
        add('sentryHead',p.box,p.stone,side*8.7,2.98,z-8,0.5,0.56,0.46)
        add('sentrySpear',p.box,p.bronze,side*9.4,2.05,z-8,0.06,4.1,0.06)
      }
    }
    for (const { geometry, material, transforms } of batches.values()) {
      const mesh = new T.InstancedMesh(geometry, material, transforms.length)
      transforms.forEach((t,i) => {
        this.scratch.position.set(t[0],t[1],t[2]); this.scratch.scale.set(t[3],t[4],t[5])
        this.scratch.rotation.set(0,t[6],0); this.scratch.updateMatrix(); mesh.setMatrixAt(i,this.scratch.matrix)
      })
      mesh.computeBoundingSphere(); this.scroll.add(mesh)
    }
    // Fixed faceted mountain backdrop. Formulaic variation is decorative, not RNG.
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? -1 : 1, z = -35 - Math.floor(i/2)*34
      const height = 25 + (i*13 % 25)
      p.mesh(scene,p.cone,i%3===0?p.ice:p.snow,side*(42+i%3*14),height/2-1,z,20+i%4*5,height,24)
    }
    const sunMaterial = new T.MeshBasicMaterial({ color: 0xf4dfb1, fog: false })
    this.sunMaterial = sunMaterial
    p.mesh(scene,p.rounded,sunMaterial,-80,90,-330,15)
  }
  private sunMaterial: T.Material
  update(travel: number) { this.scroll.position.z = travel % 48 }
  dispose() { this.sunMaterial.dispose() }
}
