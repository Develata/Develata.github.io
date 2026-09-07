/** Converts only focused-surface browser events to semantic actions; owns no game state. */
import { ACTION } from '../config'
const KEYS: Record<string, number> = {
  ArrowLeft: ACTION.left, KeyA: ACTION.left, ArrowRight: ACTION.right, KeyD: ACTION.right,
  ArrowUp: ACTION.jump, KeyW: ACTION.jump, Space: ACTION.jump,
  ArrowDown: ACTION.duck, KeyS: ACTION.duck,
  ShiftLeft: ACTION.boost, ShiftRight: ACTION.boost, KeyE: ACTION.boost,
}
export class InputController {
  private mask = 0
  private lastTap: { x: number; y: number; at: number } | null = null
  private pointer: { id: number; x: number; y: number; at: number } | null = null
  constructor(private surface: HTMLElement, private active: () => boolean, private pause: () => void) {
    surface.addEventListener('keydown', this.key)
    surface.addEventListener('pointerdown', this.down)
    surface.addEventListener('pointerup', this.up)
    surface.addEventListener('pointercancel', this.cancel)
    surface.addEventListener('lostpointercapture', this.cancel)
  }
  private key = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.code === 'Escape') { e.preventDefault(); if (!e.repeat) this.pause(); return }
    if (e.target !== this.surface || !this.active() || !KEYS[e.code]) return
    e.preventDefault()
    if (!e.repeat) this.mask |= KEYS[e.code]
  }
  private down = (e: PointerEvent) => {
    if (!this.active() || !e.isPrimary || e.button !== 0 || (e.target as HTMLElement).closest('button,a')) return
    this.surface.focus({ preventScroll: true })
    this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, at: e.timeStamp }
    this.surface.setPointerCapture(e.pointerId)
  }
  private up = (e: PointerEvent) => {
    const p = this.pointer
    this.pointer = null
    if (!p || p.id !== e.pointerId || !this.active()) return
    const x = e.clientX - p.x, y = e.clientY - p.y
    const ax = Math.abs(x), ay = Math.abs(y)
    const minimum = Math.max(22, Math.min(44, this.surface.clientWidth * 0.055))
    const duration = e.timeStamp - p.at
    if (duration <= 240 && Math.max(ax, ay) <= 10) {
      const last = this.lastTap
      if (last && e.timeStamp - last.at >= 40 && e.timeStamp - last.at <= 320
        && Math.hypot(e.clientX - last.x, e.clientY - last.y) <= 32) {
        this.mask |= ACTION.boost; this.lastTap = null
      } else this.lastTap = { x: e.clientX, y: e.clientY, at: e.timeStamp }
      return
    }
    this.lastTap = null
    if (duration > 650 || Math.max(ax, ay) < minimum) return
    if (ax > ay * 1.3) this.mask |= x < 0 ? ACTION.left : ACTION.right
    else if (ay > ax * 1.3) this.mask |= y < 0 ? ACTION.jump : ACTION.duck
  }
  private cancel = (event: PointerEvent) => {
    this.pointer = null
    if (event.type === 'pointercancel') this.lastTap = null
  }
  read(): number { const actions = this.mask; this.mask = 0; return actions }
  clear() { this.mask = 0; this.pointer = null; this.lastTap = null }
  dispose() {
    this.clear()
    this.surface.removeEventListener('keydown', this.key)
    this.surface.removeEventListener('pointerdown', this.down)
    this.surface.removeEventListener('pointerup', this.up)
    this.surface.removeEventListener('pointercancel', this.cancel)
    this.surface.removeEventListener('lostpointercapture', this.cancel)
  }
}
