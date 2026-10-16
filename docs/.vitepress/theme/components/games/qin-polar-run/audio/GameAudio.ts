/** Lazy page-session music. A failed or blocked play promise never stops gameplay. */
import { withBase } from 'vitepress'
export class GameAudio {
  private audio?: HTMLAudioElement
  private muted = false
  start() {
    if (!this.audio) {
      this.audio = new Audio(withBase('/game-assets/qin-polar-run/audio/northern-run-bgm.mp3'))
      this.audio.preload = 'none'; this.audio.loop = true
      this.audio.volume = 0.4; this.audio.muted = this.muted
    }
    this.audio.currentTime = 0
    this.resume()
  }
  pause() { this.audio?.pause() }
  resume() { void this.audio?.play().catch(() => { /* Audio is optional, including offline/autoplay failure. */ }) }
  stop() { this.pause(); if (this.audio) this.audio.currentTime = 0 }
  setMuted(muted: boolean) { this.muted = muted; if (this.audio) this.audio.muted = muted }
  dispose() {
    this.stop()
    if (this.audio) { this.audio.removeAttribute('src'); this.audio.load(); this.audio = undefined }
  }
}
