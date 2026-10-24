/** Three prebuilt strips cycle visually; Rust supplies their identity. No transition allocation. */
import * as T from 'three'
import { Palette } from './Palette'
import { buildBiome } from './biomes'
import { FIELD as F } from '../config'
export class EnvironmentView {
  private strips: T.Group[]
  private backdrop = new T.Group()
  private sunMaterial = new T.MeshBasicMaterial({ color: 0xf4dfb1, fog: false })
  readonly skies = [new T.Color(0xacc5cf),new T.Color(0x8ca8b6),new T.Color(0x637684)]
  readonly sky = new T.Color()
  private whiteout = new T.Color(0xe0edf0)
  constructor(scene: T.Scene,p: Palette) {
    this.strips=[buildBiome(0,p),buildBiome(1,p),buildBiome(2,p)]
    scene.add(...this.strips,this.backdrop)
    p.mesh(scene,p.box,p.snow,0,-0.68,-125,900,0.4,1000)
    for (let i=0;i<18;i++) {
      const side=i%2?-1:1,z=-35-Math.floor(i/2)*34,height=25+(i*13%25)
      p.mesh(this.backdrop,p.cone,i%3===0?p.ice:p.snow,side*(42+i%3*14),height/2-1,z,20+i%4*5,height,24)
    }
    p.mesh(this.backdrop,p.rounded,this.sunMaterial,-80,90,-330,15)
  }
  update(frame: Float32Array): number {
    const id=frame[F.biome],time=frame[F.time],phase=time%40
    // Veil straddles the authoritative boundary; no black frame or new assets.
    const veil=time<39.1?0:Math.max(0,1-Math.min(phase,40-phase)/0.9)
    for (let i=0;i<this.strips.length;i++) {
      this.strips[i].visible=i===id && veil<0.94
      this.strips[i].position.z=frame[F.travel]%48
    }
    this.backdrop.visible=veil<0.94
    this.sky.copy(this.skies[id]).lerp(this.whiteout,veil*0.8)
    return veil
  }
  dispose() { this.sunMaterial.dispose() }
}
