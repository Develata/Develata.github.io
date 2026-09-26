/** One fixed streak pool and one six-fragment burst; no new meshes during play. */
import * as T from 'three'
import { FIELD as F, EVENT, LANE_WIDTH } from '../config'
import { Palette } from './Palette'
export class EffectsView {
  private streaks: T.InstancedMesh
  private fragments: T.InstancedMesh
  private material=new T.MeshBasicMaterial({color:0xe7f1f2,transparent:true,opacity:0.3,depthWrite:false})
  private scratch=new T.Object3D()
  private burstAt=-100
  private burstX=0
  constructor(scene:T.Scene,p:Palette) {
    this.streaks=new T.InstancedMesh(p.box,this.material,28)
    this.fragments=new T.InstancedMesh(p.rock,p.snow,6)
    for(const mesh of [this.streaks,this.fragments]) {
      mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.count=0;scene.add(mesh)
    }
  }
  update(frame:Float32Array,reduced:boolean) {
    const boost=frame[F.boost]>0,time=frame[F.time],speed=frame[F.speed]
    this.streaks.count=reduced||frame[F.phase]===0?0:boost?28:frame[F.biome]===1?20:12
    this.material.opacity=boost?0.45:0.23
    for(let i=0;i<this.streaks.count;i++) {
      const x=(i%2?-1:1)*(5.3+(i*7%11)*0.65),y=1.5+(i*3%9)
      const z=((i*13+frame[F.travel])%48)-36
      this.scratch.position.set(x,y,z);this.scratch.rotation.set(0,0,-0.12)
      this.scratch.scale.set(0.035,0.045,Math.min(3,speed*0.035)*(boost?1.5:1))
      this.scratch.updateMatrix();this.streaks.setMatrixAt(i,this.scratch.matrix)
    }
    this.streaks.instanceMatrix.needsUpdate=true
    if(frame[F.events]&EVENT.smash) {this.burstAt=time;this.burstX=frame[F.x]*LANE_WIDTH}
    const age=time-this.burstAt
    this.fragments.count=!reduced&&age>=0&&age<0.45?6:0
    for(let i=0;i<this.fragments.count;i++) {
      const side=i%2?-1:1
      this.scratch.position.set(this.burstX+side*age*(2+i%3),0.5+age*5-age*age*10,-0.4+age*(i-2))
      this.scratch.rotation.set(age*4,i+age*2,age*3);this.scratch.scale.setScalar(0.18*(1-age/0.45))
      this.scratch.updateMatrix();this.fragments.setMatrixAt(i,this.scratch.matrix)
    }
    this.fragments.instanceMatrix.needsUpdate=true
  }
  dispose() {this.material.dispose()}
}
