<!--
  @file Background.vue
  @description 动态背景组件 (Dynamic Background)
  职责：
  1. 使用 Canvas 实现数学符号粒子运动效果。
  2. 实现基于凸包算法 (Convex Hull) 的边界绘制。
  3. 提供响应式和深色模式适配的视觉体验。
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationFrameId: number

// --- ⚙️ 数学参数配置 ---
const CONNECT_DIST = 160     // 连通阈值
const SPEED_FACTOR = 0.35    // 运动速率
// 元数学符号集：涵盖逻辑推导5大基本符号、集合论、数论、分析学等核心符号
const META_SYMBOLS = [
  // 逻辑推导 5 大基本符号 (Negation, Conjunction, Disjunction, Implication, Biconditional)
  '¬', '∧', '∨', '→', '↔',
  // 量词与元逻辑 (Quantifiers, Turnstile, Models, Entailment, Bottom, Therefore, Because, QED)
  '∀', '∃', '⊢', '⊨', '⇔', '⇒', '⊥', '∴', '∵', '∎',
  // 集合论与结构 (Empty set, Element of, Subset, Union, Intersection, Aleph)
  '∅', '∈', '⊂', '∪', '∩', 'ℵ',
  // 数系 (Reals, Complex, Integers, Naturals, Rationals)
  'ℝ', 'ℂ', 'ℤ', 'ℕ', 'ℚ',
  // 分析与几何 (Integral, Partial, Nabla, Sum, Product, Infinity, Omega, Pi)
  '∫', '∂', '∇', '∑', '∏', '∞', 'Ω', 'π'
]

interface Point {
  x: number
  y: number
  vx: number
  vy: number
  symbol: string // 每个粒子携带一个逻辑符号
}

let points: Point[] = []

// 初始化随机点集
function initPoints(width: number, height: number) {
  points = []
  const pointCount = width < 768 ? 10 : 40
  for (let i = 0; i < pointCount; i++) {
    points.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * SPEED_FACTOR,
      vy: (Math.random() - 0.5) * SPEED_FACTOR,
      symbol: META_SYMBOLS[Math.floor(Math.random() * META_SYMBOLS.length)]
    })
  }
}

// 📐 凸分析算法：Monotone Chain (单调链) 求凸包
function getConvexHull(pts: Point[]) {
  const sorted = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y)

  const cross = (o: Point, a: Point, b: Point) => {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  }

  const lower: Point[] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }

  const upper: Point[] = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }

  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

function draw() {
  if (!ctx || !canvasRef.value) return
  const width = canvasRef.value.width
  const height = canvasRef.value.height

  ctx.clearRect(0, 0, width, height)

  // 检测暗色模式
  const isDark = document.documentElement.classList.contains('dark')

  // 🎨 颜色配置 (已加深)
  // 符号颜色：更清晰的灰/白
  const symbolColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
  // 连线颜色：加深
  const lineColor = isDark ? 'rgba(120,220,255,0.25)' : 'rgba(0,50,100,0.03)'
  // 三角形填充：加深一点，更有质感
  const triangleColor = isDark ? 'rgba(120,220,255,0.05)' : 'rgba(0,50,100,0.005)'
  // 凸包颜色：醒目的元边界
  const hullColor = isDark ? 'rgba(100, 220, 255, 0.05)' : 'rgba(0, 160, 200, 0.01)'

  ctx.font = '14px "Courier New", monospace' // 使用等宽字体体现形式化感
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 1. 更新粒子位置
  points.forEach(p => {
    p.x += p.vx
    p.y += p.vy

    // 边界碰撞检测 (添加位置修正，防止粒子卡在边界外)
    if (p.x < 0) {
      p.x = 0;
      p.vx *= -1;
    } else if (p.x > width) {
      p.x = width;
      p.vx *= -1;
    }

    if (p.y < 0) {
      p.y = 0;
      p.vy *= -1;
    } else if (p.y > height) {
      p.y = height;
      p.vy *= -1;
    }
  })

  // 2. 绘制凸包 (Convex Hull - The Boundary of the System)
  const hull = getConvexHull(points)
  if (hull.length > 0) {
    ctx.beginPath()
    ctx.moveTo(hull[0].x, hull[0].y)
    for (let i = 1; i < hull.length; i++) {
      ctx.lineTo(hull[i].x, hull[i].y)
    }
    ctx.closePath()
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
    ctx.fill()
    ctx.strokeStyle = hullColor
    ctx.lineWidth = 1.5
    ctx.setLineDash([8, 8])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 3. 绘制拓扑与元结构 (Topology & Meta-structure)
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i]

    // 绘制元符号 (代替普通圆点)
    ctx.fillStyle = symbolColor
    ctx.fillText(p1.symbol, p1.x, p1.y)

    for (let j = i + 1; j < points.length; j++) {
      const p2 = points[j]
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const distSq = dx * dx + dy * dy

      if (distSq < CONNECT_DIST * CONNECT_DIST) {
        // 绘制连线
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = lineColor
        ctx.lineWidth = 0.8 // 线条稍微加粗
        ctx.stroke()

        // 🔺 构成单纯形 (Simplex) 与 自指递归 (Self-reference)
        for (let k = j + 1; k < points.length; k++) {
          const p3 = points[k]
          const d2 = (p1.x - p3.x) ** 2 + (p1.y - p3.y) ** 2
          const d3 = (p2.x - p3.x) ** 2 + (p2.y - p3.y) ** 2

          if (d2 < CONNECT_DIST ** 2 && d3 < CONNECT_DIST ** 2) {
            // 填充主三角形
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.lineTo(p3.x, p3.y)
            ctx.closePath()
            ctx.fillStyle = triangleColor
            ctx.fill()

            // ✨ 元数学彩蛋：递归内嵌 (Recursion)
            // 在三角形重心处绘制一个微小的“元点”或内嵌三角形
            // 这象征着系统内部的自我描述
            const cx = (p1.x + p2.x + p3.x) / 3
            const cy = (p1.y + p2.y + p3.y) / 3

            ctx.beginPath()
            // 绘制一个小一点的内嵌空心三角形
            ctx.moveTo((p1.x + cx) / 2, (p1.y + cy) / 2)
            ctx.lineTo((p2.x + cx) / 2, (p2.y + cy) / 2)
            ctx.lineTo((p3.x + cx) / 2, (p3.y + cy) / 2)
            ctx.closePath()
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }
  }

  animationFrameId = requestAnimationFrame(draw)
}

function handleResize() {
  if (!canvasRef.value) return
  const dpr = window.devicePixelRatio || 1
  canvasRef.value.width = window.innerWidth * dpr
  canvasRef.value.height = window.innerHeight * dpr
  if (ctx) ctx.scale(dpr, dpr)
  canvasRef.value.style.width = `${window.innerWidth}px`
  canvasRef.value.style.height = `${window.innerHeight}px`

  initPoints(window.innerWidth, window.innerHeight)
}

// 防抖处理 resize
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
const onResize = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    handleResize()
  }, 200)
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    handleResize()
    draw()
    window.addEventListener('resize', onResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (resizeTimeout) clearTimeout(resizeTimeout)
  cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <canvas ref="canvasRef" class="math-bg"></canvas>
</template>

<style scoped>
.math-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
  opacity: 1;
}
</style>