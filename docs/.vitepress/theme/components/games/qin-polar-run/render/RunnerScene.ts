/** Three.js view only. Its owner supplies frames and owns the single RAF loop. */
import * as T from 'three'
import { FIELD as F } from '../config'
import { Palette } from './Palette'
import { CharacterView } from './CharacterView'
import { TrackView } from './TrackView'
import { EnvironmentView } from './EnvironmentView'
export class RunnerScene {
  private renderer!: T.WebGLRenderer
  private scene = new T.Scene()
  private camera = new T.PerspectiveCamera(52, 1, 0.1, 550)
  private palette = new Palette()
  private character!: CharacterView
  private track!: TrackView
  private environment!: EnvironmentView
  private observer!: ResizeObserver
  private target = new T.Vector3()
  private look = new T.Vector3()
  private lastFrame: Float32Array | null = null
  private reduced = matchMedia('(prefers-reduced-motion: reduce)')
  private disposed = false
  constructor(private container: HTMLElement, private onFailure: () => void) {
    try {
      this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
      this.renderer.setClearColor(0xacc5cf)
      this.renderer.outputColorSpace = T.SRGBColorSpace
      this.renderer.domElement.setAttribute('aria-hidden', 'true')
      this.renderer.domElement.addEventListener('webglcontextlost', this.lost)
      container.appendChild(this.renderer.domElement)
      this.scene.fog = new T.Fog(0xacc5cf, 50, 180)
      this.scene.add(new T.HemisphereLight(0xf2f6fa, 0x6f8487, 2.1))
      const light = new T.DirectionalLight(0xffe6b5, 2.2); light.position.set(-25, 50, 25); this.scene.add(light)
      this.environment = new EnvironmentView(this.scene, this.palette)
      this.track = new TrackView(this.scene, this.palette)
      this.character = new CharacterView(this.scene, this.palette)
      this.observer = new ResizeObserver(this.resize); this.observer.observe(container)
      this.resize()
    } catch (error) {
      this.dispose() // Includes failures after canvas attachment or partial scene construction.
      throw error
    }
  }
  private lost = (event: Event) => { event.preventDefault(); this.onFailure() }
  private resize = () => {
    if (this.disposed) return
    const width = this.container.clientWidth, height = this.container.clientHeight
    if (!width || !height) return
    this.camera.aspect = width / height
    this.camera.fov = this.camera.aspect < 0.85 ? 64 : 52
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.camera.aspect < 0.85 ? 1.25 : 1.5))
    this.renderer.setSize(width, height)
    if (this.lastFrame) this.draw(this.lastFrame, 0)
  }
  draw(frame: Float32Array, dt: number) {
    if (this.disposed) return
    this.lastFrame = frame
    this.track.update(frame); this.environment.update(frame[F.travel]); this.character.update(frame, this.reduced.matches)
    const portrait = this.camera.aspect < 0.85, ready = frame[F.phase] === 0
    // Rear-upper chase composition. Portrait backs off to preserve all three lanes.
    this.target.set(ready ? 7 : frame[F.x] * 0.16, portrait ? 9.4 : 7.5, portrait ? 17.5 : 12.5)
    this.look.set(0, 0.8, ready ? -5 : -16)
    if (dt === 0 || this.reduced.matches) this.camera.position.copy(this.target)
    else this.camera.position.lerp(this.target, 1 - Math.exp(-dt * 5))
    if (!this.reduced.matches) this.camera.position.y += Math.sin(frame[F.time] * 35) * frame[F.stumble] * 0.018
    this.camera.lookAt(this.look)
    this.renderer.render(this.scene, this.camera)
  }
  diagnostics() {
    let objects = 0; this.scene.traverse(() => objects++)
    return { objects, geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures, drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles, dpr: this.renderer.getPixelRatio() }
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.observer?.disconnect()
    this.renderer?.domElement.removeEventListener('webglcontextlost', this.lost)
    this.scene.traverse(object => { if (object instanceof T.InstancedMesh) object.dispose() })
    this.character?.dispose(); this.environment?.dispose(); this.palette.dispose()
    this.renderer?.dispose(); this.renderer?.forceContextLoss(); this.renderer?.domElement.remove()
    this.scene.clear(); this.lastFrame = null
  }
}
