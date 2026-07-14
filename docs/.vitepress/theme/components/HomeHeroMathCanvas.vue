<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

interface Point {
  x: number
  y: number
}

interface Walker {
  x: number
  y: number
  anchorX: number
  anchorY: number
  bornAt: number
  trail: Point[]
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

const ENTRY_DURATION = 1600
const FRAME_INTERVAL = 1000 / 24
const TRAIL_LENGTH = 60
const WALKER_LIFETIME = 7000
// Non-uniform codomain bins keep the level-set entrance from reading as a scanline grid.
const LEVEL_STOPS = [0, 0.17, 0.36, 0.58, 0.79, 1]

let root: HTMLElement | null = null
let title: HTMLElement | null = null
let context: CanvasRenderingContext2D | null = null
let maskCanvas: HTMLCanvasElement | null = null
let maskContext: CanvasRenderingContext2D | null = null
let maskPixels: Uint8ClampedArray | null = null
let maskPixelWidth = 0
let width = 0
let height = 0
let dpr = 1
let startedAt = 0
let lastPathFrame = 0
let animationFrame = 0
let resizeFrame = 0
let active = false
let mounted = false
let walker: Walker | null = null
let validPoints: Point[] = []
let levelColors: string[] = []
let pathColor = '#8bd8d2'
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null
let motionQuery: MediaQueryList | null = null

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - clamp(value), 3)
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

function normalSample() {
  const u = Math.max(Math.random(), Number.EPSILON)
  const v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function readPalette() {
  if (!root) return
  const style = getComputedStyle(root)
  levelColors = [1, 2, 3, 4, 5].map((index) => (
    style.getPropertyValue(`--hero-level-${index}`).trim()
  ))
  pathColor = style.getPropertyValue('--hero-path').trim() || '#8bd8d2'
}

function prepareCanvas(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number) {
  canvas.width = Math.max(1, Math.round(cssWidth * dpr))
  canvas.height = Math.max(1, Math.round(cssHeight * dpr))
}

function rebuildMask() {
  const canvas = canvasRef.value
  if (!canvas || !root || !title) return false

  const rootRect = root.getBoundingClientRect()
  width = Math.max(1, rootRect.width)
  height = Math.max(1, rootRect.height)
  dpr = Math.min(window.devicePixelRatio || 1, 2)

  prepareCanvas(canvas, width, height)
  context = canvas.getContext('2d')
  if (!context) return false
  context.setTransform(dpr, 0, 0, dpr, 0, 0)

  maskCanvas ??= document.createElement('canvas')
  prepareCanvas(maskCanvas, width, height)
  maskContext = maskCanvas.getContext('2d', { willReadFrequently: true })
  if (!maskContext) return false

  maskContext.setTransform(dpr, 0, 0, dpr, 0, 0)
  maskContext.clearRect(0, 0, width, height)
  maskContext.fillStyle = '#fff'
  maskContext.textAlign = 'left'
  maskContext.textBaseline = 'alphabetic'

  const glyphs = title.querySelectorAll<HTMLElement>('[data-hero-glyph]')
  glyphs.forEach((glyph) => {
    const rect = glyph.getBoundingClientRect()
    const style = getComputedStyle(glyph)
    const x = rect.left - rootRect.left
    const top = rect.top - rootRect.top
    const text = glyph.textContent ?? ''

    maskContext!.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    maskContext!.fontKerning = 'normal'
    const spacedContext = maskContext as CanvasRenderingContext2D & { letterSpacing?: string }
    spacedContext.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing

    const metrics = maskContext!.measureText(text)
    const ascent = metrics.actualBoundingBoxAscent || parseFloat(style.fontSize) * 0.78
    const descent = metrics.actualBoundingBoxDescent || parseFloat(style.fontSize) * 0.22
    const baseline = top + (rect.height - ascent - descent) / 2 + ascent
    maskContext!.fillText(text, x, baseline)
  })

  const image = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
  maskPixels = image.data
  maskPixelWidth = maskCanvas.width
  validPoints = []

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      if (isInsideGlyph(x, y)) validPoints.push({ x, y })
    }
  }

  readPalette()
  seedWalker(performance.now())
  return validPoints.length > 0
}

function isInsideGlyph(x: number, y: number) {
  if (!maskPixels || x < 0 || y < 0 || x >= width || y >= height) return false
  const px = Math.min(maskPixelWidth - 1, Math.max(0, Math.round(x * dpr)))
  const py = Math.min(Math.round(height * dpr) - 1, Math.max(0, Math.round(y * dpr)))
  return maskPixels[(py * maskPixelWidth + px) * 4 + 3] > 96
}

function seedWalker(now: number) {
  if (validPoints.length === 0) {
    walker = null
    return
  }
  const point = validPoints[Math.floor(Math.random() * validPoints.length)]
  walker = {
    x: point.x,
    y: point.y,
    anchorX: point.x,
    anchorY: point.y,
    bornAt: now,
    trail: [{ x: point.x, y: point.y }]
  }
}

function advanceWalker(now: number) {
  if (!walker || now - walker.bornAt > WALKER_LIFETIME) {
    seedWalker(now)
    return
  }

  const dt = 1 / 24
  const theta = 0.18
  const sigma = 14
  const noiseScale = sigma * Math.sqrt(dt)

  // Euler–Maruyama for an OU process, rejected at the glyph-mask boundary.
  for (let attempt = 0; attempt < 10; attempt++) {
    const nextX = walker.x + theta * (walker.anchorX - walker.x) * dt + noiseScale * normalSample()
    const nextY = walker.y + theta * (walker.anchorY - walker.y) * dt + noiseScale * normalSample()
    if (!isInsideGlyph(nextX, nextY)) continue

    walker.x = nextX
    walker.y = nextY
    walker.trail.push({ x: nextX, y: nextY })
    if (walker.trail.length > TRAIL_LENGTH) walker.trail.shift()
    return
  }

  seedWalker(now)
}

function clearCanvas() {
  if (!context) return
  context.save()
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, width, height)
  context.restore()
}

function clipToGlyphs() {
  if (!context || !maskCanvas) return
  context.globalCompositeOperation = 'destination-in'
  context.globalAlpha = 1
  context.drawImage(maskCanvas, 0, 0, width, height)
  context.globalCompositeOperation = 'source-over'
}

function drawLevelSets(progress: number) {
  if (!context || !maskCanvas) return
  clearCanvas()

  const p = clamp(progress)
  const fade = 1 - smoothstep(0.76, 1, p)
  context.save()

  const bandCount = LEVEL_STOPS.length - 1
  for (let index = 0; index < bandCount; index++) {
    const lower = LEVEL_STOPS[bandCount - index - 1]
    const upper = LEVEL_STOPS[bandCount - index]
    const y = ((lower + upper) / 2) * height
    const local = easeOutCubic(p * bandCount - index)
    if (local <= 0) continue

    context.globalAlpha = fade * (local < 1 ? 0.58 : 0.22)
    context.fillStyle = levelColors[index] || '#24536a'
    context.fillRect(0, y - 0.65, width * local, 1.3)
  }

  clipToGlyphs()
  context.restore()
}

function drawItoPath() {
  if (!context || !maskCanvas || !walker || walker.trail.length < 2) {
    clearCanvas()
    return
  }

  clearCanvas()
  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 1.25
  context.strokeStyle = pathColor

  for (let index = 1; index < walker.trail.length; index++) {
    const previous = walker.trail[index - 1]
    const current = walker.trail[index]
    const age = index / walker.trail.length
    context.globalAlpha = 0.06 + 0.58 * age * age
    context.beginPath()
    context.moveTo(previous.x, previous.y)
    context.lineTo(current.x, current.y)
    context.stroke()
  }

  context.globalAlpha = 0.82
  context.fillStyle = pathColor
  context.beginPath()
  context.arc(walker.x, walker.y, 1.4, 0, Math.PI * 2)
  context.fill()

  clipToGlyphs()
  context.restore()
}

function frame(now: number) {
  if (!active) return
  const elapsed = now - startedAt

  if (elapsed < ENTRY_DURATION) {
    drawLevelSets(elapsed / ENTRY_DURATION)
  } else if (now - lastPathFrame >= FRAME_INTERVAL) {
    advanceWalker(now)
    drawItoPath()
    lastPathFrame = now
  }

  animationFrame = requestAnimationFrame(frame)
}

function startTimeline() {
  const canvas = canvasRef.value
  if (!canvas || motionQuery?.matches) return

  cancelAnimationFrame(animationFrame)
  active = false
  if (!rebuildMask()) {
    canvas.hidden = true
    root?.classList.remove('is-math-ready')
    return
  }

  active = true
  canvas.hidden = false
  root?.classList.remove('is-math-ready')
  drawLevelSets(0)
  void root?.offsetWidth
  root?.classList.add('is-math-ready')
  startedAt = performance.now()
  lastPathFrame = 0
  animationFrame = requestAnimationFrame(frame)
}

function stopTimeline() {
  active = false
  cancelAnimationFrame(animationFrame)
  clearCanvas()
  root?.classList.remove('is-math-ready')
  if (canvasRef.value) canvasRef.value.hidden = true
}

function scheduleRestart() {
  cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => {
    const rect = root?.getBoundingClientRect()
    if (!rect || (Math.abs(rect.width - width) < 0.5 && Math.abs(rect.height - height) < 0.5)) return
    startTimeline()
  })
}

function onMotionChange() {
  if (motionQuery?.matches) stopTimeline()
  else startTimeline()
}

function onVisibilityChange() {
  if (!active) return
  if (document.hidden) {
    cancelAnimationFrame(animationFrame)
    return
  }
  cancelAnimationFrame(animationFrame)
  lastPathFrame = 0
  animationFrame = requestAnimationFrame(frame)
}

onMounted(async () => {
  mounted = true
  const canvas = canvasRef.value
  root = canvas?.parentElement ?? null
  title = root?.querySelector<HTMLElement>('.home-hero-title') ?? null
  if (!canvas || !root || !title) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionQuery.addEventListener('change', onMotionChange)
  document.addEventListener('visibilitychange', onVisibilityChange)

  await document.fonts.ready
  await nextTick()
  if (!mounted) return

  resizeObserver = new ResizeObserver(scheduleRestart)
  resizeObserver.observe(root)
  themeObserver = new MutationObserver(readPalette)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  onMotionChange()
})

onUnmounted(() => {
  mounted = false
  active = false
  cancelAnimationFrame(animationFrame)
  cancelAnimationFrame(resizeFrame)
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  motionQuery?.removeEventListener('change', onMotionChange)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  root?.classList.remove('is-math-ready')
})
</script>

<template>
  <canvas ref="canvasRef" class="home-hero-math-canvas" aria-hidden="true" />
</template>

<style scoped>
.home-hero-math-canvas {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .home-hero-math-canvas {
    display: none;
  }
}
</style>
