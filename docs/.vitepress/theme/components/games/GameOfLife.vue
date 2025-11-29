<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// --- 配置 ---
const RESOLUTION = 20 // 格子大小
const SPEED_BASE = 100 // 基础刷新间隔

// --- 经典图案数据 ---
const PRESETS = {
  'glider': {
    name: '滑翔机',
    points: [[1,0],[2,1],[0,2],[1,2],[2,2]]
  },
  'pulsar': {
    name: '脉冲星',
    points: [
      [2,0],[3,0],[4,0],[8,0],[9,0],[10,0],
      [0,2],[5,2],[7,2],[12,2],[0,3],[5,3],[7,3],[12,3],[0,4],[5,4],[7,4],[12,4],
      [2,5],[3,5],[4,5],[8,5],[9,5],[10,5],
      [2,7],[3,7],[4,7],[8,7],[9,7],[10,7],
      [0,8],[5,8],[7,8],[12,8],[0,9],[5,9],[7,9],[12,9],[0,10],[5,10],[7,10],[12,10],
      [2,12],[3,12],[4,12],[8,12],[9,12],[10,12]
    ]
  },
  'gun': {
    name: '滑翔机枪（电脑体验最佳）',
    points: [
      [24,0],[22,1],[24,1],[12,2],[13,2],[20,2],[21,2],[34,2],[35,2],[11,3],[15,3],[20,3],[21,3],[34,3],[35,3],[0,4],[1,4],[10,4],[16,4],[20,4],[21,4],[0,5],[1,5],[10,5],[14,5],[16,5],[17,5],[22,5],[24,5],[10,6],[16,6],[24,6],[11,7],[15,7],[12,8],[13,8]
    ]
  }
}

// --- 状态 ---
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isRunning = ref(false)
const generation = ref(0)
const population = ref(0)
const speed = ref(1) 
const isDrawing = ref(false)
const lastDrawPos = ref({ x: -1, y: -1 })
const showPresets = ref(false) // 控制下拉菜单

let ctx: CanvasRenderingContext2D | null = null
let grid: number[][] = []
let cols = 0
let rows = 0
let animationId: number | null = null
let lastTime = 0

// --- 核心逻辑 ---

function initGrid() {
  if (!canvasRef.value || !containerRef.value) return
  const canvas = canvasRef.value
  const container = containerRef.value
  
  const { clientWidth } = container
  const dpr = window.devicePixelRatio || 1
  
  // 保持高度为 400px (或者根据屏幕宽度自适应，这里固定400体验较好)
  const height = 400

  canvas.width = clientWidth * dpr
  canvas.height = height * dpr
  canvas.style.width = `${clientWidth}px`
  canvas.style.height = `${height}px`

  ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)

  cols = Math.ceil(clientWidth / RESOLUTION)
  rows = Math.ceil(height / RESOLUTION)

  // 只有当网格尺寸发生巨大变化时才重置，否则保留当前状态（仅仅是resize）
  // 这里简化为：每次 resize 都重置，防止数组越界
  grid = new Array(cols).fill(null).map(() => new Array(rows).fill(0))
  randomize()
}

function randomize() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = Math.random() > 0.85 ? 1 : 0
    }
  }
  resetStats()
  draw()
}

function clearGrid() {
  grid = grid.map(col => col.map(() => 0))
  resetStats()
  stopGame()
  draw()
}

function resetStats() {
  generation.value = 0
  population.value = countPopulation()
}

function countPopulation() {
  let count = 0
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j]) count++
    }
  }
  return count
}

// 加载预设图案
function loadPattern(key: string) {
  clearGrid()
  const pattern = PRESETS[key as keyof typeof PRESETS]
  if (!pattern) return

  // 计算居中偏移
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  pattern.points.forEach(([x, y]) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  })
  
  const pWidth = maxX - minX
  const pHeight = maxY - minY
  const offsetX = Math.floor((cols - pWidth) / 2) - minX
  const offsetY = Math.floor((rows - pHeight) / 2) - minY

  pattern.points.forEach(([x, y]) => {
    const targetX = x + offsetX
    const targetY = y + offsetY
    if (targetX >= 0 && targetX < cols && targetY >= 0 && targetY < rows) {
      grid[targetX][targetY] = 1
    }
  })
  
  population.value = pattern.points.length
  showPresets.value = false // 关闭菜单
  draw()
}

function computeNextGen() {
  const next = grid.map(arr => [...arr]) // 浅拷贝一维，深拷贝二维需要遍历
  // 优化：其实不需要创建完整新数组，可以用双缓冲，但JS里创建数组开销尚可
  // 这里使用更快的写法
  for(let i=0; i<cols; i++) next[i] = [...grid[i]]

  let popCount = 0

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const state = grid[i][j]
      
      // 展开 countNeighbors 减少函数调用栈开销 (Inline optimization)
      let neighbors = 0
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          if (x === 0 && y === 0) continue
          const col = i + x
          const row = j + y
          if (col >= 0 && col < cols && row >= 0 && row < rows) {
            neighbors += grid[col][row]
          }
        }
      }

      if (state === 0 && neighbors === 3) {
        next[i][j] = 1
      } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
        next[i][j] = 0
      }
      
      if (next[i][j] === 1) popCount++
    }
  }

  grid = next
  generation.value++
  population.value = popCount
}

// 新增：单步执行函数
function step() {
  computeNextGen()
  draw()
}

function gameLoop(timestamp: number) {
  if (!isRunning.value) return
  const interval = SPEED_BASE / speed.value
  if (timestamp - lastTime > interval) {
    computeNextGen()
    draw()
    lastTime = timestamp
  }
  animationId = requestAnimationFrame(gameLoop)
}

function draw() {
  if (!ctx || !canvasRef.value) return
  
  // 1. 清空画布
  const width = cols * RESOLUTION
  const height = rows * RESOLUTION
  ctx.clearRect(0, 0, width, height)
  
  // 获取当前主题色
  const style = getComputedStyle(document.body)
  const brandColor = style.getPropertyValue('--vp-c-brand').trim() || '#3498db'
  ctx.fillStyle = brandColor

  // 2. 批量渲染优化 (Batch Rendering)
  // 不要在循环里 fillRect，而是先把路径画完，最后一次性 fill
  ctx.beginPath() 
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 1) {
        // 为了美观，格子稍微画小一点点 (padding 1px)
        ctx.rect(i * RESOLUTION + 1, j * RESOLUTION + 1, RESOLUTION - 2, RESOLUTION - 2)
      }
    }
  }
  ctx.fill() // 一次性提交 GPU
}

// --- 交互 ---

function getGridPos(e: MouseEvent | TouchEvent) {
  if (!canvasRef.value) return { x: -1, y: -1 }
  const rect = canvasRef.value.getBoundingClientRect()
  
  let clientX, clientY
  if (window.TouchEvent && e instanceof TouchEvent) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else if (e instanceof MouseEvent) {
    clientX = e.clientX
    clientY = e.clientY
  } else {
    return { x: -1, y: -1 }
  }

  const x = Math.floor((clientX - rect.left) / RESOLUTION)
  const y = Math.floor((clientY - rect.top) / RESOLUTION)
  return { x, y }
}

function startDraw(e: MouseEvent | TouchEvent) {
  isDrawing.value = true
  // 仅在非按钮区域阻止默认事件，防止很难滚动页面
  // 这里可以不加 preventDefault，依靠 css touch-action: none
  handleDraw(e)
}

function moveDraw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value) return
  if (e.cancelable) e.preventDefault()
  handleDraw(e)
}

function endDraw() {
  isDrawing.value = false
  lastDrawPos.value = { x: -1, y: -1 }
  population.value = countPopulation() // 更新人口数
}

function handleDraw(e: MouseEvent | TouchEvent) {
  const { x, y } = getGridPos(e)
  if (x < 0 || x >= cols || y < 0 || y >= rows) return
  if (x === lastDrawPos.value.x && y === lastDrawPos.value.y) return

  grid[x][y] = 1 
  lastDrawPos.value = { x, y }
  
  // 绘制时不重算整个逻辑，只请求重绘
  requestAnimationFrame(draw)
}

function toggleGame() {
  if (isRunning.value) stopGame()
  else startGame()
}

function startGame() {
  isRunning.value = true
  lastTime = performance.now()
  animationId = requestAnimationFrame(gameLoop)
}

function stopGame() {
  isRunning.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

function resizeCanvas() {
  initGrid()
}

onMounted(() => {
  // nextTick 确保 DOM 已经完全渲染，CSS 尺寸已生效
  nextTick(() => {
    initGrid()
    window.addEventListener('resize', resizeCanvas)
  })
})

onUnmounted(() => {
  stopGame()
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <div class="life-container">
    <div class="controls">
      <div class="main-actions">
        <button class="btn primary big-btn" @click="toggleGame">
          {{ isRunning ? '⏸ 暂停' : '▶ 开始' }}
        </button>
        <!-- 修改这里：将 @click="computeNextGen" 改为 @click="step" -->
        <button class="btn big-btn" @click="step" :disabled="isRunning">⏭ 单步</button>
      </div>
      
      <div class="sub-actions">
        <div class="dropdown">
          <button class="btn small-btn" @click="showPresets = !showPresets">
            🧩 预设 ▼
          </button>
          <div v-if="showPresets" class="dropdown-menu">
            <div 
              v-for="(pattern, key) in PRESETS" 
              :key="key"
              class="dropdown-item"
              @click="loadPattern(key)"
            >
              {{ pattern.name }}
            </div>
          </div>
        </div>

        <button class="btn small-btn" @click="randomize">🎲 随机</button>
        <button class="btn small-btn" @click="clearGrid">🗑 清空</button>
        <button class="btn small-btn speed-btn" @click="speed = speed === 1 ? 2 : (speed === 2 ? 4 : 1)">
          🚀 {{ speed }}x
        </button>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat-item">📅 代数: <strong>{{ generation }}</strong></div>
      <div class="stat-item">🦠 存活: <strong>{{ population }}</strong></div>
    </div>

    <div class="canvas-container" ref="containerRef">
      <div class="grid-bg" :style="{ backgroundSize: `${RESOLUTION}px ${RESOLUTION}px` }"></div>
      
      <canvas 
        ref="canvasRef"
        @mousedown="startDraw"
        @mousemove="moveDraw"
        @mouseup="endDraw"
        @mouseleave="endDraw"
        @touchstart="startDraw"
        @touchmove="moveDraw"
        @touchend="endDraw"
      ></canvas>
      
      <div v-if="!isRunning && generation === 0 && population > 0" class="overlay-hint fade-out">
        👋 提示: 滑动绘制，或选择预设
      </div>
    </div>
  </div>
</template>

<style scoped>
.life-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
  font-family: monospace;
  touch-action: manipulation;
  user-select: none;
  
  /* 👇 修改：彻底锁死宽度，防止撑破页面导致导航栏偏移 */
  width: 100%;
  max-width: 100vw; 
  overflow: hidden; 
}

/* --- 按钮与布局 --- */
.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.main-actions { display: flex; gap: 10px; }
.sub-actions { display: flex; gap: 8px; position: relative; }

.btn {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}
.btn.primary { background: var(--vp-c-brand); color: white; border-color: var(--vp-c-brand); }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.5; filter: grayscale(1); }

.big-btn { flex: 1; height: 44px; font-size: 1rem; }
.small-btn { flex: 1; height: 36px; font-size: 0.85rem; }

/* --- 下拉菜单 --- */
.dropdown { flex: 1; position: relative; }
.dropdown .btn { width: 100%; }
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 140px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100;
  margin-top: 5px;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}
.dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
}
.dropdown-item:hover { background: var(--vp-c-bg-soft); color: var(--vp-c-brand); }

/* --- 画布容器 --- */
.canvas-container {
  position: relative;
  width: 100%;
  
  /* 👇 修改：允许内部滚动，并移除 overflow: hidden 以便滚动条显示 */
  max-width: 100%;
  overflow-x: auto; 
  
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-alt); 
  line-height: 0;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
  
  /* 👇 新增：确保画布居中 */
  display: flex;
  justify-content: center;
}

/* 纯 CSS 网格背景，性能极高 */
.grid-bg {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  background-image: 
    linear-gradient(to right, var(--vp-c-divider) 1px, transparent 1px),
    linear-gradient(to bottom, var(--vp-c-divider) 1px, transparent 1px);
  opacity: 0.15; /* 网格线淡一点 */
}

canvas {
  position: relative;
  width: 100%;
  touch-action: none;
  cursor: crosshair;
  z-index: 1; /* 在网格背景之上 */
}

.stats {
  display: flex;
  justify-content: space-around;
  background: var(--vp-c-bg-soft);
  padding: 8px;
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}
.stat-item strong { color: var(--vp-c-text-1); margin-left: 4px; }

.overlay-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  pointer-events: none;
  z-index: 2;
  
  /* 👇 新增以下三行，修复移动端排版错乱 */
  width: max-content;   /* 确保宽度紧贴文字 */
  max-width: 90%;       /* 防止超出屏幕 */
  white-space: nowrap;  /* 强制不换行 */
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (min-width: 640px) {
  .controls { flex-direction: row; justify-content: space-between; }
  .main-actions, .sub-actions { flex: initial; width: auto; }
  .big-btn, .small-btn { flex: initial; width: auto; padding: 0 16px; }
  .dropdown { flex: initial; }
}
</style>