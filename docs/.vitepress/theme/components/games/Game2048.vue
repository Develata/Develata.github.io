<!--
  @file Game2048.vue
  @description 2048 游戏组件
  职责：
  1. 实现 2048 数字合成逻辑。
  2. 处理键盘输入与触摸滑动。
  3. 状态管理（分数、胜利/失败判定）。
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

// --- 类型定义 ---
interface Tile {
  id: number
  val: number
  r: number
  c: number
  isNew?: boolean
  isMerged?: boolean
}

type GameState = 'playing' | 'won' | 'over'

// --- 配置 ---
const GRID_SIZE = 4
const WIN_VALUE = 2048

// --- 状态 ---
let tileIdCounter = 0
const tiles = ref<Tile[]>([])
const score = ref(0)
const bestScore = ref(0)
const gameState = ref<GameState>('playing')
const boardRef = ref<HTMLDivElement | null>(null)
const isAnimating = ref(false)

// 💾 历史记录 (用于悔棋)
const history = ref<{ tiles: Tile[], score: number }[]>([])

// --- 颜色映射 ---
function getTileColor(val: number) {
  if (val > 2048) return { bg: '#1e293b', fg: '#f8fafc' }
  const colors: Record<number, { bg: string, fg: string }> = {
    2: { bg: 'var(--vp-c-bg-alt)', fg: 'var(--vp-c-text-1)' },
    4: { bg: 'var(--vp-c-bg-soft)', fg: 'var(--vp-c-text-1)' },
    8: { bg: '#f59e0b', fg: '#fff' },
    16: { bg: '#f97316', fg: '#fff' },
    32: { bg: '#ef4444', fg: '#fff' },
    64: { bg: '#dc2626', fg: '#fff' },
    128: { bg: '#eab308', fg: '#fff' },
    256: { bg: '#84cc16', fg: '#fff' },
    512: { bg: '#22c55e', fg: '#fff' },
    1024: { bg: '#0ea5e9', fg: '#fff' },
    2048: { bg: '#6366f1', fg: '#fff' },
  }
  return colors[val] || colors[2]
}

// --- 核心逻辑 ---

function initGame(forceReset = false) {
  isAnimating.value = false

  // 读取最高分
  const savedBest = localStorage.getItem('2048-best')
  if (savedBest) bestScore.value = parseInt(savedBest)

  // 💾 尝试读取存档
  if (!forceReset) {
    const savedState = localStorage.getItem('2048-state')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        if (parsed.tiles && parsed.tiles.length > 0 && parsed.gameState !== 'over') {
          tiles.value = parsed.tiles
          score.value = parsed.score
          gameState.value = parsed.gameState
          tileIdCounter = parsed.tileIdCounter || 10000
          history.value = [] // 刷新后清空历史，防止作弊或逻辑复杂化
          return
        }
      } catch (e) {
        console.error('存档损坏', e)
      }
    }
  }

  // 开始新游戏
  tiles.value = []
  score.value = 0
  gameState.value = 'playing'
  tileIdCounter = 0
  history.value = []
  localStorage.removeItem('2048-state')

  spawnTile()
  spawnTile()
}

// 保存当前状态 (用于刷新网页恢复)
function saveState() {
  localStorage.setItem('2048-state', JSON.stringify({
    tiles: tiles.value,
    score: score.value,
    gameState: gameState.value,
    tileIdCounter: tileIdCounter
  }))
}

// ↩️ 记录历史 (用于悔棋)
function recordHistory() {
  // 深拷贝当前的 tiles
  const snapshot = JSON.parse(JSON.stringify(tiles.value))
  history.value.push({
    tiles: snapshot,
    score: score.value
  })
  // 限制历史记录长度，比如最多悔棋 5 步
  if (history.value.length > 5) history.value.shift()
}

// ↩️ 执行悔棋
function undo() {
  if (history.value.length === 0 || isAnimating.value || gameState.value === 'over') return

  const lastState = history.value.pop()
  if (lastState) {
    // 恢复状态
    tiles.value = lastState.tiles
    score.value = lastState.score
    gameState.value = 'playing'
    saveState() // 更新存档

    // 震动反馈
    if (navigator.vibrate) navigator.vibrate(20)
  }
}

function createTile(r: number, c: number, val: number): Tile {
  return {
    id: tileIdCounter++,
    val, r, c,
    isNew: true
  }
}

function spawnTile() {
  const emptyCells: { r: number, c: number }[] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!tiles.value.find(t => t.r === r && t.c === c)) {
        emptyCells.push({ r, c })
      }
    }
  }
  if (emptyCells.length === 0) return

  const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  const val = Math.random() < 0.9 ? 2 : 4
  tiles.value.push(createTile(r, c, val))

  setTimeout(() => {
    const tile = tiles.value.find(t => t.r === r && t.c === c)
    if (tile) tile.isNew = false
  }, 200)
}

function move(direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') {
  if (gameState.value !== 'playing' || isAnimating.value) return

  // 1. 构建逻辑网格
  let grid: (Tile | null)[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(null))
  tiles.value.forEach(t => {
    t.isMerged = false
    grid[t.r][t.c] = t
  })

  let moved = false
  let scoreAdd = 0
  const mergedIds = new Set<number>()

  // 记录移动前的快照（如果确实发生了移动，再推入 history）
  const currentSnapshot = JSON.parse(JSON.stringify(tiles.value))
  const currentScore = score.value

  const rStart = direction === 'ArrowDown' ? GRID_SIZE - 1 : 0
  const rEnd = direction === 'ArrowDown' ? -1 : GRID_SIZE
  const rStep = direction === 'ArrowDown' ? -1 : 1

  const cStart = direction === 'ArrowRight' ? GRID_SIZE - 1 : 0
  const cEnd = direction === 'ArrowRight' ? -1 : GRID_SIZE
  const cStep = direction === 'ArrowRight' ? -1 : 1

  for (let r = rStart; r !== rEnd; r += rStep) {
    for (let c = cStart; c !== cEnd; c += cStep) {
      const tile = grid[r][c]
      if (!tile) continue

      let nextR = r
      let nextC = c

      while (true) {
        const testR = nextR + (direction === 'ArrowUp' ? -1 : direction === 'ArrowDown' ? 1 : 0)
        const testC = nextC + (direction === 'ArrowLeft' ? -1 : direction === 'ArrowRight' ? 1 : 0)

        if (testR < 0 || testR >= GRID_SIZE || testC < 0 || testC >= GRID_SIZE) break

        const target = grid[testR][testC]

        if (!target) {
          nextR = testR
          nextC = testC
          continue
        }

        if (target.val === tile.val && !target.isMerged) {
          if (r !== testR || c !== testC) moved = true

          mergedIds.add(tile.id)
          target.val *= 2
          target.isMerged = true
          scoreAdd += target.val

          tile.r = testR
          tile.c = testC
          grid[r][c] = null
          break
        } else {
          break
        }
      }

      if (!mergedIds.has(tile.id)) {
        if (r !== nextR || c !== nextC) {
          moved = true
          grid[r][c] = null
          grid[nextR][nextC] = tile
          tile.r = nextR
          tile.c = nextC
        }
      }
    }
  }

  if (moved) {
    isAnimating.value = true

    // ↩️ 将之前的状态存入历史
    history.value.push({ tiles: currentSnapshot, score: currentScore })
    if (history.value.length > 5) history.value.shift()

    score.value += scoreAdd
    if (score.value > bestScore.value) {
      bestScore.value = score.value
      localStorage.setItem('2048-best', bestScore.value.toString())
    }

    // 📳 震动反馈 (合并时震感更强)
    if (navigator.vibrate) {
      navigator.vibrate(mergedIds.size > 0 ? 30 : 10)
    }

    awaitNextFrame(() => {
      setTimeout(() => {
        tiles.value = tiles.value.filter(t => !mergedIds.has(t.id))

        tiles.value.forEach(t => {
          if (t.isMerged) setTimeout(() => t.isMerged = false, 100)
        })

        spawnTile()
        checkGameState()
        saveState() // 💾 自动存档
        isAnimating.value = false
      }, 150)
    })
  }
}

function awaitNextFrame(fn: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(fn))
}

function checkGameState() {
  if (tiles.value.some(t => t.val === WIN_VALUE) && gameState.value !== 'won') {
    gameState.value = 'won'
    saveState()
    return
  }

  if (tiles.value.length === GRID_SIZE * GRID_SIZE) {
    const grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(null))
    tiles.value.forEach(t => grid[t.r][t.c] = t)

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = grid[r][c]!.val
        if (c < GRID_SIZE - 1 && grid[r][c + 1]!.val === val) return
        if (r < GRID_SIZE - 1 && grid[r + 1][c]!.val === val) return
      }
    }
    gameState.value = 'over'
    localStorage.removeItem('2048-state') // 游戏结束清除存档
  }
}

// --- 输入处理 ---

function handleKeydown(e: KeyboardEvent) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
    move(e.key as any)
  }
}

let touchStartX = 0
let touchStartY = 0

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function handleTouchEnd(e: TouchEvent) {
  if (gameState.value !== 'playing') return

  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (Math.max(absDx, absDy) < 30) return

  if (absDx > absDy) {
    move(dx > 0 ? 'ArrowRight' : 'ArrowLeft')
  } else {
    move(dy > 0 ? 'ArrowDown' : 'ArrowUp')
  }
}

onMounted(() => {
  initGame(false)
  window.addEventListener('keydown', handleKeydown)
  if (boardRef.value) {
    boardRef.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    boardRef.value.addEventListener('touchend', handleTouchEnd, { passive: false })
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (boardRef.value) {
    boardRef.value.removeEventListener('touchstart', handleTouchStart)
    boardRef.value.removeEventListener('touchend', handleTouchEnd)
  }
})
</script>

<template>
  <div class="game-2048-container">
    <div class="header">
      <div class="title-box">
        <h1>2048</h1>
        <p>Join the numbers!</p>
      </div>

      <div class="controls-right">
        <div class="scores">
          <div class="score-box">
            <span class="label">SCORE</span>
            <span class="value">{{ score }}</span>
          </div>
          <div class="score-box best">
            <span class="label">BEST</span>
            <span class="value">{{ bestScore }}</span>
          </div>
        </div>

        <div class="buttons">
          <button class="action-btn" @click="undo" :disabled="history.length === 0 || gameState !== 'playing'"
            title="Undo">
            ↩️
          </button>
          <button class="action-btn restart" @click="initGame(true)" title="Restart">
            🔄
          </button>
        </div>
      </div>
    </div>

    <div class="board-container" ref="boardRef">
      <div v-if="gameState !== 'playing'" class="overlay" :class="gameState">
        <p class="message">{{ gameState === 'won' ? 'You Win!' : 'Game Over!' }}</p>
        <button class="restart-btn big" @click="initGame(true)">Try Again</button>
      </div>

      <div class="grid-bg">
        <div v-for="i in 16" :key="i" class="grid-cell"></div>
      </div>

      <TransitionGroup name="tile" tag="div" class="tile-layer">
        <div v-for="tile in tiles" :key="tile.id" class="tile"
          :class="{ 'tile-new': tile.isNew, 'tile-merged': tile.isMerged }" :style="{
            '--r': tile.r,
            '--c': tile.c,
            '--bg': getTileColor(tile.val).bg,
            '--fg': getTileColor(tile.val).fg
          }">
          {{ tile.val }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.game-2048-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  font-family: 'Arial', sans-serif;
  color: var(--vp-c-text-1);
  user-select: none;
}

/* --- 头部样式 --- */
.header {
  width: 100%;
  max-width: 400px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-box h1 {
  font-size: 3rem;
  font-weight: 800;
  margin: 0;
  line-height: 1;
  color: var(--vp-c-brand);
}

.title-box p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.controls-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.scores {
  display: flex;
  gap: 6px;
}

.score-box {
  background: var(--vp-c-bg-soft);
  padding: 4px 10px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 55px;
}

.score-box .label {
  font-size: 0.65rem;
  font-weight: bold;
  color: var(--vp-c-text-2);
}

.score-box .value {
  font-size: 1.1rem;
  font-weight: bold;
}

.buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  width: 40px;
  height: 36px;
  border-radius: 6px;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.restart {
  background: var(--vp-c-brand);
  color: white;
  border: none;
}

.action-btn.restart:hover {
  opacity: 0.9;
}

/* --- 棋盘样式 --- */
.board-container {
  position: relative;
  width: 400px;
  height: 400px;
  background: var(--vp-c-divider);
  border-radius: 8px;
  padding: 10px;
  touch-action: none;
  box-sizing: border-box;
}

@media (max-width: 450px) {
  .header {
    max-width: 320px;
  }

  .title-box h1 {
    font-size: 2.5rem;
  }

  .board-container {
    width: 320px;
    height: 320px;
    padding: 8px;
  }
}

.grid-bg {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
  height: 100%;
}

@media (max-width: 450px) {
  .grid-bg {
    gap: 8px;
  }
}

.grid-cell {
  background: var(--vp-c-bg);
  border-radius: 4px;
}

.tile-layer {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
}

@media (max-width: 450px) {
  .tile-layer {
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
  }
}

.tile {
  position: absolute;
  --gap: 10px;
  --size: calc((100% - 3 * var(--gap)) / 4);
  top: calc(var(--r) * (var(--size) + var(--gap)));
  left: calc(var(--c) * (var(--size) + var(--gap)));
  width: var(--size);
  height: var(--size);

  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  font-weight: bold;

  background: var(--bg);
  color: var(--fg);

  transition: top 0.15s ease-in-out, left 0.15s ease-in-out, transform 0.15s;
  z-index: 1;
}

@media (max-width: 450px) {
  .tile {
    --gap: 8px;
    font-size: 1.5rem;
  }
}

.tile[style*="--fg: #fff"] {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.tile-new {
  animation: pop 0.2s ease-out backwards;
}

.tile-merged {
  z-index: 10;
  animation: pop 0.2s ease-out;
}

@keyframes pop {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.dark .overlay {
  background: rgba(0, 0, 0, 0.7);
}

.overlay.over,
.overlay.won {
  opacity: 1;
  pointer-events: auto;
}

.message {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--vp-c-brand);
  margin-bottom: 20px;
}

.restart-btn.big {
  font-size: 1.2rem;
  padding: 10px 24px;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>