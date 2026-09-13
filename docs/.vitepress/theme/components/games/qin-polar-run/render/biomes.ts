/** Three prepared, game-local scenery strips. Decorations never enter the lanes. */
import * as T from 'three'
import { Palette } from './Palette'

export function buildBiome(id: number, p: Palette): T.Group {
  const group = new T.Group()
  const batches = new Map<string, { geometry: T.BufferGeometry; material: T.Material; transforms: number[][] }>()
  const add = (key: string, geometry: T.BufferGeometry, material: T.Material,
    x: number, y: number, z: number, sx: number, sy: number, sz: number, rotation = 0) => {
    if (!batches.has(key)) batches.set(key, { geometry, material, transforms: [] })
    batches.get(key)!.transforms.push([x,y,z,sx,sy,sz,rotation])
  }
  const box = (key: string, material: T.Material, x: number,y: number,z: number,sx: number,sy: number,sz: number) =>
    add(key,p.box,material,x,y,z,sx,sy,sz)
  for (let i = 0; i < 16; i++) {
    const z = -i * 24 + 12
    for (const side of [-1,1]) {
      if (id === 0) {
        // Open imperial road: sparse markers, broad plains, no enclosing walls.
        box('markers',p.stone,side*6.6,0.75,z,0.6,1.5,0.8)
        box('markerGold',p.bronze,side*6.6,1.55,z,0.7,0.15,0.9)
        if (i % 2 === 0) {
          box('poles',p.bronze,side*8,2.9,z,0.08,5.8,0.08)
          box('banners',p.dark,side*8+side*0.7,4.6,z,1.3,1.8,0.07)
          box('bannerGold',p.gold,side*8+side*0.7,4.6,z+0.04,0.12,1.0,0.02)
          box('wallRemains',p.stone,side*18,0.8,z,1.6,1.6,7)
        }
        add('drifts',p.rock,p.snow,side*(14+i%3*3),0.3,z+8,3,1.5,4)
      } else if (id === 1) {
        // Fortified pass: identical gameplay width, a stronger vertical silhouette.
        box('wall',p.stone,side*6.7,1.2,z,1.4,3,24)
        box('snow',p.snow,side*6.7,2.76,z,1.55,0.15,24)
        for (let j=0;j<6;j++) {
          box('wall',p.stone,side*6.7,3.05,z-j*4+10,1.4,0.8,1.5)
          box('snow',p.snow,side*6.7,3.5,z-j*4+10,1.5,0.1,1.6)
        }
        if (i%2===0) {
          box('tower',p.dark,side*9.5,4,z,4.5,8,5)
          add('roof',p.cone,p.dark,side*9.5,8.7,z,3.9,2.2,4.4,Math.PI/4)
          add('roofSnow',p.cone,p.snow,side*9.5,9.25,z,2.4,1.2,2.75,Math.PI/4)
          box('window',p.black,side*9.5,5.1,z+2.52,0.9,1.6,0.07)
          box('towerGold',p.bronze,side*9.5,7.3,z+2.54,3.5,0.2,0.07)
          box('gatePillar',p.dark,side*5.8,4.2,z+5,0.7,8.4,0.8)
        }
        box('poles',p.bronze,side*5.8,3.4,z+8,0.08,6.8,0.08)
        box('banners',p.dark,side*5.8+side*0.5,5.6,z+8,0.9,1.7,0.07)
      } else {
        // Mausoleum avenue: terracotta ranks stand OUTSIDE the ±4.8m road.
        for (let rank=0;rank<3;rank++) {
          const x=side*(8.3+rank*2.1), rz=z-rank*2
          add('warriors',p.cone,p.terracotta,x,1.25,rz,0.55,2.5,0.45)
          box('heads',p.terracotta,x,2.77,rz,0.48,0.54,0.48)
          box('helmets',p.dark,x,3.1,rz,0.54,0.17,0.52)
          box('spears',p.bronze,x+side*0.7,2.05,rz,0.065,4.1,0.065)
        }
        if (i%2===0) {
          box('monolith',p.dark,side*6.1,4.8,z+7,1.5,9.6,2)
          box('inscription',p.gold,side*6.1,5.1,z+8.02,0.14,4.4,0.04)
          if (side === -1) box('lintel',p.bronze,0,10,z+7,14.2,0.8,2.2)
          if (side === -1) box('lintelSnow',p.snow,0,10.45,z+7,14.5,0.12,2.4)
          add('mound',p.cone,p.earth,side*29,8,z-5,17,18,21,Math.PI/4)
          add('moundSnow',p.cone,p.snow,side*29,13.9,z-5,5.5,6.0,7,Math.PI/4)
        }
      }
    }
    if (id===1 && i%2===0) box('gateTop',p.dark,0,8.7,z+5,12.8,0.65,0.9)
  }
  const scratch = new T.Object3D()
  for (const {geometry,material,transforms} of batches.values()) {
    const mesh=new T.InstancedMesh(geometry,material,transforms.length)
    transforms.forEach((t,i)=>{
      scratch.position.set(t[0],t[1],t[2]);scratch.scale.set(t[3],t[4],t[5])
      scratch.rotation.set(0,t[6],0);scratch.updateMatrix();mesh.setMatrixAt(i,scratch.matrix)
    })
    mesh.computeBoundingSphere();group.add(mesh)
  }
  return group
}
